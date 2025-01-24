import * as v from "@valibot/valibot";
import { handleError } from "../utils/handleError.ts";
import { kvClient } from "./kv.ts";

const pointingSessionSchema = v.object({
  id: v.string(),
  votes: v.map(v.string(), v.nullable(v.number())),
  state: v.union([v.literal("open"), v.literal("closed")]),
});

export type PointingSession = v.InferOutput<typeof pointingSessionSchema>;

export const validatePointingSession = (
  args: Record<keyof PointingSession, unknown>
): PointingSession => v.parse(pointingSessionSchema, args);

const pointingSesssion = "pointing-session" as const;

export async function createPointingSession({
  id,
  votes,
  state,
}: PointingSession) {
  const key = [pointingSesssion, id];

  try {
    const res = await kvClient
      .atomic()
      .check({ key, versionstamp: null })
      .set(key, { id, votes, state })
      .commit();

    if (res.ok) {
      const result = await kvClient.get<PointingSession>(key);

      return result.value;
    } else {
      throw new Error("Failed to create pointing session");
    }
  } catch (e) {
    handleError(e);
  }
}

export async function getPointingSession(id: string) {
  try {
    const result = await kvClient.get<PointingSession>([pointingSesssion, id]);

    console.log(result.value);

    return result.value;
  } catch (e) {
    handleError(e);
  }
}
