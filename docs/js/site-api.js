(function (root) {
  "use strict";

  function sendMessage(message) {
    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      const timeout = setTimeout(() => {
        document.removeEventListener("brushbuddy-response", onResponse);
        resolve({ ok: false, error: "extension-timeout" });
      }, 12000);

      function onResponse(event) {
        if (!event.detail || event.detail.id !== id) return;
        clearTimeout(timeout);
        document.removeEventListener("brushbuddy-response", onResponse);
        resolve(event.detail.result);
      }

      document.addEventListener("brushbuddy-response", onResponse);
      document.dispatchEvent(
        new CustomEvent("brushbuddy-request", {
          detail: { id: id, message: message },
        })
      );
    });
  }

  function extensionConnected() {
    return document.documentElement.getAttribute("data-brushbuddy-extension") === "1";
  }

  function waitForExtension(ms) {
    if (extensionConnected()) return Promise.resolve(true);
    return new Promise((resolve) => {
      const deadline = Date.now() + (ms || 4000);
      const tick = () => {
        if (extensionConnected()) {
          resolve(true);
          return;
        }
        if (Date.now() >= deadline) {
          resolve(false);
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  root.BrushSite = {
    sendMessage: sendMessage,
    waitForExtension: waitForExtension,
    extensionConnected: extensionConnected,
  };
})(typeof window !== "undefined" ? window : globalThis);
