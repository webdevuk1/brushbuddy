(function (root) {
  "use strict";

  if (root.BrushCharacters) return;

  const LIBRARY = [
    { id: "toolbar", file: "assets/library/toolbar-icon.png", name: "Toolbar", where: "Browser icon and popup" },
    { id: "brushing", file: "assets/library/04-clay-brushing.png", name: "Brushing", where: "Reminder and settings" },
    { id: "closeup", file: "assets/library/06-closeup.png", name: "Close-up", where: "Preview" },
    { id: "morning", file: "assets/library/09-morning.png", name: "Morning", where: "Morning reminder" },
    { id: "night", file: "assets/library/08-night.png", name: "Night", where: "Night reminder" },
    { id: "wink", file: "assets/library/12-wink.png", name: "Wink", where: "Snooze" },
    { id: "flat", file: "assets/library/01-flat-yellow.png", name: "Flat", where: "Saved" },
    { id: "sticker", file: "assets/library/02-sticker.png", name: "Sticker", where: "Saved" },
    { id: "smile", file: "assets/library/03-simple-smile.png", name: "Smile", where: "Saved" },
    { id: "front", file: "assets/library/05-front.png", name: "Front", where: "Saved" },
    { id: "wave", file: "assets/library/07-wave.png", name: "Wave", where: "Saved" },
    { id: "side", file: "assets/library/10-side.png", name: "Side", where: "Saved" },
    { id: "sitting", file: "assets/library/11-sitting.png", name: "Sitting", where: "Saved" },
    { id: "hands", file: "assets/library/13-both-hands.png", name: "Both hands", where: "Saved" },
    { id: "peek", file: "assets/library/14-peek.png", name: "Peek", where: "Saved" },
  ];

  const THUMB_SM = {
    brushing: "assets/library/thumbs/64/brushing.png",
    closeup: "assets/library/thumbs/64/closeup.png",
    night: "assets/library/thumbs/64/night.png",
    morning: "assets/library/thumbs/64/morning.png",
    wink: "assets/library/thumbs/64/wink.png",
  };

  const THUMB_LG = {
    brushing: "assets/library/thumbs/128/brushing.png",
    closeup: "assets/library/thumbs/128/closeup.png",
    night: "assets/library/thumbs/128/night.png",
    morning: "assets/library/thumbs/128/morning.png",
    wink: "assets/library/thumbs/128/wink.png",
  };

  function byId(id) {
    return LIBRARY.find((item) => item.id === id) || LIBRARY[1];
  }

  function url(file) {
    return chrome.runtime.getURL(file);
  }

  function pickId(pending) {
    const label = pending && pending.label ? pending.label : "";
    if (pending && (pending.preview || label === "Preview")) return "closeup";
    if (/night/i.test(label)) return "night";
    if (/morning/i.test(label)) return "morning";
    if (/snooze/i.test(label)) return "wink";
    return "brushing";
  }

  function forPending(pending, compact) {
    const id = pickId(pending);
    if (compact) return url(THUMB_SM[id]);
    return url(THUMB_LG[id]);
  }

  function forNext(next, compact) {
    if (!next) return url(compact ? THUMB_SM.brushing : THUMB_LG.brushing);
    if (next.snooze) return url(compact ? THUMB_SM.wink : THUMB_LG.wink);
    return forPending({ label: next.label, preview: false }, compact);
  }

  root.BrushCharacters = {
    LIBRARY: LIBRARY,
    url: url,
    forPending: forPending,
    forNext: forNext,
    mark: url("icons/icon48.png"),
    hero: url(THUMB_LG.brushing),
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
