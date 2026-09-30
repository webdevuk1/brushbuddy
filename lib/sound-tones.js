(function (root) {
  "use strict";

  const OPTIONS = [
    { id: "classic", label: "Classic chime" },
    { id: "bells", label: "Bells" },
    { id: "digital", label: "Digital beep" },
    { id: "urgent", label: "Urgent pulse" },
  ];

  const VALID = new Set(OPTIONS.map((o) => o.id));

  function sanitize(id) {
    const key = String(id || "").trim();
    return VALID.has(key) ? key : "classic";
  }

  function tone(ctx, now, freq, start, duration, peak, type) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function sequence(soundId, ctx, now, peak) {
    const id = sanitize(soundId);
    if (id === "bells") {
      [880, 1108.73, 1318.51].forEach((f, i) => tone(ctx, now, f, now + i * 0.22, 0.5, peak * 0.4, "sine"));
      return 1200;
    }
    if (id === "digital") {
      [0, 0.18, 0.36].forEach((t) => tone(ctx, now, 988, now + t, 0.12, peak * 0.45, "square"));
      return 700;
    }
    if (id === "urgent") {
      for (let i = 0; i < 6; i += 1) {
        tone(ctx, now, 740, now + i * 0.14, 0.1, peak * 0.5, "sawtooth");
      }
      return 1100;
    }
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(ctx, now, f, now + i * 0.12, 0.55, peak * 0.35, "triangle")
    );
    return 2200;
  }

  function canResumeAudioContext() {
    const ua = navigator.userActivation;
    return !ua || ua.isActive;
  }

  function preview(soundId, volume) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return Promise.resolve();
    const ctx = new AudioCtx();
    const peak = typeof volume === "number" ? volume : 0.85;

    function playWhenRunning() {
      if (ctx.state !== "running") {
        ctx.close().catch(() => {});
        return Promise.reject(new Error("audio locked"));
      }
      const wait = sequence(sanitize(soundId), ctx, ctx.currentTime, peak);
      setTimeout(() => ctx.close().catch(() => {}), wait);
      return Promise.resolve();
    }

    if (ctx.state === "running") return playWhenRunning();

    if (ctx.state === "suspended" && !canResumeAudioContext()) {
      ctx.close().catch(() => {});
      return Promise.reject(new Error("audio locked"));
    }

    return ctx
      .resume()
      .then(playWhenRunning)
      .catch(() => {
        ctx.close().catch(() => {});
        return Promise.reject(new Error("audio locked"));
      });
  }

  root.BrushSoundTones = {
    options: () => OPTIONS.slice(),
    sanitize,
    preview,
    sequence,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
