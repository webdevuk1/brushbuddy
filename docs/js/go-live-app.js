(function () {
  "use strict";

  const STORAGE_KEY = "brushbuddy-go-live-checks-v2";

  const loginShell = document.getElementById("login-shell");
  const appShell = document.getElementById("app-shell");
  const setupShell = document.getElementById("setup-shell");
  const checklistRoot = document.getElementById("checklist");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const readyBanner = document.getElementById("ready-banner");

  function loadChecks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveChecks(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  function allItems() {
    const out = [];
    BrushGoLiveChecklist.forEach((section) => {
      section.items.forEach((item) => out.push(item));
    });
    return out;
  }

  function defaultMap() {
    const map = {};
    allItems().forEach((item) => {
      map[item.id] = Boolean(item.defaultDone);
    });
    return map;
  }

  function mergeChecks() {
    const defaults = defaultMap();
    const saved = loadChecks();
    const map = { ...defaults, ...saved };
    return map;
  }

  function updateProgress(map) {
    const items = allItems();
    const done = items.filter((item) => map[item.id]).length;
    const total = items.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    progressBar.style.width = pct + "%";
    progressText.textContent = done + " / " + total + " complete (" + pct + "%)";
    readyBanner.hidden = done < total;
  }

  function renderChecklist(map) {
    checklistRoot.innerHTML = "";
    BrushGoLiveChecklist.forEach((section) => {
      const sectionEl = document.createElement("section");
      sectionEl.className = "go-live-section";
      const heading = document.createElement("h2");
      heading.textContent = section.title;
      sectionEl.appendChild(heading);
      const list = document.createElement("ul");
      list.className = "go-live-list";
      section.items.forEach((item) => {
        const li = document.createElement("li");
        const label = document.createElement("label");
        label.className = "go-live-item";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = "check-" + item.id;
        input.checked = Boolean(map[item.id]);
        input.addEventListener("change", () => {
          map[item.id] = input.checked;
          saveChecks(map);
          updateProgress(map);
        });
        const span = document.createElement("span");
        span.textContent = item.label;
        label.append(input, span);
        li.appendChild(label);
        list.appendChild(li);
      });
      sectionEl.appendChild(list);
      checklistRoot.appendChild(sectionEl);
    });
    updateProgress(map);
  }

  function wireLogin() {
    const form = document.getElementById("login-form");
    const errorEl = document.getElementById("login-error");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";
      const username = document.getElementById("login-username").value;
      const password = document.getElementById("login-password").value;
      try {
        await BrushAdminAuth.loginAdmin(username, password);
        showApp();
      } catch (err) {
        errorEl.textContent = err.message || "Login failed.";
      }
    });
  }

  function wireLogout() {
    document.getElementById("logout").addEventListener("click", async () => {
      try {
        await BrushAdminAuth.logoutAdmin();
      } catch {
        /* still hide app */
      }
      showLogin();
    });
  }

  function wireReset() {
    document.getElementById("reset-checks").addEventListener("click", () => {
      if (!window.confirm("Reset all checkboxes to the default ticks?")) return;
      const map = defaultMap();
      saveChecks(map);
      renderChecklist(map);
    });
  }

  function showLogin() {
    loginShell.hidden = false;
    appShell.hidden = true;
    setupShell.hidden = true;
  }

  function showSetup() {
    loginShell.hidden = true;
    appShell.hidden = true;
    setupShell.hidden = false;
  }

  function showApp() {
    loginShell.hidden = true;
    setupShell.hidden = true;
    appShell.hidden = false;
    renderChecklist(mergeChecks());
  }

  async function init() {
    wireLogin();
    wireLogout();
    wireReset();
    try {
      const session = await BrushAdminAuth.fetchAdminSession();
      if (!session.configured) {
        showSetup();
        return;
      }
      if (session.authenticated) {
        showApp();
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  }

  init();
})();
