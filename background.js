importScripts("lib/time.js", "lib/storage.js");

const ALARM_PREFIX = "brush:";
const SNOOZE_PREFIX = "snooze:";
const DEFAULT_SNOOZE_MINUTES = 15;

function snoozeMinutesFrom(state) {
  if (!state || !state.prefs) return DEFAULT_SNOOZE_MINUTES;
  return BrushStorage.sanitizeSnoozeMinutes(state.prefs.snoozeMinutes);
}

function snoozeMsFrom(state) {
  return snoozeMinutesFrom(state) * 60 * 1000;
}

function snoozeButtonLabel(state) {
  return "Snooze " + snoozeMinutesFrom(state) + " min";
}
const NUDGE_PREFIX = "nudge:";
const NUDGE_MS = 60 * 1000;
const PENDING_TTL_MS = 45 * 60 * 1000;
const PREVIEW_TTL_MS = 10 * 60 * 1000;

let hydrated = false;
let reminderOn = false;
let stateCache = { at: 0, payload: null };
let cachedState = null;
const scriptedTabs = new Set();
const tabWakeTimers = new Map();

chrome.tabs.onRemoved.addListener((tabId) => {
  scriptedTabs.delete(tabId);
  clearTimeout(tabWakeTimers.get(tabId));
  tabWakeTimers.delete(tabId);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.state) return;
  cachedState = changes.state.newValue ? BrushStorage.normalize(changes.state.newValue) : null;
  bustStateCache();
});

async function getPublicState() {
  const now = Date.now();
  if (stateCache.payload && now - stateCache.at < 1500) return stateCache.payload;
  const state = await readState();
  const payload = { ok: true, state: await publicState(state) };
  stateCache = { at: now, payload: payload };
  return payload;
}

function bustStateCache() {
  stateCache = { at: 0, payload: null };
  cachedState = null;
}

async function readState() {
  if (cachedState) return cachedState;
  cachedState = await BrushStorage.load();
  return cachedState;
}

function rememberState(state) {
  cachedState = state;
  stateCache = { at: 0, payload: null };
}

chrome.runtime.onInstalled.addListener((details) => {
  bootstrap().catch((err) => console.error("Brush Buddies install", err));
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onStartup.addListener(() => {
  bootstrap().catch((err) => console.error("Brush Buddies startup", err));
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== "complete" || !isWebTab(tab) || !reminderOn) return;
  clearTimeout(tabWakeTimers.get(tabId));
  tabWakeTimers.set(
    tabId,
    setTimeout(() => {
      tabWakeTimers.delete(tabId);
      wakeTab(tabId).catch((err) => console.error("Brush Buddies tab", err));
    }, 120)
  );
});

chrome.alarms.onAlarm.addListener((alarm) => {
  onAlarm(alarm).catch((err) => console.error("Brush Buddies alarm", err));
});

const TRUSTED_SITE_PREFIXES = [
  "https://brushbuddy-roan.vercel.app/",
  "https://webdevuk1.github.io/brushbuddy/",
];

function senderPageUrl(sender) {
  if (!sender) return "";
  const tabUrl = sender.tab && sender.tab.url ? String(sender.tab.url) : "";
  if (tabUrl.startsWith("http://") || tabUrl.startsWith("https://")) return tabUrl;
  return String(sender.url || "");
}

function isOurExtension(sender) {
  return Boolean(sender && sender.id === chrome.runtime.id);
}

function isExtensionUiSender(sender) {
  const url = senderPageUrl(sender);
  return url.includes("/popup/") || url.includes("/options/");
}

function isTrustedWebsiteSender(sender) {
  const url = senderPageUrl(sender);
  return TRUSTED_SITE_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function mayHandleMessage(sender, type) {
  if (!isOurExtension(sender)) return false;
  if (type === "GET_PENDING" || type === "PILL_ACTION" || type === "SAVE_POSITION") return true;
  if (type === "GET_STATE" || type === "SAVE" || type === "PREVIEW") {
    return isExtensionUiSender(sender) || isTrustedWebsiteSender(sender);
  }
  return false;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  onMessage(message, sender)
    .then(sendResponse)
    .catch((err) => {
      console.error("Brush Buddies message", err);
      sendResponse({ ok: false, error: String(err && err.message ? err.message : err) });
    });
  return true;
});

chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
  const action = buttonIndex === 0 ? "done" : "snooze";
  onPillAction(action, notifId).catch((err) => console.error("Brush Buddies notification", err));
});

chrome.notifications.onClicked.addListener((notifId) => {
  BrushStorage.load()
    .then((state) => {
      if (!state.pending || state.pending.id !== notifId) return null;
      return deliver(state.pending);
    })
    .catch((err) => console.error("Brush Buddies notification click", err));
});

