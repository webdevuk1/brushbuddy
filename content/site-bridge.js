(function () {
  "use strict";

  const MARK = "data-brushbuddy-extension";

  document.documentElement.setAttribute(MARK, "1");

  document.addEventListener("brushbuddy-request", (event) => {
    const detail = event.detail;
    if (!detail || !detail.id || !detail.message) return;
    chrome.runtime
      .sendMessage(detail.message)
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
