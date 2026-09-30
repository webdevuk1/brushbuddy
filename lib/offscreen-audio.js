const BRUSH_OFFSCREEN_PAGE = "offscreen/offscreen.html";

async function brushHasOffscreenDocument() {
  if (!chrome.offscreen) return false;
  const url = chrome.runtime.getURL(BRUSH_OFFSCREEN_PAGE);
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [url],
  });
  return contexts.length > 0;
}

async function brushEnsureOffscreenDocument() {
  if (!chrome.offscreen) return false;
  if (await brushHasOffscreenDocument()) return true;
  await chrome.offscreen.createDocument({
    url: BRUSH_OFFSCREEN_PAGE,
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Play reminder alert sounds while you use other tabs or monitors.",
  });
  return true;
}

async function brushStartAlarmSound(soundId) {
  const ok = await brushEnsureOffscreenDocument();
  if (!ok) return;
  await chrome.runtime.sendMessage({
    type: "OFFSCREEN_ALARM",
    target: "offscreen",
    action: "start",
    soundId: soundId || "classic",
  });
}

async function brushStopAlarmSound() {
  try {
    if (await brushHasOffscreenDocument()) {
      await chrome.runtime.sendMessage({
        type: "OFFSCREEN_ALARM",
        target: "offscreen",
        action: "stop",
      });
    }
  } catch (_err) {
    /* Offscreen may already be gone. */
  }
  try {
    if (chrome.offscreen) await chrome.offscreen.closeDocument();
  } catch (_err) {
    /* Already closed. */
  }
}
