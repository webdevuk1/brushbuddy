import { createHash } from "node:crypto";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

const memory = new Map();

export function clientIp(req) {
  const vercel = req.headers?.["x-vercel-forwarded-for"];
  const forwarded = req.headers?.["x-forwarded-for"];
  const real = req.headers?.["x-real-ip"];
  const raw = String(vercel || forwarded || real || "")
    .split(",")[0]
    .trim();
  return raw || "unknown";
}

function attemptKey(ip) {
  return createHash("sha256").update(`brushbuddy-login|${ip}`).digest("hex");
}

function emptyState() {
  return { count: 0, windowStartMs: Date.now(), lockedUntilMs: 0 };
}

function normalize(raw) {
  if (!raw || typeof raw !== "object") return emptyState();
  return {
    count: Number(raw.count) || 0,
    windowStartMs: Number(raw.windowStartMs) || Date.now(),
    lockedUntilMs: Number(raw.lockedUntilMs) || 0,
  };
}

function activeState(state) {
  const now = Date.now();
  if (state.lockedUntilMs > now) return state;
  if (state.lockedUntilMs > 0) return emptyState();
  if (now - state.windowStartMs >= WINDOW_MS) return emptyState();
  return state;
}

function retryAfterSec(lockedUntilMs) {
  return Math.max(1, Math.ceil((lockedUntilMs - Date.now()) / 1000));
}

function loadState(key) {
  return activeState(normalize(memory.get(key)));
}

function saveState(key, state) {
  memory.set(key, state);
}

function clearState(key) {
  memory.delete(key);
}

export async function getLoginLock(req) {
  const key = attemptKey(clientIp(req));
  const state = loadState(key);
  if (state.lockedUntilMs > Date.now()) {
    return { locked: true, retryAfterSec: retryAfterSec(state.lockedUntilMs) };
  }
  return { locked: false, retryAfterSec: 0 };
}

export async function recordFailedLogin(req) {
  const key = attemptKey(clientIp(req));
  const current = loadState(key);
  const next = {
    count: current.count + 1,
    windowStartMs: current.count === 0 ? Date.now() : current.windowStartMs,
    lockedUntilMs: 0,
  };
  if (next.count >= MAX_ATTEMPTS) {
    next.lockedUntilMs = Date.now() + LOCK_MS;
  }
  saveState(key, next);
  if (next.lockedUntilMs > Date.now()) {
    return { locked: true, retryAfterSec: retryAfterSec(next.lockedUntilMs) };
  }
  return { locked: false, retryAfterSec: 0 };
}

export async function clearFailedLogins(req) {
  clearState(attemptKey(clientIp(req)));
}

export function lockMessage(retryAfterSec) {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
  return `Too many failed sign-ins. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
