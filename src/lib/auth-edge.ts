// Edge-safe (Web Crypto, no Node `crypto` import) so this can run in
// middleware. Single shared password for this single-user tool — there's
// no per-user auth, just a gate on the whole app.
const APP_PASSWORD = process.env.APP_PASSWORD || "PoolLeads2026!";

export const AUTH_COOKIE = "pool_tool_auth";

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function expectedCookieValue(): Promise<string> {
  return sha256Hex(APP_PASSWORD);
}

export function checkPassword(pw: string): boolean {
  return pw === APP_PASSWORD;
}
