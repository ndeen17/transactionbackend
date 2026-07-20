import { mkdir } from "node:fs/promises";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";

async function main() {
  await mkdir(env.KYC_UPLOAD_DIR, { recursive: true });
  await connectDb();

  app.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
