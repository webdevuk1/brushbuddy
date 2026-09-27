import { createHash } from "node:crypto";
import { clientIp } from "./adminLoginGuard.js";

const MAX_REPORTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const memory = new Map();

function keyForIp(ip) {
  return createHash("sha256").update(`brushbuddy-bug|${ip}`).digest("hex");
}

function load(key) {
  const raw = memory.get(key);
  if (!raw) return { count: 0, windowStartMs: Date.now() };
  const now = Date.now();
  if (now - raw.windowStartMs >= WINDOW_MS) return { count: 0, windowStartMs: now };
  return raw;
}

export function getBugReportLock(req) {
  const ip = clientIp(req);
  const key = keyForIp(ip);
  const state = load(key);
  if (state.count >= MAX_REPORTS) {
    const retryAfterSec = Math.max(1, Math.ceil((state.windowStartMs + WINDOW_MS - Date.now()) / 1000));
    return { locked: true, retryAfterSec };
  }
  return { locked: false, key };
}

export function recordBugReport(key) {
  if (!key) return;
  const state = load(key);
  const now = Date.now();
  const next =
    now - state.windowStartMs >= WINDOW_MS
      ? { count: 1, windowStartMs: now }
      : { count: state.count + 1, windowStartMs: state.windowStartMs };
  memory.set(key, next);
}
