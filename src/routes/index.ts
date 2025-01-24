import { generateRandomSlug } from "@iwc/random-slug";
import { ulid } from "@std/ulid";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { html } from "hono/html";
import { db } from "../db/index.ts";
import { getUser, validateUser } from "../db/user.ts";
import { defaultTemplate } from "../templates/default.ts";
import { handleError } from "../utils/handleError.ts";

const ROUTE = {
  home: "/",
  session: {
    create: "/create-session",
    get: "/session/:id",
  },
} as const;

const COOKIE_USER_ID = "user_id";

const app = new Hono();

const session = createMiddleware<{
  Variables: { user: { id: string; name: string | null } };
}>(async (c, next) => {
  let id = await getCookie(c, COOKIE_USER_ID);

  if (!id) {
    id = ulid();

    try {
      await setCookie(c, COOKIE_USER_ID, id);
    } catch (e) {
      handleError(e);
    }
  }

  const user = await getUser(id);

  c.set("user", { id, name: user?.name ?? null });

  await next();
});

app.use(session);

// =====================================================================
// home
// =====================================================================
type HomeContentArgs = {
  userName: string;
  roomName: string;
};

const content = ({ userName, roomName }: HomeContentArgs) => {
  return html`
    <h1>Home</h1>

    <form action="/create-session" method="post">
      <div>
        <label for="user_name">Name</label>
        <input
          id="user_name"
          minlength="2"
          name="user_name"
          type="text"
          value="${userName}"
        />
      </div>
      <div>
        <label for="room_name">Room Name</label>
        <input
          id="room_name"
          minlength="6"
          name="room_name"
          type="text"
          value="${roomName}"
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  `;
};

app.get(ROUTE.home, session, (c) => {
  return c.html(
    defaultTemplate({
      title: "home",
      content: content({
        userName: c.get("user").name ?? "",
        roomName: generateRandomSlug(),
      }),
    })
  );
});

// =====================================================================
// pointing session
// =====================================================================

app.post(ROUTE.session.create, session, async (c) => {
  const body = await c.req.formData();
  const { id, name } = c.get("user");

  if (!name) {
    // handle absent name
  }

  try {
    const userData = validateUser({
      id: id,
      name: body.get("user_name"),
    });
    const user = await db.user.create(userData);

    if (!user) {
      // handle absent user
      return;
    }

    const pointingSession = await db.pointingSession.create({
      id: generateRandomSlug(),
      votes: new Map([[user.id, null]]),
      state: "open",
    });

    if (!pointingSession) {
      // handle absent pointing session
      return;
    }

    return c.redirect(`/session/${pointingSession.id}`);
  } catch (e) {
    handleError(e);
  }

  return c.html(
    defaultTemplate({
      title: "create session",
      content: html`
        <h1>Create Session</h1>
        <p>Something went wrong</p>
      `,
    })
  );
});

app.get(ROUTE.session.get, session, async (c) => {
  const { id } = c.req.param();

  const pointingSession = await db.pointingSession.get(id);

  if (!pointingSession) {
    return c.html(
      defaultTemplate({
        title: "Session Not Found",
        content: html`<h1>Not Found</h1>
          <p>
            Pointing session not found,
            <a href="${ROUTE.home}">create a new one</a>.
          </p>`,
      }),
      404
    );
  }

  return c.html(
    defaultTemplate({
      title: "session",
      content: html`
        <h1>Session</h1>
        <p>Session: ${pointingSession.id}</p>
      `,
    })
  );
});

export { app };
