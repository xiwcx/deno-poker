import { generateRandomSlug } from "@iwc/random-slug";
import { ulid } from "@std/ulid";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { html } from "hono/html";
import { createUser, getUser, validateUser } from "../db/user.ts";
import { defaultTemplate } from "../templates/default.ts";

const ROUTE = {
  home: "/",
  createSession: "/create-session",
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
      console.error(e);
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
          type="text"
          name="user_name"
          id="user_name"
          value="${userName}"
        />
      </div>
      <div>
        <label for="room_name">Room Name</label>
        <input
          type="text"
          name="room_name"
          id="room_name"
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
// create session
// =====================================================================

app.post(ROUTE.createSession, session, async (c) => {
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
    const user = await createUser(userData);

    if (user) {
      return c.redirect(ROUTE.home);
    }
  } catch (e) {
    console.error(e);
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

export { app };
