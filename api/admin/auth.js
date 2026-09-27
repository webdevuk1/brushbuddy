import {
  buildClearSessionCookie,
  buildSessionCookie,
  createSessionToken,
  hasValidSession,
  isAdminLoginConfigured,
  verifyLoginCredentials,
} from "../_lib/adminAuth.js";
import {
  clearFailedLogins,
  getLoginLock,
  lockMessage,
  recordFailedLogin,
} from "../_lib/adminLoginGuard.js";

function parseBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return { error: "Invalid JSON body" };
    }
  }
  return { body: body || {} };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const configured = isAdminLoginConfigured();
    return res.status(200).json({
      ok: true,
      configured,
      loginRequired: true,
      authenticated: configured ? hasValidSession(req) : false,
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const parsed = parseBody(req);
  if (parsed.error) {
    return res.status(400).json({ ok: false, message: parsed.error });
  }

  const action = String(parsed.body.action || "").trim().toLowerCase();

  if (action === "logout") {
    res.setHeader("Set-Cookie", buildClearSessionCookie());
    return res.status(200).json({ ok: true, authenticated: false });
  }

  if (action === "login") {
    if (!isAdminLoginConfigured()) {
      return res.status(503).json({
        ok: false,
        message: "Admin login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD.",
      });
    }

    const lock = await getLoginLock(req);
    if (lock.locked) {
      res.setHeader("Retry-After", String(lock.retryAfterSec));
      return res.status(429).json({ ok: false, message: lockMessage(lock.retryAfterSec) });
    }

    const username = parsed.body.username;
    const password = parsed.body.password;

    if (!verifyLoginCredentials(username, password)) {
      const failed = await recordFailedLogin(req);
      if (failed.locked) {
        res.setHeader("Retry-After", String(failed.retryAfterSec));
        return res.status(429).json({ ok: false, message: lockMessage(failed.retryAfterSec) });
      }
      return res.status(401).json({ ok: false, message: "Invalid username or password." });
    }

    await clearFailedLogins(req);
    const token = createSessionToken(String(username || "").trim());
    res.setHeader("Set-Cookie", buildSessionCookie(token));
    return res.status(200).json({ ok: true, authenticated: true });
  }

  return res.status(400).json({
    ok: false,
    message: 'Unknown action. Use action: "login" or "logout".',
  });
}
