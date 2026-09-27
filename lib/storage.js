(function (root) {
  "use strict";

  const DEFAULT_STATE = {
    version: 1,
    enabled: true,
    reminders: [
      { id: "morning", hour: 7, minute: 30, enabled: true, label: "Morning" },
      { id: "afternoon", hour: 13, minute: 0, enabled: false, label: "Afternoon" },
      { id: "night", hour: 21, minute: 30, enabled: true, label: "Night" },
    ],
    prefs: {
      sound: true,
      soundId: "classic",
      notifications: true,
      showMotivationLine: true,
      buddyPosition: null,
    },
    pending: null,
    lastDoneAt: null,
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sanitizeReminders(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const out = [];
    for (let i = 0; i < list.length && out.length < 6; i += 1) {
      const raw = list[i];
      if (!raw || typeof raw !== "object") continue;
      let id = String(raw.id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
      if (!id) id = "rem" + (out.length + 1);
      while (seen.has(id)) id += "x";
      seen.add(id);
      let hour = Number(raw.hour);
      let minute = Number(raw.minute);
      if (!Number.isFinite(hour)) hour = 8;
      if (!Number.isFinite(minute)) minute = 0;
      hour = Math.min(23, Math.max(0, Math.round(hour)));
      minute = Math.min(59, Math.max(0, Math.round(minute)));
      let label = String(raw.label || "Brush").replace(/\s+/g, " ").trim().slice(0, 24);
      if (!label) label = "Brush";
      out.push({
        id: id,
        hour: hour,
        minute: minute,
        enabled: Boolean(raw.enabled),
        label: label,
      });
    }
    return out;
  }

  function sanitizePosition(pos) {
    if (!pos || typeof pos !== "object") return null;
    const left = Number(pos.left);
    const top = Number(pos.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
    if (left < -200 || top < -200 || left > 10000 || top > 10000) return null;
    return { left: Math.round(left), top: Math.round(top) };
  }

  function sanitizeSoundId(id) {
    const key = String(id || "").trim();
    const allowed = new Set(["classic", "bells", "digital", "urgent"]);
    return allowed.has(key) ? key : "classic";
  }

  function sanitizePending(pending) {
    if (!pending || typeof pending !== "object") return null;
    if (typeof pending.id !== "string" || typeof pending.firedAt !== "number") return null;
    if (!Number.isFinite(pending.firedAt)) return null;
    return {
      id: pending.id.slice(0, 120),
      reminderId: String(pending.reminderId || "").slice(0, 80),
      label: String(pending.label || "Brush").slice(0, 32),
      firedAt: pending.firedAt,
      preview: Boolean(pending.preview),
    };
  }

  function normalize(raw) {
    if (!raw || typeof raw !== "object") return clone(DEFAULT_STATE);
    const prefs = raw.prefs && typeof raw.prefs === "object" ? raw.prefs : {};
    return {
      version: 1,
      enabled: raw.enabled !== false,
      reminders: Array.isArray(raw.reminders)
        ? sanitizeReminders(raw.reminders)
        : clone(DEFAULT_STATE.reminders),
      prefs: {
        sound: Boolean(prefs.sound),
        soundId: sanitizeSoundId(prefs.soundId),
        notifications: prefs.notifications !== false,
        showMotivationLine: prefs.showMotivationLine !== false,
        buddyPosition: sanitizePosition(prefs.buddyPosition || prefs.pillPosition),
      },
      pending: sanitizePending(raw.pending),
      lastDoneAt: typeof raw.lastDoneAt === "number" && Number.isFinite(raw.lastDoneAt) ? raw.lastDoneAt : null,
    };
  }

  async function load() {
    const data = await chrome.storage.local.get("state");
    return normalize(data.state);
  }

  async function ensure() {
    const data = await chrome.storage.local.get("state");
    const normalized = data.state ? normalize(data.state) : clone(DEFAULT_STATE);
    await chrome.storage.local.set({ state: normalized });
    return normalized;
  }

  async function update(mutator) {
    const current = await load();
    mutator(current);
    const normalized = normalize(current);
    await chrome.storage.local.set({ state: normalized });
    return normalized;
  }

  root.BrushStorage = {
    DEFAULT_STATE: DEFAULT_STATE,
    load: load,
    ensure: ensure,
    update: update,
    sanitizeReminders: sanitizeReminders,
    normalize: normalize,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
