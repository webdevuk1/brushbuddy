(function (root) {
  "use strict";

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function wire(config) {
    const list = config.list;
    const addButton = config.addButton;
    const sound = config.sound;
    const notifications = config.notifications;
    const motivation = config.motivation;
    const enabled = config.enabled;
    const status = config.status;
    const compact = Boolean(config.compact);

    let reminders = [];
    let timer = 0;
    let saveChain = Promise.resolve();

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

    if (enabled) enabled.addEventListener("change", scheduleSave);
    sound.addEventListener("change", scheduleSave);
    notifications.addEventListener("change", scheduleSave);
    motivation.addEventListener("change", scheduleSave);

    function load(state) {
      reminders = state.reminders.map((item) => Object.assign({}, item));
      if (enabled) enabled.checked = state.enabled;
      sound.checked = state.prefs.sound;
      notifications.checked = state.prefs.notifications;
      motivation.checked = state.prefs.showMotivationLine;
      render();
    }

    function onEdit(event) {
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
      if (event.target.classList.contains("on")) item.enabled = event.target.checked;
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
      const payload = reminders.map((item) => ({
        id: item.id,
        hour: item.hour,
        minute: item.minute,
        enabled: Boolean(item.enabled),
        label: item.label,
      }));
      const res = await chrome.runtime.sendMessage({
        type: "SAVE",
        enabled: enabled ? enabled.checked : true,
        reminders: payload,
        prefs: {
          sound: sound.checked,
          notifications: notifications.checked,
          showMotivationLine: motivation.checked,
        },
      });
      if (!res || !res.ok) {
        if (status) status.textContent = "Couldn’t save. Try again.";
        return;
      }
      if (status) status.textContent = "Saved";
    }

    return { load, scheduleSave };
  }

  root.BrushRemindersEditor = { wire };
})(typeof globalThis !== "undefined" ? globalThis : this);
