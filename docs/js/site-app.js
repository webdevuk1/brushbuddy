(function () {
  "use strict";

  const status = document.getElementById("status");
  const banner = document.getElementById("install-banner");
  const products = document.getElementById("products");
  const disclosure = document.getElementById("disclosure");
  const recommended = document.getElementById("recommended");

  BrushSupport.wire();

  const AFFILIATE_TAG = "brushbuddy21-21";
  const PRODUCT_LIST = [
    { name: "Water flosser", detail: "Cleans between teeth without string.", query: "water flosser" },
    { name: "Electric toothbrush", detail: "Runs a two-minute timer for you.", query: "electric toothbrush" },
    { name: "Toothpaste", detail: "The one dentists keep recommending.", query: "toothpaste" },
    { name: "Dental floss", detail: "The minute after you brush.", query: "dental floss" },
    { name: "Mouthwash", detail: "Rinse after brushing for extra freshness.", query: "mouthwash" },
    { name: "Toothbrush heads", detail: "Swap every few months — electric brushes need these.", query: "electric toothbrush replacement heads" },
  ];

  function productUrl(query) {
    const url = new URL("https://www.amazon.co.uk/s");
    url.searchParams.set("k", query);
    if (AFFILIATE_TAG) url.searchParams.set("tag", AFFILIATE_TAG);
    return url.toString();
  }

  recommended.hidden = false;
  disclosure.textContent =
    "We may earn a commission if you buy through these links, at no extra cost to you.";
  PRODUCT_LIST.forEach((product) => {
    const link = document.createElement("a");
    link.className = "product card";
    link.href = productUrl(product.query);
    link.target = "_blank";
    link.rel = "noopener noreferrer sponsored";
    link.innerHTML =
      '<span><span class="product-name"></span><span class="product-detail"></span></span><span class="product-go">View</span>';
    link.querySelector(".product-name").textContent = product.name;
    link.querySelector(".product-detail").textContent = product.detail;
    products.appendChild(link);
  });

  const editor = BrushRemindersEditor.wire({
    list: document.getElementById("list"),
    addButton: document.getElementById("add"),
    sound: document.getElementById("sound"),
    soundTone: document.getElementById("sound-tone"),
    soundPlay: document.getElementById("sound-play"),
    notifications: document.getElementById("notifications"),
    motivation: document.getElementById("motivation"),
    snoozeDuration: document.getElementById("snooze-duration"),
    enabled: document.getElementById("enabled"),
    status: status,
    compact: false,
  });

  document.getElementById("preview").addEventListener("click", async () => {
    if (!BrushSite.extensionConnected()) {
      status.textContent = "Install BrushBuddy to preview on a tab.";
      return;
    }
    status.textContent = "Showing your buddy…";
    const res = await BrushSite.sendMessage({ type: "PREVIEW" });
    if (res && res.shown) status.textContent = "It’s on your open website tab.";
    else if (res && res.waiting) status.textContent = "Switch to a website tab and your buddy will be there.";
    else if (res && res.notified) status.textContent = "No website was open, so a notification was sent.";
    else status.textContent = "Open a normal website tab, then preview again.";
  });

  let remoteSyncTimer = 0;

  document.addEventListener("brushbuddy-storage-changed", () => {
    clearTimeout(remoteSyncTimer);
    remoteSyncTimer = setTimeout(() => {
      editor.loadFromRemote().catch(() => {});
    }, 80);
  });

  if (globalThis.BrushBugReport && globalThis.BrushSiteUrls) {
    BrushBugReport.wire({
      trigger: document.getElementById("bug-report"),
      apiUrl: BrushSiteUrls.bugReport,
      source: "website",
    });
  }

  BrushSite.waitForExtension(5000).then((ok) => {
    if (!ok) {
      banner.hidden = false;
      status.textContent = "Install BrushBuddy to sync settings with this page.";
      return;
    }
    banner.hidden = true;
    editor.loadFromRemote().catch(() => {
      status.textContent = "Couldn’t load settings.";
    });
  });
})();
