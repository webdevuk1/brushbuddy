(function (root) {
  "use strict";

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function send(type, body) {
    if (!root.BrushSite) return Promise.resolve({ ok: false });
    return root.BrushSite.sendMessage(Object.assign({ type: type }, body));
  }

  function wire(config) {
    const list = config.list;
    const addButton = config.addButton;
    const soundTone = config.soundTone;
    const soundPlay = config.soundPlay;
    const enabled = config.enabled;
    const status = config.status;
    const compact = Boolean(config.compact);
    const useConfirm = config.confirmBeforeDisable !== false && root.BrushConfirm;

    let reminders = [];
    let timer = 0;
    let saveChain = Promise.resolve();
    let ignoreRemoteLoadUntil = 0;

    list.addEventListener("input", onEdit);
    list.addEventListener("change", onEdit);
    list.addEventListener("focusout", (event) => {
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

    if (enabled) {
      enabled.addEventListener("change", async () => {
        if (!enabled.checked) {
          const ok = await confirmTurnOff();
          if (!ok) {
            enabled.checked = true;
            return;
          }
        }
        scheduleSave();
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
        if (root.BrushSoundTones) BrushSoundTones.preview(id);
      });
    }
    function load(state, source) {
      if (source === "remote" && Date.now() < ignoreRemoteLoadUntil) return;
      reminders = state.reminders.map((item) => Object.assign({}, item));
      if (enabled) enabled.checked = state.enabled;
      if (soundTone) {
        soundTone.value = root.BrushSoundTones
          ? BrushSoundTones.sanitize(state.prefs.soundId)
          : state.prefs.soundId || "classic";
      }
      render();
    }

    async function loadFromRemote() {
      if (Date.now() < ignoreRemoteLoadUntil) return;
      const res = await send("GET_STATE");
      if (res && res.state) load(res.state, "remote");
    }

    async function onEdit(event) {
      const row = event.target.closest("[data-id]");
      if (!row) return;
      const item = reminders.find((reminder) => reminder.id === row.dataset.id);
      if (!item) return;
      if (event.target.classList.contains("label")) item.label = event.target.value;
      if (event.target.classList.contains("time")) {
        const match = /^(\d{2}):(\d{2})$/.exec(event.target.value);
        if (!match) return;
        item.hour = Number(match[1]);
        item.minute = Number(match[2]);
      }
      if (event.target.classList.contains("on")) {
        if (!event.target.checked) {
          const ok = await confirmTurnOff();
          if (!ok) {
            event.target.checked = true;
            return;
          }
        }
        item.enabled = event.target.checked;
      }
      scheduleSave();
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

        const time = document.createElement("input");
        time.className = "time-input time";
        time.type = "time";
        time.value = pad(item.hour) + ":" + pad(item.minute);
        time.setAttribute("aria-label", item.label + " time");

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

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "icon-btn";
        remove.dataset.remove = "true";
        remove.setAttribute("aria-label", "Remove " + item.label);
        remove.textContent = "×";

        row.append(label, time, toggle, remove);
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
      }, 200);
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
      const res = await send("SAVE", {
        enabled: enabled ? enabled.checked : true,
        reminders: payload,
        prefs: {
          sound: true,
          soundId: soundTone ? soundTone.value : "classic",
          notifications: true,
          showMotivationLine: true,
        },
      });
      if (!res || !res.ok) {
        ignoreRemoteLoadUntil = 0;
        if (status) status.textContent = "Couldn’t save. Try again.";
        return;
      }
      if (res.state) load(res.state, "save");
      if (status && config.showSaveStatus) status.textContent = "Saved";
    }

    return { load, loadFromRemote, scheduleSave };
  }

  root.BrushRemindersEditor = { wire };
})(typeof window !== "undefined" ? window : globalThis);
