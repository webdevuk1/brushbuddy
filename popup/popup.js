(function () {
  "use strict";

  const enabled = document.getElementById("enabled");
  const nextTitle = document.getElementById("next-title");
  const nextSub = document.getElementById("next-sub");
  const doneLine = document.getElementById("done-line");
  const status = document.getElementById("status");
  const waiting = document.getElementById("waiting");
  const eyebrow = document.getElementById("eyebrow");
  let pendingId = "";

  document.getElementById("mark-done").addEventListener("click", () => act("done"));
  document.getElementById("mark-snooze").addEventListener("click", () => act("snooze"));

  document.getElementById("preview").addEventListener("click", async () => {
    status.textContent = "Showing your buddy…";
    BrushAlertSound.play();
    try {
      const res = await chrome.runtime.sendMessage({ type: "PREVIEW" });
      if (res && res.shown) status.textContent = "It’s on your open website tab.";
      else if (res && res.waiting) status.textContent = "Switch to a website tab and your buddy will be there.";
      else if (res && res.notified) status.textContent = "No website was open, so a notification was sent.";
      else status.textContent = "Open a normal website tab and try again.";
    } catch (_err) {
      status.textContent = "Couldn’t reach BrushBuddy. Reload the extension.";
    }
  });

  const editor = BrushRemindersEditor.wire({
    list: document.getElementById("list"),
    addButton: document.getElementById("add"),
    sound: document.getElementById("sound"),
    notifications: document.getElementById("notifications"),
    motivation: document.getElementById("motivation"),
    enabled: enabled,
    status: status,
    compact: true,
    onSaved: () => refreshSummary(),
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.state) applyLocalState(changes.state.newValue);
  });

  document.querySelector(".logo-img").src = BrushCharacters.mark;
  document.getElementById("version").textContent = "v" + chrome.runtime.getManifest().version;

  init();
  const tick = setInterval(refreshSummary, 60000);
  window.addEventListener("unload", () => clearInterval(tick));

  async function init() {
    const local = await chrome.storage.local.get("state");
    if (local.state) applyLocalState(local.state);
    try {
      const res = await chrome.runtime.sendMessage({ type: "GET_STATE" });
      if (res && res.state) applyRemoteState(res.state);
    } catch (_err) {
      if (!local.state) {
        nextTitle.textContent = "BrushBuddy is waking up";
        nextSub.textContent = "Close this and open it again.";
      }
    }
  }

  function applyLocalState(raw) {
    const state = BrushStorage.normalize(raw);
    editor.load({
      enabled: state.enabled,
      reminders: state.reminders,
      prefs: state.prefs,
    });
    paintSummary(localPublicState(state));
  }

  function applyRemoteState(state) {
    editor.load(state);
    paintSummary(state);
  }

  function localPublicState(state) {
    let next = null;
    if (state.enabled) {
      for (const reminder of state.reminders) {
        if (!reminder.enabled) continue;
        const when = BrushTime.nextOccurrence(reminder.hour, reminder.minute);
        if (!next || when < next.when) {
          next = {
            when: when,
            label: reminder.label,
            hour: reminder.hour,
            minute: reminder.minute,
            snooze: false,
          };
        }
      }
    }
    return {
      enabled: state.enabled,
      reminders: state.reminders,
      prefs: state.prefs,
      next: next,
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

  async function refreshSummary() {
    try {
      const res = await chrome.runtime.sendMessage({ type: "GET_STATE" });
      if (res && res.state) applyRemoteState(res.state);
    } catch (_err) {
      /* Popup closed or service worker asleep. */
    }
  }

  function paintSummary(state) {
    if (!state) return;
    enabled.checked = state.enabled;
    doneLine.hidden = !(state.lastDoneAt && BrushTime.isSameDay(state.lastDoneAt));
    pendingId = state.pending ? state.pending.id : "";
    waiting.hidden = !state.pending;
    const compactImg = true;

    if (state.pending) {
      document.getElementById("next-buddy").src = BrushCharacters.forPending(state.pending, compactImg);
      eyebrow.textContent = "Now";
      nextTitle.textContent = "Your buddy is waiting";
      nextSub.textContent = state.pending.preview
        ? "This is a preview on your website tabs."
        : "He’s on your open website tabs.";
      return;
    }

    document.getElementById("next-buddy").src = BrushCharacters.forNext(state.next, compactImg);
    eyebrow.textContent = "Next";
    if (!state.enabled) {
      nextTitle.textContent = "Reminders are off";
      nextSub.textContent = "Turn them on when you want a nudge.";
      return;
    }
    if (!state.next) {
      nextTitle.textContent = "No times yet";
      nextSub.textContent = "Add a time below.";
      return;
    }
    const clock = state.next.snooze
      ? BrushTime.formatWhen(state.next.when)
      : BrushTime.formatClock(state.next.hour, state.next.minute);
    nextTitle.textContent = state.next.snooze
      ? state.next.label + " · snoozed"
      : state.next.label + " · " + clock;
    nextSub.textContent = state.next.snooze
      ? "Back at " + clock + " · in " + BrushTime.formatCountdown(state.next.when)
      : "In " + BrushTime.formatCountdown(state.next.when);
  }

  async function act(action) {
    if (!pendingId) return;
    waiting.hidden = true;
    await chrome.runtime.sendMessage({ type: "PILL_ACTION", action: action, pendingId: pendingId });
    refreshSummary();
  }
})();
