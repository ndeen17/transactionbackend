import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { startSelfPing } from "./utils/selfPing.js";

async function main() {
  await connectDb();

  app.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT}`);
    startSelfPing();
  });
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
