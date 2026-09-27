(function (root) {
  "use strict";

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function clampHour(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 8;
    return Math.min(23, Math.max(0, Math.round(n)));
  }

  function clampMinute(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.min(59, Math.max(0, Math.round(n)));
  }

  const SNOOZE_MINUTES_OPTIONS = [15, 30, 45, 60, 90, 120];

  function sanitizeSnoozeMinutes(value) {
    const n = Number(value);
    if (SNOOZE_MINUTES_OPTIONS.includes(n)) return n;
    return 15;
  }

  function wire(config) {
    const list = config.list;
    const addButton = config.addButton;
    const sound = config.sound;
    const soundTone = config.soundTone;
    const soundPlay = config.soundPlay;
    const notifications = config.notifications;
    const motivation = config.motivation;
    const snoozeDuration = config.snoozeDuration;
    const enabled = config.enabled;
    const status = config.status;
    const compact = Boolean(config.compact);
    const useConfirm = config.confirmBeforeDisable !== false && root.BrushConfirm;

    let reminders = [];
    let timer = 0;
    let saveChain = Promise.resolve();
    let ignoreRemoteLoadUntil = 0;

    list.addEventListener("input", (event) => {
      if (event.target.classList.contains("label")) onEdit(event);
    });
    list.addEventListener("change", onEdit);
    list.addEventListener("focusout", (event) => {
      if (event.target.classList.contains("time-hour") || event.target.classList.contains("time-minute")) {
        normalizeTimeField(event.target);
        onEdit(event);
        return;
      }
      if (!event.target.classList.contains("label")) return;
      if (event.target.value.trim()) return;
      event.target.value = "Brush";
      onEdit(event);
    });
    list.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-remove]");
      if (!remove) return;
      const row = remove.closest("[data-id]");
      reminders = reminders.filter((item) => item.id !== row.dataset.id);
      render();
      scheduleSave();
    });

    if (addButton) {
      addButton.addEventListener("click", () => {
        if (reminders.length >= 6) return;
        reminders.push({
          id: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
          hour: 8,
          minute: 0,
          enabled: true,
          label: "Reminder",
        });
        render();
        scheduleSave();
      });
    }

    async function confirmTurnOff() {
      if (!useConfirm) return true;
      return root.BrushConfirm.ask();
    }

    function holdUntilTurnOffConfirmed(input, onConfirmed) {
      let busy = false;
      async function requestOff(event) {
        if (!input.checked) return;
        event.preventDefault();
        if (busy) return;
        busy = true;
        try {
          const ok = await confirmTurnOff();
          if (!ok) return;
          input.checked = false;
          onConfirmed();
        } finally {
          busy = false;
        }
      }
      input.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        requestOff(event);
      });
      input.addEventListener("keydown", (event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        requestOff(event);
      });
    }

    if (enabled) {
      holdUntilTurnOffConfirmed(enabled, scheduleSave);
      enabled.addEventListener("change", () => {
        if (enabled.checked) scheduleSave();
      });
    }
    if (sound) sound.addEventListener("change", scheduleSave);
    if (notifications) notifications.addEventListener("change", scheduleSave);
    if (motivation) motivation.addEventListener("change", scheduleSave);
    if (snoozeDuration) snoozeDuration.addEventListener("change", scheduleSave);
    if (snoozeDuration) {
      snoozeDuration.replaceChildren();
      SNOOZE_MINUTES_OPTIONS.forEach((minutes) => {
        const option = document.createElement("option");
        option.value = String(minutes);
        option.textContent = minutes + " minutes";
        snoozeDuration.appendChild(option);
      });
    }
    if (soundTone && root.BrushSoundTones) {
      soundTone.replaceChildren();
      BrushSoundTones.options().forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt.id;
        option.textContent = opt.label;
        soundTone.appendChild(option);
      });
      soundTone.addEventListener("change", scheduleSave);
    }
    if (soundPlay) {
      soundPlay.addEventListener("click", (event) => {
        event.preventDefault();
        const id = soundTone ? soundTone.value : "classic";
        if (root.BrushAlertSound) BrushAlertSound.play(id);
        else if (root.BrushSoundTones) BrushSoundTones.preview(id);
      });
    }

    function normalizeTimeField(el) {
      const row = el.closest("[data-id]");
      if (!row) return;
      const hourEl = row.querySelector(".time-hour");
      const minEl = row.querySelector(".time-minute");
      if (!hourEl || !minEl) return;
      hourEl.value = String(clampHour(hourEl.value));
      minEl.value = pad(clampMinute(minEl.value));
    }

    function syncPrefsFromState(state) {
      if (enabled) enabled.checked = state.enabled;
      if (sound) sound.checked = state.prefs.sound;
      if (notifications) notifications.checked = state.prefs.notifications;
      if (motivation) motivation.checked = state.prefs.showMotivationLine;
      if (snoozeDuration) {
        snoozeDuration.value = String(sanitizeSnoozeMinutes(state.prefs.snoozeMinutes));
      }
      if (soundTone) {
        soundTone.value = root.BrushSoundTones
          ? BrushSoundTones.sanitize(state.prefs.soundId)
          : state.prefs.soundId || "classic";
      }
    }

    function load(state, source) {
      if (source === "remote" && Date.now() < ignoreRemoteLoadUntil) return;
      reminders = state.reminders.map((item) => Object.assign({}, item));
      syncPrefsFromState(state);
      if (source === "save") return;
      render();
    }

    async function onEdit(event) {
      const row = event.target.closest("[data-id]");
      if (!row) return;
      const item = reminders.find((reminder) => reminder.id === row.dataset.id);
      if (!item) return;
      if (event.target.classList.contains("label")) {
        item.label = event.target.value;
        scheduleSave();
        return;
      }
      if (event.target.classList.contains("time-hour") || event.target.classList.contains("time-minute")) {
        const hourEl = row.querySelector(".time-hour");
        const minEl = row.querySelector(".time-minute");
        item.hour = clampHour(hourEl && hourEl.value);
        item.minute = clampMinute(minEl && minEl.value);
        scheduleSave();
        return;
      }
      if (event.target.classList.contains("on")) {
        if (!event.target.checked) return;
        item.enabled = true;
        scheduleSave();
      }
    }

    function render() {
      list.replaceChildren();
      reminders.forEach((item) => {
        const row = document.createElement("li");
        row.className = compact ? "row row-compact" : "row card";
        row.dataset.id = item.id;

        const label = document.createElement("input");
        label.className = compact ? "text-input label compact-label" : "text-input label";
        label.maxLength = 24;
        label.value = item.label;
        label.setAttribute("aria-label", "Reminder name");

        const timeWrap = document.createElement("div");
        timeWrap.className = "time-fields";

        const hour = document.createElement("input");
        hour.className = "time-hour";
        hour.type = "number";
        hour.min = "0";
        hour.max = "23";
        hour.inputMode = "numeric";
        hour.value = String(item.hour);
        hour.setAttribute("aria-label", item.label + " hour");

        const sep = document.createElement("span");
        sep.className = "time-sep";
        sep.textContent = ":";

        const minute = document.createElement("input");
        minute.className = "time-minute";
        minute.type = "number";
        minute.min = "0";
        minute.max = "59";
        minute.inputMode = "numeric";
        minute.value = pad(item.minute);
        minute.setAttribute("aria-label", item.label + " minute");

        timeWrap.append(hour, sep, minute);

        const toggle = document.createElement("label");
        toggle.className = "switch";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "on";
        checkbox.checked = item.enabled;
        checkbox.setAttribute("aria-label", "Enable " + item.label);
        const track = document.createElement("span");
        track.className = "track";
        toggle.append(checkbox, track);
        holdUntilTurnOffConfirmed(checkbox, () => {
          item.enabled = false;
          scheduleSave();
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "icon-btn";
        remove.dataset.remove = "true";
        remove.setAttribute("aria-label", "Remove " + item.label);
        remove.textContent = "×";

        row.append(label, timeWrap, toggle, remove);
        list.appendChild(row);
      });
      if (addButton) addButton.hidden = reminders.length >= 6;
    }

    function scheduleSave() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        saveChain = saveChain
          .then(persist)
          .then(() => {
            if (config.onSaved) config.onSaved();
          })
          .catch(() => {
            if (status) status.textContent = "Couldn’t save. Try again.";
          });
      }, 400);
    }

    function buildPrefs() {
      const prefs = {
        soundId: soundTone ? soundTone.value : "classic",
      };
      if (sound) prefs.sound = sound.checked;
      if (notifications) prefs.notifications = notifications.checked;
      if (motivation) prefs.showMotivationLine = motivation.checked;
      if (snoozeDuration) prefs.snoozeMinutes = Number(snoozeDuration.value);
      return prefs;
    }

    async function persist() {
      ignoreRemoteLoadUntil = Date.now() + 900;
      const payload = reminders.map((item) => ({
        id: item.id,
        hour: item.hour,
        minute: item.minute,
        enabled: Boolean(item.enabled),
        label: item.label,
      }));
      const message = {
        type: "SAVE",
        enabled: enabled ? enabled.checked : true,
        reminders: payload,
        prefs: buildPrefs(),
      };
      const res = await chrome.runtime.sendMessage(message);
      if (!res || !res.ok) {
        ignoreRemoteLoadUntil = 0;
        if (status) status.textContent = "Couldn’t save. Try again.";
        return;
      }
      if (res.state) load(res.state, "save");
      if (status && config.showSaveStatus) status.textContent = "Saved";
    }

    return { load, scheduleSave, render };
  }

  root.BrushRemindersEditor = { wire };
})(typeof globalThis !== "undefined" ? globalThis : this);
