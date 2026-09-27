(function (root) {
  "use strict";

  /** defaultDone: true = pre-ticked (already in good shape). */
  root.BrushGoLiveChecklist = [
    {
      title: "Extension security (code)",
      items: [
        { id: "mv3-local-code", label: "Manifest V3 — all extension code is local (no remote scripts)", defaultDone: true },
        { id: "no-eval", label: "No eval / remote code in extension pages", defaultDone: true },
        { id: "no-externally-connectable", label: "No externally_connectable (sites cannot call the extension API)", defaultDone: true },
        { id: "no-exfil", label: "No analytics or data sent to your servers from the extension", defaultDone: true },
        { id: "storage-sanitize", label: "SAVE path sanitises reminders and prefs (lib/storage.js)", defaultDone: true },
        { id: "pill-actions", label: "PILL_ACTION limited to done / snooze / dismiss", defaultDone: true },
        { id: "buddy-shadow", label: "Buddy UI uses Shadow DOM and safe text (not user HTML)", defaultDone: true },
        { id: "store-zip-key", label: "Store zip strips manifest key (pack-store.ps1)", defaultDone: true },
        { id: "bridge-allowlist", label: "site-bridge.js allowlists message types (GET_STATE, SAVE, PREVIEW only)", defaultDone: false },
        { id: "sender-url-check", label: "Background rejects web-originated SAVE from untrusted sender URLs", defaultDone: false },
        { id: "shadow-closed", label: "Optional: closed Shadow DOM on buddy (harder page clickjacking)", defaultDone: false },
      ],
    },
    {
      title: "Permissions & injection",
      items: [
        { id: "perms-minimal", label: "API permissions limited to alarms, storage, notifications, scripting", defaultDone: true },
        { id: "host-broad-review", label: "Reviewed broad host access (needed for buddy on any tab) — documented in privacy", defaultDone: true },
        { id: "inject-own-files", label: "Only extension-owned JS injected (buddy.js, not page code)", defaultDone: true },
        { id: "bridge-origins", label: "site-bridge only on official site URLs in manifest", defaultDone: true },
        { id: "war-tighten", label: "Optional: narrow web_accessible_resources matches if Chrome allows", defaultDone: false },
      ],
    },
    {
      title: "Website (Vercel / docs)",
      items: [
        { id: "same-origin-js", label: "Public site loads only same-origin scripts (no random CDNs)", defaultDone: true },
        { id: "csp-headers", label: "Content-Security-Policy and security headers on Vercel", defaultDone: false },
        { id: "custom-domain-manifest", label: "Custom domain added to manifest content_scripts if you use one", defaultDone: false },
        { id: "robots-admin", label: "Admin / go-live not linked from public pages; robots noindex", defaultDone: true },
      ],
    },
    {
      title: "Legal & store listing",
      items: [
        { id: "privacy-terms", label: "Privacy, terms, and cookies published and linked", defaultDone: true },
        { id: "affiliate-disclosure", label: "Amazon affiliate disclosure on options + site + privacy", defaultDone: true },
        { id: "store-privacy-url", label: "Chrome listing privacy URL points at canonical host (Vercel)", defaultDone: false },
        { id: "support-email", label: "Support email filled in on Chrome Web Store listing", defaultDone: false },
        { id: "single-purpose", label: "Store listing matches single purpose (toothbrush reminders)", defaultDone: true },
      ],
    },
    {
      title: "Product & release",
      items: [
        { id: "smoke-pass", label: "scripts/smoke.mjs passes on latest build", defaultDone: false },
        { id: "ext-reload-038", label: "Unpacked extension reloaded at 0.3.8+; site sync tested", defaultDone: false },
        { id: "store-zip-current", label: "BrushBuddy-store.zip built and matches what you submit", defaultDone: false },
        { id: "chrome-review", label: "Chrome Web Store review passed (or trusted tester install verified)", defaultDone: false },
        { id: "visibility-public", label: "Switched from Private to Public / Unlisted when ready", defaultDone: false },
      ],
    },
    {
      title: "Accounts & operations",
      items: [
        { id: "2fa-google", label: "2FA on Google account (Chrome developer / store)", defaultDone: false },
        { id: "2fa-github-vercel", label: "2FA on GitHub and Vercel; deploy access locked down", defaultDone: false },
        { id: "admin-env", label: "ADMIN_USERNAME and ADMIN_PASSWORD set in Vercel Production", defaultDone: false },
        { id: "amazon-associates", label: "Amazon Associates account + site URLs approved", defaultDone: false },
        { id: "ci-optional", label: "Optional: smoke test on push (GitHub Actions)", defaultDone: false },
      ],
    },
  ];
})(typeof window !== "undefined" ? window : globalThis);
