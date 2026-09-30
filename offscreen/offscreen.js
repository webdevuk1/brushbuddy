(function () {
  "use strict";

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== "OFFSCREEN_ALARM" || message.target !== "offscreen") return;
    if (message.action === "start") {
      globalThis.BrushAlertSound.startLoop(message.soundId || "classic");
      sendResponse({ ok: true });
      return;
    }
    if (message.action === "stop") {
      globalThis.BrushAlertSound.stop();
      sendResponse({ ok: true });
    }
  });
})();