function isWebTab(tab) {
  const url = tab && tab.url ? tab.url : "";
  return url.startsWith("http://") || url.startsWith("https://");
}

function pendingTtl(pending) {
  return pending && pending.preview ? PREVIEW_TTL_MS : PENDING_TTL_MS;
}

function setReminder(on) {
  hydrated = true;
  reminderOn = Boolean(on);
}

async function bootstrap() {
  const state = await BrushStorage.ensure();
  cachedState = state;
  await reschedule(state);
  const pending = await freshPending(state);
  setReminder(state.enabled && pending);
  if (!state.enabled || !pending) {
    await hideEverywhere();
    return;
  }
  await injectOpenTabs();
}

async function freshPending(state) {
  if (!state.pending) return null;
  if (Date.now() - state.pending.firedAt <= pendingTtl(state.pending)) return state.pending;
  const staleId = state.pending.id;
  const updated = await BrushStorage.update((current) => {
    if (current.pending && current.pending.id === staleId) current.pending = null;
  });
  rememberState(updated);
  await chrome.notifications.clear(staleId);
  await clearPendingNudge(staleId);
  return null;
}

function showMessage(state, pending) {
  return {
    type: "SHOW_PILL",
    pending: pending,
    buddyPosition: state.prefs.buddyPosition,
    sound: Boolean(state.prefs.sound),
    soundId: state.prefs.soundId || "classic",
    showMotivationLine: state.prefs.showMotivationLine !== false,
    snoozeMinutes: snoozeMinutesFrom(state),
  };
}

async function wakeTab(tabId) {
  if (!reminderOn) return;
  const state = await readState();
  const pending = await freshPending(state);
  if (!pending) {
    setReminder(false);
    return;
  }
  const message = showMessage(state, pending);
  if (await pingTab(tabId, message)) return;
  try {
    await ensureScripts(tabId);
    await pingTab(tabId, message);
  } catch (_err) {
    /* This tab cannot host the buddy. */
  }
}

async function pingTab(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    return true;
  } catch (_err) {
    return false;
  }
}

async function onMessage(message, sender) {
  if (!message || typeof message.type !== "string") return { ok: false };
  if (!mayHandleMessage(sender, message.type)) return { ok: false, error: "forbidden" };
  if (message.type === "GET_STATE") {
    return getPublicState();
  }
  if (message.type === "SAVE") {
    return saveFromUi(message);
  }
  if (message.type === "PREVIEW") {
    const result = await present("Preview", "preview", true);
    return { ok: true, shown: result.shown, notified: result.notified, waiting: result.waiting };
  }
  if (message.type === "GET_PENDING") {
    return getPending();
  }
  if (message.type === "PILL_ACTION") {
    return onPillAction(message.action, message.pendingId);
  }
  if (message.type === "SAVE_POSITION") {
    const left = Number(message.left);
    const top = Number(message.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) return { ok: false };
    const state = await BrushStorage.update((state) => {
      state.prefs.buddyPosition = { left: left, top: top };
    });
    rememberState(state);
    return { ok: true };
  }
  return { ok: false };
}

async function saveFromUi(message) {
  let state = await BrushStorage.update((current) => {
    if (typeof message.enabled === "boolean") current.enabled = message.enabled;
    if (Array.isArray(message.reminders)) current.reminders = message.reminders;
    if (message.prefs && typeof message.prefs === "object") {
      if (typeof message.prefs.sound === "boolean") current.prefs.sound = message.prefs.sound;
      if (typeof message.prefs.soundId === "string") current.prefs.soundId = message.prefs.soundId;
      if (typeof message.prefs.notifications === "boolean") {
        current.prefs.notifications = message.prefs.notifications;
      }
      if (typeof message.prefs.showMotivationLine === "boolean") {
        current.prefs.showMotivationLine = message.prefs.showMotivationLine;
      }
      if (message.prefs.snoozeMinutes !== undefined) {
        current.prefs.snoozeMinutes = BrushStorage.sanitizeSnoozeMinutes(message.prefs.snoozeMinutes);
      }
    }
    if (!current.enabled) current.pending = null;
  });
  await reschedule(state);
  if (!state.enabled) {
    if (state.pending && state.pending.id) await clearPendingNudge(state.pending.id);
    setReminder(false);
    await clearSnoozes();
    const previous = await chrome.notifications.getAll();
    await Promise.all(Object.keys(previous).map((id) => chrome.notifications.clear(id)));
    await hideEverywhere();
  }
  rememberState(state);
  return { ok: true, state: await publicState(state) };
}

