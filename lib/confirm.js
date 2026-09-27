(function (root) {
  "use strict";

  const DEFAULT_TITLE = "Turn off BrushBuddy?";
  const DEFAULT_MESSAGE =
    "You won't get brush reminders or alerts while it's off.";

  let dialog;
  let settle;

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.className = "bb-confirm";
    dialog.innerHTML =
      '<form method="dialog" class="bb-confirm__panel">' +
      '<p class="bb-confirm__title"></p>' +
      '<p class="bb-confirm__message"></p>' +
      '<div class="bb-confirm__actions">' +
      '<button type="submit" class="btn ghost" value="cancel">Keep on</button>' +
      '<button type="submit" class="btn primary" value="ok">Turn off</button>' +
      "</div>" +
      "</form>";
    document.body.appendChild(dialog);
    return dialog;
  }

  function ask(options) {
    const opts = options || {};
    const el = ensureDialog();
    if (settle) settle(false);
    if (el.open) el.close();

    el.querySelector(".bb-confirm__title").textContent = opts.title || DEFAULT_TITLE;
    el.querySelector(".bb-confirm__message").textContent = opts.message || DEFAULT_MESSAGE;
    const form = el.querySelector("form");

    return new Promise((resolve) => {
      let settled = false;
      function finish(value) {
        if (settled) return;
        settled = true;
        settle = null;
        el.removeEventListener("close", onClose);
        el.removeEventListener("cancel", onCancel);
        resolve(value);
      }
      settle = finish;
      function onClose() {
        finish(el.returnValue === "ok");
      }
      function onCancel() {
        finish(false);
      }
      el.addEventListener("close", onClose);
      el.addEventListener("cancel", onCancel);
      if (typeof el.showModal === "function") el.showModal();
      else finish(window.confirm((opts.title || DEFAULT_TITLE) + "\n\n" + (opts.message || DEFAULT_MESSAGE)));
    });
  }

  root.BrushConfirm = { ask };
})(typeof globalThis !== "undefined" ? globalThis : this);
