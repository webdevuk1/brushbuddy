(function (root) {
  "use strict";

  function nextOccurrence(hour, minute, from) {
    const start = from instanceof Date ? from : new Date();
    const next = new Date(start.getTime());
    next.setSeconds(0, 0);
    next.setHours(hour, minute, 0, 0);
    if (next.getTime() <= start.getTime()) {
      next.setDate(next.getDate() + 1);
    }
    return next.getTime();
  }

  function formatClock(hour, minute) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatWhen(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatCountdown(ts, now) {
    const ms = ts - (typeof now === "number" ? now : Date.now());
    if (ms <= 30 * 1000) return "less than a minute";
    const mins = Math.round(ms / 60000);
    if (mins < 60) return mins + " min";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) return h + "h";
    return h + "h " + m + "m";
  }

  function isSameDay(ts, now) {
    const a = new Date(ts);
    const b = typeof now === "number" ? new Date(now) : new Date();
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  root.BrushTime = {
    nextOccurrence: nextOccurrence,
    formatClock: formatClock,
    formatWhen: formatWhen,
    formatCountdown: formatCountdown,
    isSameDay: isSameDay,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
