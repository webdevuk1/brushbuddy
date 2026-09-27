(function (root) {
  "use strict";

  /**
   * defaultDone: true = already verified in the codebase / docs (pre-ticked).
   * Tick manually for ops, store, and “I tested this” items.
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
          label: "Confirmed: no cookie pop-up required on static site unless you add trackers later",
          defaultDone: true,
        },
        {
          id: "amazon-cookies-disclosed",
          label: "Privacy states Amazon sets its own cookies only when user opens affiliate links",
          defaultDone: true,
        },
        {
          id: "chrome-sync-disclosed",
          label: "Privacy mentions optional Chrome extension sync (Google), not BrushBuddy servers",
          defaultDone: true,
        },
        {
          id: "we-do-not-sell",
          label: "Privacy states we do not sell personal data",
          defaultDone: true,
        },
      ],
    },
    {
      title: "Affiliate marketing (Amazon UK)",
      items: [
        {
          id: "affiliate-tag-set",
          label: "AFFILIATE_TAG set in lib/affiliates.js (brushbuddy21-21)",
          defaultDone: true,
        },
        {
          id: "affiliate-disclosure-options",
          label: "Commission disclosure visible on extension options when links show",
          defaultDone: true,
        },
        {
          id: "affiliate-disclosure-site",
          label: "Same disclosure on website settings page (docs)",
          defaultDone: true,
        },
        {
          id: "affiliate-disclosure-privacy",
          label: "Privacy §5 covers Amazon links and commission",
          defaultDone: true,
        },
        {
          id: "affiliate-terms",
          label: "Terms §5 covers third-party retailers and commission",
          defaultDone: true,
        },
        {
          id: "affiliate-rel-sponsored",
          label: "Amazon links use rel=\"sponsored\" (options, popup if shown, website)",
          defaultDone: true,
        },
        {
          id: "amazon-sites-listed",
          label: "Vercel + GitHub URLs listed in Amazon Associates account",
          defaultDone: false,
        },
        {
          id: "amazon-operating-agreement",
          label: "Read Amazon Associates operating agreement (no false claims / endorsement)",
          defaultDone: false,
        },
        {
          id: "amazon-qualifying-sales",
          label: "Amazon approval path understood (e.g. qualifying purchases rule)",
          defaultDone: false,
        },
      ],
    },
    {
      title: "Privacy, terms & legal pages",
      items: [
        {
          id: "legal-published-vercel",
          label: "privacy.html, terms.html, cookies.html live on canonical host (Vercel)",
          defaultDone: true,
        },
        {
          id: "legal-sync-script",
          label: "Root legal files synced to docs/ (scripts/sync-legal-to-docs.ps1) before publish",
          defaultDone: false,
        },
        {
          id: "legal-nav-linked",
          label: "Legal pages cross-link Privacy / Terms / Cookies",
          defaultDone: true,
        },
        {
          id: "popup-legal-links",
          label: "Popup links to Privacy and Terms",
          defaultDone: true,
        },
        {
          id: "store-privacy-url",
          label: "Chrome Web Store privacy policy URL = Vercel privacy.html (not old GitHub if retired)",
          defaultDone: false,
        },
        {
          id: "support-email-store",
          label: "Support email on Chrome listing matches privacy “contact” expectations",
          defaultDone: false,
        },
        {
          id: "gdpr-plain-language",
          label: "Privacy covers permissions, legal basis, retention, and user rights (UK/EU-style)",
          defaultDone: true,
        },
        {
          id: "single-purpose-store",
          label: "Store listing describes one purpose: toothbrush reminders (matches behaviour)",
          defaultDone: true,
        },
      ],
    },
    {
      title: "Extension security (code)",
      items: [
        { id: "mv3-local-code", label: "Manifest V3 — all extension code bundled locally", defaultDone: true },
        { id: "no-eval", label: "No eval(), new Function(), or remote scripts in extension pages", defaultDone: true },
        {
          id: "no-externally-connectable",
          label: "No externally_connectable (random sites cannot call extension APIs)",
          defaultDone: true,
        },
        { id: "no-exfil", label: "No fetch/XHR to your servers from extension code", defaultDone: true },
        { id: "storage-sanitize", label: "SAVE input normalised in lib/storage.js (limits, types, labels)", defaultDone: true },
        { id: "pill-actions", label: "PILL_ACTION only allows done / snooze / dismiss", defaultDone: true },
        { id: "buddy-shadow", label: "Buddy UI: Shadow DOM + textContent (not HTML from users)", defaultDone: true },
        { id: "store-zip-key", label: "Store zip removes manifest key (scripts/pack-store.ps1)", defaultDone: true },
        {
          id: "bridge-allowlist",
          label: "site-bridge only forwards GET_STATE, SAVE, PREVIEW (not PILL_ACTION)",
          defaultDone: true,
        },
        {
          id: "sender-url-check",
          label: "Background blocks SAVE / PREVIEW / GET_STATE except popup, options, or official site",
          defaultDone: true,
        },
        {
          id: "shadow-closed",
          label: "Optional: closed Shadow DOM on buddy (extra clickjacking hardening)",
          defaultDone: false,
        },
      ],
    },
    {
      title: "Permissions & injection",
      items: [
        {
          id: "perms-minimal",
          label: "Permissions: alarms, storage, notifications, scripting only",
          defaultDone: true,
        },
        {
          id: "host-broad-documented",
          label: "Broad http(s) host access documented in privacy (buddy on open tabs)",
          defaultDone: true,
        },
        {
          id: "inject-own-files",
          label: "Only extension files injected (buddy.js, characters, alert sound)",
          defaultDone: true,
        },
        {
          id: "bridge-origins",
          label: "site-bridge manifest matches only official GitHub + Vercel paths",
          defaultDone: true,
        },
        {
          id: "no-page-scraping",
          label: "Extension does not read or transmit page text / passwords",
          defaultDone: true,
        },
        {
          id: "war-assets-only",
          label: "web_accessible_resources exposes only images + alert sound (no JS)",
          defaultDone: true,
        },
        {
          id: "custom-domain-manifest",
          label: "If using a custom domain: add it to content_scripts.matches + checklist site URL",
          defaultDone: false,
        },
      ],
    },
    {
      title: "Website & admin (Vercel)",
      items: [
        { id: "same-origin-js", label: "Public site scripts loaded from same origin only", defaultDone: true },
        {
          id: "csp-headers",
          label: "Content-Security-Policy + security headers on public site (vercel.json)",
          defaultDone: true,
        },
        {
          id: "admin-login-env",
          label: "ADMIN_USERNAME + ADMIN_PASSWORD set in Vercel Production",
          defaultDone: false,
        },
        {
          id: "admin-http-only",
          label: "Admin session uses HttpOnly signed cookie (api/admin/auth)",
          defaultDone: true,
        },
        {
          id: "admin-not-linked",
          label: "Go-live admin not linked from public homepage; robots Disallow /admin/",
          defaultDone: true,
        },
        {
          id: "site-extension-sync-tested",
          label: "Tested: website ↔ extension sync with 0.3.8+ installed",
          defaultDone: false,
        },
      ],
    },
    {
      title: "Product quality & Chrome release",
      items: [
        { id: "smoke-pass", label: "scripts/smoke.mjs passes on latest build", defaultDone: false },
        { id: "ext-reload-latest", label: "Developer build reloaded after security changes", defaultDone: false },
        { id: "store-zip-current", label: "dist/BrushBuddy-store.zip rebuilt and matches store upload", defaultDone: false },
        { id: "chrome-review", label: "Chrome review approved or trusted-tester install verified", defaultDone: false },
        { id: "visibility-public", label: "Store visibility Public / Unlisted when ready (not Private)", defaultDone: false },
        { id: "homepage-url-store", label: "Store homepage URL points at Vercel site", defaultDone: false },
      ],
    },
    {
      title: "Accounts & operations",
      items: [
        { id: "2fa-google", label: "2FA on Google account (Chrome Web Store developer)", defaultDone: false },
        { id: "2fa-github-vercel", label: "2FA on GitHub and Vercel; limited deploy access", defaultDone: false },
        { id: "strong-admin-password", label: "Strong unique ADMIN_PASSWORD (rotate if shared in chat)", defaultDone: false },
        { id: "ci-optional", label: "Optional: run smoke.mjs on GitHub push", defaultDone: false },
      ],
    },
  ];
})(typeof window !== "undefined" ? window : globalThis);
