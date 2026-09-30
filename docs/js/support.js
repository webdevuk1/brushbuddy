(function (root) {
  "use strict";

  // Your Ko-fi, Stripe Payment Link, or PayPal.me page. Leave empty to hide this section on the live site.
  const SUPPORT_URL = "https://paypal.me/brushbuddys";

  const HEADLINE = "Brush Buddies is a one-person project";
  const BLURB =
    "It’s free to use. If it’s helping your routine, optional support goes straight to keeping the app running and improving — only if you want to.";
  const BUTTON_LABEL = "Support the project";

  function isLocalPreview() {
    try {
      const host = globalThis.location.hostname;
      return host === "localhost" || host === "127.0.0.1";
    } catch (err) {
      return false;
    }
  }

  function isExtensionSettings() {
    try {
      return globalThis.location.protocol === "chrome-extension:";
    } catch (err) {
      return false;
    }
  }

  function wire() {
    const show = SUPPORT_URL || isLocalPreview() || isExtensionSettings();
    if (!show) return;
    const section = document.getElementById("support");
    if (!section) return;
    section.hidden = false;
    const headline = document.getElementById("support-headline");
    const blurb = document.getElementById("support-blurb");
    const link = document.getElementById("support-link");
    if (headline) headline.textContent = HEADLINE;
    if (blurb) blurb.textContent = BLURB;
    if (link) {
      link.textContent = BUTTON_LABEL;
      if (SUPPORT_URL) {
        link.href = SUPPORT_URL;
      } else {
        link.href = "#";
        link.addEventListener("click", function (e) {
          e.preventDefault();
        });
      }
    }
  }

  root.BrushSupport = {
    url: SUPPORT_URL,
    headline: HEADLINE,
    blurb: BLURB,
    buttonLabel: BUTTON_LABEL,
    wire,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
