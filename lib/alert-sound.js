(function (root) {
  "use strict";

  function playSynth() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return Promise.resolve();
    const ctx = new AudioCtx();
    return ctx
      .resume()
      .then(() => {
        if (ctx.state !== "running") {
          ctx.close();
          return;
        }
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = freq;
          const start = now + index * 0.14;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.05, start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.44);
        });
        setTimeout(() => ctx.close().catch(() => {}), 1600);
      })
      .catch(() => ctx.close());
  }

  let mp3Works = null;

  function play() {
    if (mp3Works === false) return playSynth().catch(() => {});
    const audio = new Audio(chrome.runtime.getURL("assets/sounds/alert.mp3"));
    audio.volume = 0.55;
    return audio
      .play()
      .then(() => {
        mp3Works = true;
      })
      .catch(() => {
        mp3Works = false;
        return playSynth();
      })
      .catch(() => {});
  }

  root.BrushAlertSound = { play };
})(typeof globalThis !== "undefined" ? globalThis : this);