async function getPending() {
  const state = await readState();
  if (!state.pending) {
    return pendingPayload(state, null);
  }
  const pending = await freshPending(state);
  if (!pending) {
    setReminder(false);
    const fresh = await readState();
    return pendingPayload(fresh, null);
  }
  return pendingPayload(state, pending);
}

function pendingPayload(state, pending) {
  return {
    ok: true,
    pending: pending,
    buddyPosition: state.prefs.buddyPosition,
    sound: Boolean(state.prefs.sound),
    soundId: state.prefs.soundId || "classic",
    showMotivationLine: state.prefs.showMotivationLine !== false,
    snoozeMinutes: snoozeMinutesFrom(state),
  };
}

async function onAlarm(alarm) {
  if (!alarm || typeof alarm.name !== "string") return;
  const nudge = alarm.name.startsWith(NUDGE_PREFIX);
  const snooze = alarm.name.startsWith(SNOOZE_PREFIX);
  const daily = alarm.name.startsWith(ALARM_PREFIX);
  if (nudge) {
    const pendingId = alarm.name.slice(NUDGE_PREFIX.length);
    const state = await readState();
    if (!state.enabled || !state.pending || state.pending.id !== pendingId || state.pending.preview) {
      await chrome.alarms.clear(alarm.name);
      return;
    }
    await deliver(state.pending);
    await armPendingNudge(pendingId);
    return;
  }
  if (!snooze && !daily) return;

  const state = await readState();
  if (!state.enabled) {
    if (snooze) await chrome.alarms.clear(alarm.name);
    return;
  }

  const reminderId = alarm.name.slice((snooze ? SNOOZE_PREFIX : ALARM_PREFIX).length);
  const reminder = state.reminders.find((item) => item.id === reminderId);

  if (daily) {
    if (!reminder || !reminder.enabled) return;
    const when = BrushTime.nextOccurrence(reminder.hour, reminder.minute, new Date(Date.now() + 60 * 1000));
    await chrome.alarms.create(alarm.name, { when: when });
  }

  const label = snooze ? "Snoozed" : reminder && reminder.label ? reminder.label : "Brush";
  await present(label, reminderId, false);
}

async function present(label, reminderId, preview) {
  const previous = await readState();
  if (previous.pending && previous.pending.id) {
    await chrome.notifications.clear(previous.pending.id);
  }
  const pending = {
    id: String(reminderId) + ":" + Date.now(),
    reminderId: reminderId,
    label: label,
    firedAt: Date.now(),
    preview: Boolean(preview),
  };
  const state = await BrushStorage.update((state) => {
    state.pending = pending;
  });
  rememberState(state);
  setReminder(true);
  const result = await deliver(pending);
  if (!preview) await armPendingNudge(pending.id);
  return result;
}

async function armPendingNudge(pendingId) {
  if (!pendingId) return;
  const name = NUDGE_PREFIX + pendingId;
  await chrome.alarms.clear(name);
  await chrome.alarms.create(name, { when: Date.now() + NUDGE_MS });
}

async function clearPendingNudge(pendingId) {
  if (!pendingId) return;
  await chrome.alarms.clear(NUDGE_PREFIX + pendingId);
}

async function deliver(pending) {
  const state = await readState();
  const message = showMessage(state, pending);
  const pages = (await chrome.tabs.query({})).filter(isWebTab);
  const results = await Promise.all(
    pages.map((tab) => trySend(tab, message))
  );
  if (results.some((result) => result.shown)) return { shown: true, notified: false, waiting: false };
  if (results.some((result) => result.connected)) return { shown: false, notified: false, waiting: true };
  let notified = false;
  if (state.prefs.notifications) notified = await notify(pending, state.prefs.sound, state);
  return { shown: false, notified: notified, waiting: false };
}

async function ensureScripts(tabId) {
  if (scriptedTabs.has(tabId)) return;
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["lib/characters.js", "lib/sound-tones.js", "lib/alert-sound.js", "content/buddy.js"],
  });
  scriptedTabs.add(tabId);
}

async function trySend(tab, message) {
  if (!tab || tab.id == null || !isWebTab(tab)) return { connected: false, shown: false };
  try {
    const res = await chrome.tabs.sendMessage(tab.id, message);
    return { connected: true, shown: Boolean(res && res.shown) };
  } catch (_err) {
    try {
      await ensureScripts(tab.id);
      const res = await chrome.tabs.sendMessage(tab.id, message);
      return { connected: true, shown: Boolean(res && res.shown) };
    } catch (_again) {
      return { connected: false, shown: false };
    }
  }
}

