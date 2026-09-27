(function () {
  "use strict";

  const MARK = "data-brushbuddy-extension";

  document.documentElement.setAttribute(MARK, "1");

  const ALLOWED_TYPES = new Set(["GET_STATE", "SAVE", "PREVIEW"]);

  document.addEventListener("brushbuddy-request", (event) => {
    const detail = event.detail;
    if (!detail || !detail.id || !detail.message) return;
    const msg = detail.message;
    if (!msg || typeof msg.type !== "string" || !ALLOWED_TYPES.has(msg.type)) return;
    chrome.runtime
      .sendMessage(msg)
      .then((result) => {
        document.dispatchEvent(
          new CustomEvent("brushbuddy-response", {
            detail: { id: detail.id, result: result },
          })
        );
      })
      .catch((err) => {
        document.dispatchEvent(
          new CustomEvent("brushbuddy-response", {
            detail: { id: detail.id, result: { ok: false, error: String(err) } },
          })
        );
      });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.state) {
      document.dispatchEvent(new CustomEvent("brushbuddy-storage-changed"));
    }
  });
})();
