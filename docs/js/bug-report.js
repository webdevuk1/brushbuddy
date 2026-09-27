(function (root) {
  "use strict";

  let dialog;
  let apiUrl = "";
  let defaultSource = "website";
  let defaultVersion = "";

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.className = "bb-bug-report";
    dialog.innerHTML =
      '<form method="dialog" class="bb-bug-report__panel">' +
      '<p class="bb-bug-report__title">Report a bug</p>' +
      '<p class="bb-bug-report__hint">Tell us what went wrong. We only use your email to reply.</p>' +
      '<label class="bb-bug-report__field">' +
      '<span>Your email</span>' +
      '<input type="email" name="email" class="text-input" autocomplete="email" required maxlength="120" />' +
      "</label>" +
      '<label class="bb-bug-report__field">' +
      "<span>What happened?</span>" +
      '<textarea name="message" class="bb-bug-report__message" rows="5" required minlength="10" maxlength="2000" placeholder="Steps to reproduce, what you expected, and what you saw instead."></textarea>' +
      "</label>" +
      '<input type="text" name="company" class="bb-bug-report__trap" tabindex="-1" autocomplete="off" aria-hidden="true" />' +
      '<p class="bb-bug-report__status" role="status" aria-live="polite"></p>' +
      '<div class="bb-bug-report__actions">' +
      '<button type="button" class="btn ghost bb-bug-report__cancel">Cancel</button>' +
      '<button type="submit" class="btn primary bb-bug-report__send">Send report</button>' +
      "</div>" +
      "</form>";
    document.body.appendChild(dialog);

    const form = dialog.querySelector("form");
    const cancel = dialog.querySelector(".bb-bug-report__cancel");
    const status = dialog.querySelector(".bb-bug-report__status");
    const sendBtn = dialog.querySelector(".bb-bug-report__send");

    cancel.addEventListener("click", () => dialog.close("cancel"));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!apiUrl) {
        status.textContent = "Bug reports are not set up yet. Try again later.";
        return;
      }
      const data = new FormData(form);
      if (data.get("company")) {
        dialog.close("ok");
        return;
      }
      sendBtn.disabled = true;
      status.textContent = "Sending…";
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.get("email"),
            message: data.get("message"),
            source: defaultSource,
            version: defaultVersion,
            company: "",
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.ok) {
          status.textContent = "Thanks — we got your report.";
          setTimeout(() => dialog.close("ok"), 700);
          return;
        }
        if (res.status === 429) {
          status.textContent = "Too many reports. Please wait a bit and try again.";
        } else if (json.error === "invalid-email") {
          status.textContent = "Enter a valid email address.";
        } else if (json.error === "message-too-short") {
          status.textContent = "Please add a few more details.";
        } else {
          status.textContent = "Could not send. Try again in a moment.";
        }
      } catch (_err) {
        status.textContent = "Could not send. Check your connection.";
      } finally {
        sendBtn.disabled = false;
      }
    });

    dialog.addEventListener("close", () => {
      form.reset();
      status.textContent = "";
      sendBtn.disabled = false;
    });

    return dialog;
  }

  function open() {
    const el = ensureDialog();
    if (typeof el.showModal === "function") el.showModal();
  }

  function wire(config) {
    apiUrl = config && config.apiUrl ? config.apiUrl : "";
    defaultSource = config && config.source ? config.source : "website";
    defaultVersion = config && config.version ? config.version : "";
    const trigger = config && config.trigger;
    if (!trigger) return;
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      open();
    });
  }

  root.BrushBugReport = { wire, open };
})(typeof globalThis !== "undefined" ? globalThis : this);