async function injectOpenTabs() {
  const pages = (await chrome.tabs.query({})).filter(isWebTab);
  await Promise.all(
    pages.map(async (tab) => {
      if (tab.id == null) return;
      try {
        await ensureScripts(tab.id);
      } catch (_err) {
        /* Restricted pages cannot host the buddy. */
      }
    })
  );
}

async function hideEverywhere() {
  const tabs = (await chrome.tabs.query({})).filter(isWebTab);
  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id == null) return;
      try {
        await chrome.tabs.sendMessage(tab.id, { type: "HIDE_PILL" });
      } catch (_err) {
        /* This tab has no Brush Buddies content script. */
      }
    })
  );
}

async function notify(pending, sound, state) {
  try {
    const label = pending.label && pending.label !== "Preview"
      ? pending.label + " — I'm brushing. Your turn."
      : "I'm brushing. Your turn.";
    await chrome.notifications.create(pending.id, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title: "Brush Buddies",
      message: label,
      buttons: [{ title: "Done" }, { title: snoozeButtonLabel(state) }],
      silent: !sound,
      priority: 1,
    });
    return true;
  } catch (err) {
    console.error("Brush Buddies notify", err);
    return false;
  }
}

async function onPillAction(action, pendingId) {
  if (action !== "done" && action !== "snooze" && action !== "dismiss") {
    return { ok: false };
  }
  const state = await readState();
  const pending = state.pending;
  if (!pending) {
    await hideEverywhere();
    return { ok: true };
  }
  if (pendingId && pendingId !== pending.id) return { ok: false };

  await chrome.notifications.clear(pending.id);
  await clearPendingNudge(pending.id);
  const next = await BrushStorage.update((current) => {
    if (!current.pending || current.pending.id !== pending.id) return;
    if (action === "done") current.lastDoneAt = Date.now();
    current.pending = null;
  });
  rememberState(next);
  setReminder(false);
  await hideEverywhere();

  if (action === "snooze") {
    await chrome.alarms.clear(SNOOZE_PREFIX + pending.reminderId);
    await chrome.alarms.create(SNOOZE_PREFIX + pending.reminderId, {
      when: Date.now() + snoozeMsFrom(state),
    });
  }
  return { ok: true };
}

async function reschedule(state) {
  const existing = await chrome.alarms.getAll();
  await Promise.all(
    existing
      .filter((alarm) => alarm.name.startsWith(ALARM_PREFIX))
      .map((alarm) => chrome.alarms.clear(alarm.name))
  );
  if (!state.enabled) return;
  for (const reminder of state.reminders) {
    if (!reminder.enabled) continue;
    const when = BrushTime.nextOccurrence(reminder.hour, reminder.minute);
    await chrome.alarms.create(ALARM_PREFIX + reminder.id, { when: when });
  }
}

async function clearSnoozes() {
  const existing = await chrome.alarms.getAll();
  await Promise.all(
    existing
      .filter((alarm) => alarm.name.startsWith(SNOOZE_PREFIX))
      .map((alarm) => chrome.alarms.clear(alarm.name))
  );
}

async function publicState(state) {
  return {
    enabled: state.enabled,
    reminders: state.reminders,
    prefs: {
      sound: state.prefs.sound,
      soundId: state.prefs.soundId || "classic",
      notifications: state.prefs.notifications,
      showMotivationLine: state.prefs.showMotivationLine,
      snoozeMinutes: snoozeMinutesFrom(state),
    },
    next: await nextAlarm(state),
    lastDoneAt: state.lastDoneAt,
    pending: state.pending
      ? {
          id: state.pending.id,
          label: state.pending.label,
          firedAt: state.pending.firedAt,
          preview: Boolean(state.pending.preview),
        }
      : null,
  };
}

async function nextAlarm(state) {
  if (!state.enabled) return null;
  let best = null;
  for (const reminder of state.reminders) {
    if (!reminder.enabled) continue;
    const when = BrushTime.nextOccurrence(reminder.hour, reminder.minute);
    if (!best || when < best.when) {
      best = {
        when: when,
        label: reminder.label,
        id: reminder.id,
        hour: reminder.hour,
        minute: reminder.minute,
        snooze: false,
      };
    }
  }
  const alarms = await chrome.alarms.getAll();
  for (const alarm of alarms) {
    if (!alarm.name.startsWith(SNOOZE_PREFIX) || typeof alarm.scheduledTime !== "number") continue;
    if (best && alarm.scheduledTime >= best.when) continue;
    const reminderId = alarm.name.slice(SNOOZE_PREFIX.length);
    const reminder = state.reminders.find((item) => item.id === reminderId);
    best = {
      when: alarm.scheduledTime,
      label: reminder && reminder.label ? reminder.label : "Snoozed",
      id: reminderId,
      snooze: true,
    };
  }
  return best;
}
