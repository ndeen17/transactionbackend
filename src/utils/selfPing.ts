const PING_INTERVAL_MS = 10 * 60 * 1000; // under Render free tier's ~15min idle-spindown window

/**
 * Render's free web services spin down after ~15 minutes with no inbound
 * requests. `RENDER_EXTERNAL_URL` is auto-injected by Render on deploy (not
 * set locally), so this only activates in that environment — pinging our
 * own public /health endpoint counts as inbound traffic and resets the
 * idle timer. This only prevents sleep while the process is already
 * running; it can't wake an instance that has already spun down.
 */
export function startSelfPing() {
  const baseUrl = process.env.RENDER_EXTERNAL_URL;
  if (!baseUrl) return;

  const pingUrl = `${baseUrl.replace(/\/$/, "")}/health`;

  const ping = () => {
    fetch(pingUrl)
      .then((res) => console.log(`[keep-alive] ping ${pingUrl} -> ${res.status}`))
      .catch((err) =>
        console.error("[keep-alive] ping failed:", err instanceof Error ? err.message : err),
      );
  };

  setInterval(ping, PING_INTERVAL_MS);
  console.log(`[keep-alive] enabled, pinging ${pingUrl} every ${PING_INTERVAL_MS / 60000}min`);
}
