import * as v from "@valibot/valibot";
import { kv } from "./kv.ts";

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

export function createUser({ id, name }: User) {
  try {
    return kv.set(["user", id], { id, name });
  } catch (e) {
    console.error(e);
  }
}

export async function getUser(id: string): Promise<User | null> {
  const { value } = await kv.get<User>(["user", id]);

  return value;
}
