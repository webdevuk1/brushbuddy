(function () {
  "use strict";

  if (globalThis.__BRUSHBUDDY__) return;
  globalThis.__BRUSHBUDDY__ = true;

  const HOST_ID = "brushbuddy-host";
  let host = null;
  let currentId = null;
  let currentPos = null;
  let showTimer = 0;

  document.getElementById(HOST_ID)?.remove();
  document.getElementById("brushpill-host")?.remove();

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") return;
    if (message.type === "SHOW_PILL") {
      if (document.visibilityState !== "visible") {
        sendResponse({ shown: false });
        return;
      }
      const shown = renderBuddy(message.pending, {
        chime: shouldChime(message.pending, message.sound),
        showMotivationLine: message.showMotivationLine !== false,
        buddyPosition: message.buddyPosition || message.pillPosition || null,
      });
      sendResponse({ shown: shown });
      return;
    }
    if (message.type === "HIDE_PILL") {
      hideBuddy();
      sendResponse({ ok: true });
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") stopAlarm();
    else scheduleMaybeShow();
  });
  window.addEventListener("pageshow", () => scheduleMaybeShow());
  window.addEventListener("resize", () => {
    if (host) applyPosition(currentPos);
  });

  function scheduleMaybeShow() {
    clearTimeout(showTimer);
    showTimer = setTimeout(maybeShow, 250);
  }

  async function maybeShow() {
    if (document.visibilityState !== "visible") return;
    try {
      const res = await chrome.runtime.sendMessage({ type: "GET_PENDING" });
      if (!res || !res.pending) {
        hideBuddy();
        return;
      }
      renderBuddy(res.pending, {
        chime: shouldChime(res.pending, res.sound),
        showMotivationLine: res.showMotivationLine !== false,
        buddyPosition: res.buddyPosition || res.pillPosition || null,
      });
    } catch (_err) {
      /* Extension reloaded or the page is closing. */
    }
  }

  function renderBuddy(pending, opts) {
    if (!pending || typeof pending.id !== "string") return false;
    if (host && currentId === pending.id) {
      if (opts.chime && globalThis.BrushAlertSound) BrushAlertSound.startLoop();
      return true;
    }
    currentId = pending.id;
    currentPos = opts.buddyPosition || null;
    host?.remove();
    host = buildBuddy(pending, opts.showMotivationLine);
    document.documentElement.appendChild(host);
    requestAnimationFrame(() => applyPosition(currentPos));
    if (opts.chime && globalThis.BrushAlertSound && document.visibilityState === "visible") {
      BrushAlertSound.startLoop();
    }
    return true;
  }

  function shouldChime(pending, soundPref) {
    if (pending && pending.preview) return false;
    return Boolean(soundPref);
  }

  function stopAlarm() {
    if (globalThis.BrushAlertSound) BrushAlertSound.stop();
  }

  function hideBuddy() {
    stopAlarm();
    currentId = null;
    host?.remove();
    host = null;
  }

  function characterUrl(pending) {
    if (globalThis.BrushCharacters) return BrushCharacters.forPending(pending);
    return chrome.runtime.getURL("assets/library/thumbs/128/brushing.png");
  }

  function lines(pending, showMotivationLine) {
    const label = pending.label || "Brush";
    let title = "I'm brushing. Your turn.";
    if (pending.preview || label === "Preview") title = "I'm brushing. This is a preview.";
    else if (/night/i.test(label)) title = "I'm brushing before bed.";
    else if (/morning/i.test(label)) title = "Morning! I'm brushing.";
    else if (/snooze/i.test(label)) title = "I'm still brushing.";
    const sub = showMotivationLine ? "Two minutes is enough." : label;
    return { title: title, sub: sub };
  }

  function buildBuddy(pending, showMotivationLine) {
    const copy = lines(pending, showMotivationLine);
    const el = document.createElement("div");
    el.id = HOST_ID;
    const shadow = el.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = BUDDY_CSS;
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("role", "region");
    card.setAttribute("aria-label", "Brush reminder from your buddy");

    const stage = document.createElement("div");
    stage.className = "stage";
    const face = document.createElement("img");
    face.className = "buddy";
    face.alt = "";
    face.decoding = "async";
    face.loading = "eager";
    face.src = characterUrl(pending);
    stage.appendChild(face);

    const speech = document.createElement("div");
    speech.className = "speech";
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = copy.title;
    const sub = document.createElement("div");
    sub.className = "sub";
    sub.textContent = copy.sub;
    const actions = document.createElement("div");
    actions.className = "actions";
    const done = button("Done", "done", () => act("done", pending.id, done));
    const snooze = button("Snooze", "snooze", () => act("snooze", pending.id, snooze));
    const close = button("×", "close", () => act("dismiss", pending.id, close));
    close.setAttribute("aria-label", "Dismiss");
    actions.append(done, snooze, close);
    speech.append(title, sub, actions);

    card.append(stage, speech);
    shadow.append(style, card);
    bindDrag(el, card);
    return el;
  }

  function button(text, className, onClick) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = className;
    el.textContent = text;
    el.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });
    return el;
  }

  function act(action, pendingId, buttonEl) {
    buttonEl.disabled = true;
    chrome.runtime.sendMessage({ type: "PILL_ACTION", action: action, pendingId: pendingId }).catch(() => {});
    hideBuddy();
  }

  function bindDrag(el, card) {
    let drag = null;
    card.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      if (event.target.closest("button")) return;
      const rect = el.getBoundingClientRect();
      drag = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
      card.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    card.addEventListener("pointermove", (event) => {
      if (!drag) return;
      currentPos = {
        left: event.clientX - drag.dx,
        top: event.clientY - drag.dy,
      };
      applyPosition(currentPos);
    });
    function endDrag(event) {
      if (!drag) return;
      drag = null;
      try {
        card.releasePointerCapture(event.pointerId);
      } catch (_err) {
        /* Capture already released. */
      }
      if (!currentPos) return;
      chrome.runtime.sendMessage({
        type: "SAVE_POSITION",
        left: currentPos.left,
        top: currentPos.top,
      }).catch(() => {});
    }
    card.addEventListener("pointerup", endDrag);
    card.addEventListener("pointercancel", endDrag);
  }

  function applyPosition(pos) {
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const width = rect.width || 340;
    const height = rect.height || 120;
    let left = pos ? pos.left : window.innerWidth - width - 16;
    let top = pos ? pos.top : window.innerHeight - height - 16;
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - height - 8);
    left = Math.min(Math.max(8, left), maxLeft);
    top = Math.min(Math.max(8, top), maxTop);
    host.style.left = left + "px";
    host.style.top = top + "px";
  }

  const BUDDY_CSS = `
    :host {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      display: block;
      width: max-content;
      max-width: calc(100vw - 16px);
      color: #fafafa;
      font-family: "Segoe UI", system-ui, sans-serif;
      pointer-events: auto;
    }
    .card {
      display: flex;
      align-items: center;
      gap: 10px;
      box-sizing: border-box;
      max-width: min(400px, calc(100vw - 16px));
      padding: 10px 12px 10px 8px;
      border-radius: 22px;
      background: rgba(18, 18, 22, 0.94);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06);
      cursor: grab;
      user-select: none;
      touch-action: none;
      animation: buddy-in 240ms ease;
    }
    .card:active { cursor: grabbing; }
    .stage {
      width: 82px;
      height: 68px;
      flex-shrink: 0;
      border-radius: 16px;
      overflow: hidden;
      background: linear-gradient(160deg, #5eead4 0%, #34d399 55%, #10b981 100%);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
      animation: bob 1.8s ease-in-out infinite alternate;
    }
    .buddy {
      width: 100%;
      height: 125%;
      object-fit: cover;
      object-position: center 0%;
      display: block;
      margin-top: -4%;
    }
    .speech { min-width: 0; flex: 1; padding-right: 2px; }
    .title {
      font-size: 14px;
      line-height: 1.25;
      font-weight: 650;
      letter-spacing: -0.01em;
    }
    .sub {
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.3;
      color: #a1a1aa;
    }
    .actions { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
    button {
      font: inherit;
      cursor: pointer;
      border-radius: 999px;
    }
    button:disabled { opacity: 0.6; cursor: default; }
    button:focus-visible { outline: 2px solid #6ee7b7; outline-offset: 2px; }
    .done {
      border: 0;
      background: #6ee7b7;
      color: #052e24;
      font-size: 13px;
      font-weight: 700;
      padding: 7px 12px;
    }
    .snooze {
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.06);
      color: #fafafa;
      font-size: 13px;
      font-weight: 600;
      padding: 7px 10px;
    }
    .close {
      width: 28px;
      height: 28px;
      border: 0;
      background: transparent;
      color: #d4d4d8;
      font-size: 18px;
      line-height: 1;
      padding: 0;
    }
    .close:hover, .snooze:hover { background: rgba(255, 255, 255, 0.1); }
    .done:hover { filter: brightness(1.05); }
    @keyframes buddy-in {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: none; opacity: 1; }
    }
    @keyframes bob {
      from { transform: translateY(0); }
      to { transform: translateY(-3px); }
    }
    @media (prefers-reduced-motion: reduce) {
      .card, .stage { animation: none; }
    }
  `;
})();
