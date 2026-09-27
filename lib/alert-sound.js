(function (root) {
  "use strict";

  const LOOP_MS = 2200;
  const VOLUME_ALARM = 1;
  const VOLUME_PREVIEW = 0.85;

  let loopTimer = null;
  let unlockListener = null;
  let loopSoundId = "classic";
  let mp3Works = null;

  function playMp3(volume) {
    const audio = new Audio(chrome.runtime.getURL("assets/sounds/alert.mp3"));
    audio.volume = typeof volume === "number" ? volume : VOLUME_ALARM;
    return audio.play().then(() => {
      mp3Works = true;
    });
  }

  function playOnce(soundId, volume) {
    const id = root.BrushSoundTones ? BrushSoundTones.sanitize(soundId) : "classic";
    const vol = typeof volume === "number" ? volume : VOLUME_ALARM;
    if (id === "classic" && mp3Works !== false) {
      return playMp3(vol).catch(() => {
        mp3Works = false;
        return root.BrushSoundTones.preview(id, vol * 0.5);
      });
    }
    return root.BrushSoundTones.preview(id, vol * 0.5);
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

  function startLoop(soundId) {
    loopSoundId = root.BrushSoundTones ? BrushSoundTones.sanitize(soundId) : "classic";
    stop();
    let unlocked = false;

    function tick() {
      playOnce(loopSoundId, VOLUME_ALARM).catch(() => {});
    }

    function tryUnlock() {
      if (unlocked) return;
      playOnce(loopSoundId, VOLUME_ALARM)
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

  function play(soundId) {
    return playOnce(soundId || loopSoundId, VOLUME_PREVIEW);
  }

  root.BrushAlertSound = { play, startLoop, stop };
})(typeof globalThis !== "undefined" ? globalThis : this);
