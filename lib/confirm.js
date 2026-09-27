(function (root) {
  "use strict";

  const DEFAULT_TITLE = "Turn off BrushBuddy?";
  const DEFAULT_MESSAGE =
    "You won't get brush reminders or alerts while it's off.";

  let dialog;

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

  function absorbDialogClickThrough() {
    const block = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("pointerdown", block, true);
    document.addEventListener("pointerup", block, true);
    document.addEventListener("click", block, true);
    setTimeout(() => {
      document.removeEventListener("pointerdown", block, true);
      document.removeEventListener("pointerup", block, true);
      document.removeEventListener("click", block, true);
    }, 350);
  }

  function ask(options) {
    const opts = options || {};
    const el = ensureDialog();
    el.querySelector(".bb-confirm__title").textContent = opts.title || DEFAULT_TITLE;
    el.querySelector(".bb-confirm__message").textContent = opts.message || DEFAULT_MESSAGE;
    const form = el.querySelector("form");
    return new Promise((resolve) => {
      function done(value) {
        form.removeEventListener("close", onClose);
        el.removeEventListener("cancel", onCancel);
        resolve(value);
      }
      function onClose() {
        absorbDialogClickThrough();
        const ok = el.returnValue === "ok";
        setTimeout(() => done(ok), 0);
      }
      function onCancel(event) {
        event.preventDefault();
        absorbDialogClickThrough();
        setTimeout(() => done(false), 0);
      }
      form.addEventListener("close", onClose);
      el.addEventListener("cancel", onCancel);
      if (typeof el.showModal === "function") el.showModal();
      else resolve(window.confirm((opts.title || DEFAULT_TITLE) + "\n\n" + (opts.message || DEFAULT_MESSAGE)));
    });
  }

  root.BrushConfirm = { ask };
})(typeof globalThis !== "undefined" ? globalThis : this);
