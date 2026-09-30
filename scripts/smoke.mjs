import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profile = path.join(root, "profile-smoke");
const port = 9333;
const extensionId = "ahefkhdccelingdgkkejiejpojghomae";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.next = 1;
    this.pending = new Map();
    this.contexts = [];
    ws.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.method === "Runtime.executionContextCreated") {
        this.contexts.push(data.params.context);
      }
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.error) reject(new Error(JSON.stringify(data.error)));
        else resolve(data.result);
      }
    });
  }
  static async open(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });
    return new Cdp(ws);
  }
  send(method, params) {
    const id = this.next++;
    const payload = JSON.stringify({ id, method, params: params || {} });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
    });
  }
  close() {
    this.ws.close();
  }
}

fs.rmSync(profile, { recursive: true, force: true });

const chrome = spawn(
  chromePath,
  [
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    "--enable-unsafe-extension-debugging",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--headless=new",
    "--window-size=1280,800",
    "https://example.com/",
  ],
  { stdio: ["ignore", "pipe", "pipe"] }
);
let chromeLogs = "";
chrome.stdout.on("data", (chunk) => {
  chromeLogs += chunk.toString();
});
chrome.stderr.on("data", (chunk) => {
  chromeLogs += chunk.toString();
});

let failed = null;
try {
  await waitForPage();
  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const browser = await Cdp.open(version.webSocketDebuggerUrl);
  const loaded = await browser.send("Extensions.loadUnpacked", { path: root });
  console.log("loaded", JSON.stringify(loaded));
  const list = await waitForExtension();
  console.log(list.map((target) => target.type + " " + target.url).join("\n"));
  const page = list.find((target) => (target.url || "").startsWith("https://example.com"));
  if (!page) throw new Error("example.com tab missing: " + list.map((t) => t.url).join(" | "));
  const pageSession = await Cdp.open(page.webSocketDebuggerUrl);
  await pageSession.send("Page.enable");
  await pageSession.send("Page.reload", { ignoreCache: true });
  await pageSession.send("Runtime.enable");
  await delay(800);
  const vis = await pageSession.send("Runtime.evaluate", {
    expression: "document.visibilityState + ' ' + location.href",
    returnByValue: true,
  });
  console.log("page", vis.result?.value);
  const targetsNow = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const swInfo = targetsNow.find((target) => (target.url || "").includes("background.js"));
  const swSession = await Cdp.open(swInfo.webSocketDebuggerUrl);
  await swSession.send("Runtime.enable");
  await delay(200);
  const swCtx = swSession.contexts.find((ctx) => (ctx.origin || "").includes(extensionId)) || swSession.contexts[0];
  await swSession.send("Runtime.evaluate", {
    expression: `chrome.tabs.query({}).then(async (tabs) => {
      const web = tabs.find((tab) => (tab.url || '').startsWith('https://example.com'));
      if (!web) return;
      await chrome.tabs.update(web.id, { active: true });
      if (web.windowId != null) await chrome.windows.update(web.windowId, { focused: true });
    })`,
    contextId: swCtx && swCtx.id,
    awaitPromise: true,
  });
  await pageSession.send("Page.bringToFront");
  await delay(300);
  const optionsTarget = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("chrome-extension://" + extensionId + "/options/options.html")}`, { method: "PUT" });
  const optionsInfo = await optionsTarget.json();
  const optionsSession = await Cdp.open(optionsInfo.webSocketDebuggerUrl);
  await optionsSession.send("Runtime.enable");
  await delay(400);
  await swSession.send("Runtime.evaluate", {
    expression: `chrome.tabs.query({}).then(async (tabs) => {
      const web = tabs.find((tab) => (tab.url || '').startsWith('https://example.com'));
      if (!web) return;
      await chrome.tabs.update(web.id, { active: true });
      if (web.windowId != null) await chrome.windows.update(web.windowId, { focused: true });
    })`,
    contextId: swCtx && swCtx.id,
    awaitPromise: true,
  });
  await pageSession.send("Page.bringToFront");
  await delay(300);
  const contexts = await pageSession.send("Runtime.evaluate", {
    expression: "location.href",
    returnByValue: true,
  });
  if (!String(contexts.result?.value).includes("example.com")) {
    throw new Error("page not example: " + contexts.result?.value);
  }
  const preview = await optionsSession.send("Runtime.evaluate", {
    expression: "chrome.runtime.sendMessage({type:'PREVIEW'})",
    awaitPromise: true,
    returnByValue: true,
  });
  const previewValue = preview.result?.value;
  if (!previewValue?.shown) throw new Error("preview did not show: " + JSON.stringify(previewValue));
  await delay(200);
  const pill = await pageSession.send("Runtime.evaluate", {
    expression: `(() => {
      const host = document.getElementById('brushbuddy-host');
      if (!host || !host.shadowRoot) return { ok: false, reason: 'missing host' };
      const text = host.shadowRoot.textContent || '';
      const box = host.getBoundingClientRect();
      const face = host.shadowRoot.querySelector('img.buddy');
      return { ok: text.includes("I'm brushing") && !!face && (face.src || '').includes('closeup') && box.width > 40 && box.height > 20, text, width: box.width, height: box.height };
    })()`,
    returnByValue: true,
  });
  if (!pill.result?.value?.ok) throw new Error("buddy render: " + JSON.stringify(pill.result?.value));
  const storeDir = path.join(root, "store");
  fs.mkdirSync(storeDir, { recursive: true });
  const reminderShot = await pageSession.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(storeDir, "reminder.png"), Buffer.from(reminderShot.data, "base64"));
  const done = await pageSession.send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.getElementById('brushbuddy-host')?.shadowRoot?.querySelector('.done');
      if (!btn) return false;
      btn.click();
      return true;
    })()`,
    returnByValue: true,
  });
  if (!done.result?.value) throw new Error("done button missing");
  await delay(300);
  const after = await pageSession.send("Runtime.evaluate", {
    expression: "document.getElementById('brushbuddy-host') ? 'still-there' : 'gone'",
    returnByValue: true,
  });
  if (after.result?.value !== "gone") throw new Error("buddy stayed after Done");
  const state = await optionsSession.send("Runtime.evaluate", {
    expression: "chrome.runtime.sendMessage({type:'GET_STATE'})",
    awaitPromise: true,
    returnByValue: true,
  });
  const saved = state.result?.value?.state;
  if (!saved?.lastDoneAt || saved.pending) throw new Error("state after done: " + JSON.stringify(saved));
  if (!saved.reminders || saved.reminders.length < 2) throw new Error("reminders missing");
  const options = await optionsSession.send("Runtime.evaluate", {
    expression: `({
      title: document.querySelector('h1')?.textContent || '',
      rows: document.querySelectorAll('#list li').length,
      products: document.querySelectorAll('#products a').length,
      recommendedHidden: document.getElementById('recommended')?.hidden === true
    })`,
    returnByValue: true,
  });
  const optionsShot = await optionsSession.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(storeDir, "settings.png"), Buffer.from(optionsShot.data, "base64"));
  const ui = options.result?.value;
  const affiliateOn = ui?.products === 6 && ui?.recommendedHidden === false;
  const affiliateOff = ui?.products === 0 && ui?.recommendedHidden === true;
  if (ui?.title !== "Brush Buddies" || ui.rows !== 3 || (!affiliateOn && !affiliateOff)) {
    throw new Error("options ui: " + JSON.stringify(ui));
  }
  console.log("smoke passed", pill.result.value.width + "x" + pill.result.value.height, JSON.stringify(ui));
  pageSession.close();
  optionsSession.close();
  browser.close();
} catch (err) {
  failed = err;
  console.error("smoke failed:", err && err.stack ? err.stack : err);
  console.error(chromeLogs.slice(-5000));
} finally {
  chrome.kill();
  await delay(300);
  try {
    spawn("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
  } catch (_err) {
    /* already gone */
  }
  await delay(800);
  try {
    fs.rmSync(profile, { recursive: true, force: true });
  } catch (_err) {
    /* Chrome can keep the profile lock for a moment after exit. */
  }
}

if (failed) process.exit(1);

async function waitForPage() {
  const started = Date.now();
  while (Date.now() - started < 20000) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        if (list.some((target) => (target.url || "").startsWith("https://example.com"))) return list;
      }
    } catch (_err) {
      /* debugger not up yet */
    }
    await delay(250);
  }
  throw new Error("example.com tab did not open");
}

async function waitForExtension() {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    const res = await fetch(`http://127.0.0.1:${port}/json/list`);
    const list = await res.json();
    if (list.some((target) => (target.url || "").includes(extensionId))) return list;
    await delay(250);
  }
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const list = await res.json();
  throw new Error("extension target missing: " + JSON.stringify(list.map((t) => ({ type: t.type, url: t.url }))));
}
