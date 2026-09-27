(function () {
  "use strict";

  if (globalThis.BrushSiteUrls) {
    const foot = document.querySelector("footer.footer");
    const links = foot ? foot.querySelectorAll("a") : [];
    if (links[0]) links[0].href = BrushSiteUrls.privacy;
    if (links[1]) links[1].href = BrushSiteUrls.terms;
  }

  const status = document.getElementById("status");
  const products = document.getElementById("products");
  const disclosure = document.getElementById("disclosure");

  document.getElementById("version").textContent = "v" + chrome.runtime.getManifest().version;
  document.getElementById("hero-buddy").src = BrushCharacters.hero;

  if (BrushAffiliates.tag) {
    document.getElementById("recommended").hidden = false;
    disclosure.textContent = BrushAffiliates.disclosure;
    BrushAffiliates.products.forEach((product) => {
      const link = document.createElement("a");
      link.className = "product card";
      link.href = product.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer sponsored";
      const text = document.createElement("span");
      const name = document.createElement("span");
      name.className = "product-name";
      name.textContent = product.name;
      const detail = document.createElement("span");
      detail.className = "product-detail";
      detail.textContent = product.detail;
      text.append(name, detail);
      const go = document.createElement("span");
      go.className = "product-go";
      go.textContent = "View";
      link.append(text, go);
      products.appendChild(link);
    });
  }

  const editor = BrushRemindersEditor.wire({
    list: document.getElementById("list"),
    addButton: document.getElementById("add"),
    soundTone: document.getElementById("sound-tone"),
    soundPlay: document.getElementById("sound-play"),
    enabled: document.getElementById("enabled"),
    status: status,
    compact: false,
  });

  document.getElementById("preview").addEventListener("click", async () => {
    status.textContent = "Showing your buddy…";
    const res = await chrome.runtime.sendMessage({ type: "PREVIEW" });
    if (res && res.shown) status.textContent = "It’s on your open website tab.";
    else if (res && res.waiting) status.textContent = "Switch to a website tab and your buddy will be there.";
    else if (res && res.notified) status.textContent = "No website was open, so a notification was sent.";
    else status.textContent = "Open a normal website tab, then preview again.";
  });

  chrome.runtime.sendMessage({ type: "GET_STATE" }).then((res) => {
    if (res && res.state) editor.load(res.state);
  });
})();
