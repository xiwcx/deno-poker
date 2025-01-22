import { app } from "./src/routes/index.ts";

Deno.serve(app.fetch);
