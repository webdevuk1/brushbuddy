(function (root) {
  "use strict";

  const LOOP_MS = 2200;
  const VOLUME_ALARM = 1;
  const VOLUME_PREVIEW = 0.85;

  let loopTimer = null;
  let unlockListener = null;
  let mp3Works = null;

  function playSynth(volume) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return Promise.resolve();
    const ctx = new AudioCtx();
    const peak = typeof volume === "number" ? volume : VOLUME_ALARM;
    return ctx
      .resume()
      .then(() => {
        if (ctx.state !== "running") {
          ctx.close();
          return;
        }
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = freq;
          const start = now + index * 0.12;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(Math.min(0.35, peak * 0.35), start + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.58);
        });
        setTimeout(() => ctx.close().catch(() => {}), 2200);
      })
      .catch(() => ctx.close());
  }

  function playMp3(volume) {
    const audio = new Audio(chrome.runtime.getURL("assets/sounds/alert.mp3"));
    audio.volume = typeof volume === "number" ? volume : VOLUME_ALARM;
    return audio.play().then(() => {
      mp3Works = true;
    });
  }

  function playOnce(volume) {
    const vol = typeof volume === "number" ? volume : VOLUME_ALARM;
    if (mp3Works === false) return playSynth(vol * 0.5);
    return playMp3(vol).catch(() => {
      mp3Works = false;
      return playSynth(vol * 0.5);
    });
  }

  function removeUnlockListener() {
    if (!unlockListener) return;
    document.removeEventListener("pointerdown", unlockListener, true);
    document.removeEventListener("keydown", unlockListener, true);
    unlockListener = null;
  }

  function stop() {
    if (loopTimer) {
      clearInterval(loopTimer);
      loopTimer = null;
    }
    removeUnlockListener();
  }

  function startLoop() {
    stop();
    let unlocked = false;

    function tick() {
      playOnce(VOLUME_ALARM).catch(() => {});
    }

    function tryUnlock() {
      if (unlocked) return;
      playOnce(VOLUME_ALARM)
        .then(() => {
          unlocked = true;
          removeUnlockListener();
        })
        .catch(() => {});
    }

    tick();
    loopTimer = setInterval(tick, LOOP_MS);

    unlockListener = tryUnlock;
    document.addEventListener("pointerdown", unlockListener, true);
    document.addEventListener("keydown", unlockListener, true);
  }

  function play() {
    return playOnce(VOLUME_PREVIEW);
  }

  root.BrushAlertSound = { play, startLoop, stop };
})(typeof globalThis !== "undefined" ? globalThis : this);
