import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "brushbuddy_admin_session";
const SESSION_DAYS = 7;

export function isAdminLoginConfigured() {
  return Boolean(process.env.ADMIN_USERNAME?.trim() && process.env.ADMIN_PASSWORD);
}

function expectedUsername() {
  return String(process.env.ADMIN_USERNAME || "").trim();
}

function expectedPassword() {
  return String(process.env.ADMIN_PASSWORD || "");
}

function sessionSecret() {
  return createHash("sha256")
    .update(`brushbuddy-admin|${expectedUsername()}|${expectedPassword()}`)
    .digest();
}

function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadB64) {
  return createHmac("sha256", sessionSecret()).update(payloadB64).digest("base64url");
}

function safeEqualString(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function parseCookies(req) {
  const header = req.headers?.cookie;
  if (!header || typeof header !== "string") return {};
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

export function createSessionToken(username = expectedUsername()) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payloadB64 = base64UrlEncode(JSON.stringify({ u: username, exp }));
  const sig = signPayload(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token) {
  if (!isAdminLoginConfigured() || !token || typeof token !== "string") return false;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;
  const expectedSig = signPayload(payloadB64);
  if (!safeEqualString(sig, expectedSig)) return false;
  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64));
    if (!payload?.exp || Date.now() > Number(payload.exp)) return false;
    if (!safeEqualString(payload.u, expectedUsername())) return false;
    return true;
  } catch {
    return false;
  }
}

export function hasValidSession(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

function cookieSecureFlag() {
  return process.env.VERCEL || process.env.NODE_ENV === "production" ? "; Secure" : "";
}

export function buildSessionCookie(token) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${cookieSecureFlag()}`;
}

export function buildClearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecureFlag()}`;
}

export function verifyLoginCredentials(username, password) {
  if (!isAdminLoginConfigured()) return false;
  return (
    safeEqualString(String(username || "").trim(), expectedUsername()) &&
    safeEqualString(String(password || ""), expectedPassword())
  );
}

export function requireAdminAuth(req, res) {
  if (!isAdminLoginConfigured()) {
    res.status(401).json({
      ok: false,
      message: "Admin login not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in Vercel.",
    });
    return false;
  }
  if (hasValidSession(req)) return true;
  res.status(401).json({ ok: false, message: "Unauthorized" });
  return false;
}
