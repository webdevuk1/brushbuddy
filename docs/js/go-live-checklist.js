(function (root) {
  "use strict";

  /**
   * defaultDone: true = done in repo / verified by automation.
   * false = you must confirm in Chrome, Amazon, Vercel, or browser.
   */
  root.BrushGoLiveChecklist = [
    {
      title: "Data, cookies & tracking",
      items: [
        {
          id: "no-cookies-extension",
          label: "Extension uses chrome.storage.local — not website cookies for your settings",
          defaultDone: true,
        },
        {
          id: "no-data-to-our-servers",
          label: "Reminder data stays on device; extension does not send settings to BrushBuddy servers",
          defaultDone: true,
        },
        {
          id: "no-analytics-extension",
          label: "No Google Analytics, ad pixels, or trackers in the extension",
          defaultDone: true,
        },
        {
          id: "no-analytics-site",
          label: "Public Vercel site has no analytics or third-party ad scripts",
          defaultDone: true,
        },
        {
          id: "cookies-page-accurate",
          label: "Cookie notice explains extension storage vs Amazon cookies (docs/cookies.html)",
          defaultDone: true,
        },
        {
          id: "no-cookie-banner-needed",
          label: "No cookie pop-up on static site (unless you add trackers later)",
          defaultDone: true,
        },
        {
          id: "amazon-cookies-disclosed",
          label: "Privacy: Amazon sets its own cookies only when user opens affiliate links",
          defaultDone: true,
        },
        {
          id: "chrome-sync-disclosed",
          label: "Privacy mentions optional Chrome extension sync (Google), not our servers",
          defaultDone: true,
        },
        { id: "we-do-not-sell", label: "Privacy states we do not sell personal data", defaultDone: true },
        {
          id: "no-analytics-promise",
          label: "If you add Vercel Analytics / pixels later: update cookies.html + consent first",
          defaultDone: true,
        },
      ],
    },
    {
      title: "Affiliate marketing (Amazon UK)",
      items: [
        { id: "affiliate-tag-set", label: "AFFILIATE_TAG set in lib/affiliates.js", defaultDone: true },
        { id: "affiliate-disclosure-options", label: "Commission disclosure on extension options", defaultDone: true },
        { id: "affiliate-disclosure-site", label: "Commission disclosure on website settings page", defaultDone: true },
        { id: "affiliate-disclosure-privacy", label: "Privacy covers Amazon links and commission", defaultDone: true },
        { id: "affiliate-terms", label: "Terms cover third-party retailers and commission", defaultDone: true },
        {
          id: "affiliate-rel-sponsored",
          label: "Amazon links use rel=\"sponsored\" (options + website)",
          defaultDone: true,
        },
        { id: "amazon-sites-listed", label: "Vercel + GitHub URLs listed in Amazon Associates", defaultDone: false },
        { id: "amazon-operating-agreement", label: "Read Amazon Associates operating agreement", defaultDone: false },
        { id: "amazon-qualifying-sales", label: "Amazon approval / qualifying purchases understood", defaultDone: false },
      ],
    },
    {
      title: "Privacy, terms & legal pages",
      items: [
        {
          id: "legal-published-vercel",
          label: "privacy / terms / cookies live on https://brushbuddy-roan.vercel.app",
          defaultDone: true,
        },
        {
          id: "legal-sync-script",
          label: "Root legal files synced to docs/ (sync-legal-to-docs.ps1)",
          defaultDone: true,
        },
        { id: "legal-nav-linked", label: "Legal pages cross-link Privacy / Terms / Cookies", defaultDone: true },
        {
          id: "popup-legal-host",
          label: "Popup & options footer links point at hosted Vercel legal pages",
          defaultDone: true,
        },
        {
          id: "listing-paste-urls",
          label: "docs/LISTING-PASTE.txt uses Vercel privacy + homepage URLs",
          defaultDone: true,
        },
        {
          id: "medical-not-advice",
          label: "Terms state BrushBuddy is not medical/dental advice",
          defaultDone: true,
        },
        {
          id: "gdpr-plain-language",
          label: "Privacy covers permissions, legal basis, retention, user rights",
          defaultDone: true,
        },
        { id: "single-purpose-store", label: "Store listing = toothbrush reminders only", defaultDone: true },
        {
          id: "store-privacy-url",
          label: "Chrome dashboard privacy URL pasted from LISTING-PASTE.txt",
          defaultDone: false,
        },
        {
          id: "support-email-store",
          label: "Support email on Chrome listing (same one you answer)",
          defaultDone: false,
        },
      ],
    },
    {
      title: "Legal posture (you confirm — not legal advice)",
      items: [
        {
          id: "sole-developer-ok",
          label: "Happy publishing as individual developer named on the store listing",
          defaultDone: false,
        },
        {
          id: "general-audience",
          label: "Listing is general audience (not marketed to children under 13)",
          defaultDone: false,
        },
        {
          id: "international-users",
          label: "Comfortable global Chrome users seeing UK Amazon links + UK-focused privacy text",
          defaultDone: false,
        },
        {
          id: "no-server-ico",
          label: "Understood: no user data on our servers (typical ICO registration not expected for this design)",
          defaultDone: false,
        },
        {
          id: "checklist-not-lawyer",
          label: "This checklist is engineering/ops only — not a substitute for a solicitor",
          defaultDone: false,
        },
      ],
    },
    {
      title: "Extension security (code)",
      items: [
        { id: "mv3-local-code", label: "Manifest V3 — bundled local code", defaultDone: true },
        { id: "no-eval", label: "No eval / remote scripts in extension pages", defaultDone: true },
        { id: "no-externally-connectable", label: "No externally_connectable", defaultDone: true },
        { id: "no-exfil", label: "No calls to developer servers from extension code", defaultDone: true },
        { id: "storage-sanitize", label: "SAVE normalised in lib/storage.js", defaultDone: true },
        { id: "pill-actions", label: "PILL_ACTION: done / snooze / dismiss only", defaultDone: true },
        { id: "buddy-shadow", label: "Buddy: Shadow DOM + textContent", defaultDone: true },
        { id: "store-zip-key", label: "Store zip strips manifest key", defaultDone: true },
        { id: "bridge-allowlist", label: "site-bridge allowlists GET_STATE, SAVE, PREVIEW", defaultDone: true },
        { id: "sender-url-check", label: "Background restricts settings APIs by sender URL", defaultDone: true },
        { id: "shadow-closed", label: "Optional: closed Shadow DOM on buddy", defaultDone: false },
      ],
    },
    {
      title: "Permissions & injection",
      items: [
        { id: "perms-minimal", label: "Permissions: alarms, storage, notifications, scripting", defaultDone: true },
        { id: "host-broad-documented", label: "Broad host access explained in privacy", defaultDone: true },
        { id: "inject-own-files", label: "Only extension files injected on tabs", defaultDone: true },
        { id: "bridge-origins", label: "site-bridge only on official GitHub + Vercel paths", defaultDone: true },
        { id: "no-page-scraping", label: "Does not read or send page content", defaultDone: true },
        { id: "war-assets-only", label: "web_accessible_resources: images + sound only", defaultDone: true },
        {
          id: "no-custom-domain",
          label: "Not using a custom domain (skip manifest update) — or you added it",
          defaultDone: true,
        },
      ],
    },
    {
      title: "Website & admin (Vercel)",
      items: [
        { id: "same-origin-js", label: "Site scripts same-origin only", defaultDone: true },
        { id: "csp-headers", label: "CSP + security headers (vercel.json)", defaultDone: true },
        { id: "admin-login-env", label: "ADMIN_USERNAME + ADMIN_PASSWORD in Vercel Production", defaultDone: true },
        { id: "admin-http-only", label: "Admin HttpOnly signed session cookie", defaultDone: true },
        { id: "admin-not-linked", label: "Admin not on public nav; robots Disallow /admin/", defaultDone: true },
        {
          id: "site-extension-sync-tested",
          label: "You tested website ↔ extension sync (0.3.9+)",
          defaultDone: false,
        },
      ],
    },
    {
      title: "Product quality & Chrome release",
      items: [
        { id: "smoke-pass", label: "scripts/smoke.mjs passes on latest build", defaultDone: true },
        { id: "store-zip-current", label: "dist/BrushBuddy-store.zip rebuilt (pack-store.ps1)", defaultDone: true },
        { id: "ext-reload-latest", label: "You reloaded unpacked extension at 0.3.9 in chrome://extensions", defaultDone: false },
        { id: "chrome-review", label: "Chrome review approved OR trusted-tester install works", defaultDone: false },
        { id: "homepage-url-store", label: "Chrome listing homepage = https://brushbuddy-roan.vercel.app/", defaultDone: false },
        { id: "visibility-public", label: "Store visibility Public / Unlisted when ready", defaultDone: false },
      ],
    },
    {
      title: "Your turn — accounts & password",
      items: [
        { id: "2fa-google", label: "2FA on Google (Chrome Web Store developer)", defaultDone: false },
        { id: "2fa-github-vercel", label: "2FA on GitHub and Vercel", defaultDone: false },
        {
          id: "strong-admin-password",
          label: "Rotate ADMIN_PASSWORD if it was ever shared (Vercel env + redeploy)",
          defaultDone: false,
        },
        { id: "ci-optional", label: "Optional: GitHub Action to run smoke.mjs on push", defaultDone: false },
      ],
    },
  ];
})(typeof window !== "undefined" ? window : globalThis);
