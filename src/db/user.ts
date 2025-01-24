import * as v from "@valibot/valibot";
import { handleError } from "../utils/handleError.ts";
import { kvClient } from "./kv.ts";

/**
 * https://github.com/ulid/spec
 */
const ulidSchema = v.pipe(v.string(), v.regex(/^[0-9A-Z]{26}$/));

const userSchema = v.object({
  id: ulidSchema,
  name: v.pipe(v.string(), v.minLength(2)),
});

export type User = v.InferOutput<typeof userSchema>;

export const validateUser = (args: Record<keyof User, unknown>): User =>
  v.parse(userSchema, args);

export async function createUser({ id, name }: User) {
  const key = ["user", id];

  try {
    const result = await kvClient.set(key, { id, name });

    if (!result.ok) {
      throw new Error("Failed to create user");
    }

    const { value } = await kvClient.get<User>(key);

    if (!value) {
      throw new Error("Failed to get user");
    }

    return value;
  } catch (e) {
    handleError(e);
  }
}

export async function getUser(id: string): Promise<User | null> {
  const { value } = await kvClient.get<User>(["user", id]);

  return value;
}
