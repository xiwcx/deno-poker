import {
  createPointingSession,
  getPointingSession,
} from "./pointing-session.ts";
import { createUser, getUser } from "./user.ts";

export const db = {
  pointingSession: {
    create: createPointingSession,
    get: getPointingSession,
  },
  user: {
    create: createUser,
    get: getUser,
  },
};
