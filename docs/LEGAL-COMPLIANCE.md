# Legal & compliance checklist (Brush Buddies)

**This document is practical guidance, not legal advice.** For a company, high risk data, or if you are unsure, speak to a solicitor familiar with UK/EU privacy and consumer law.

## What you must do for the Chrome Web Store

1. **Privacy policy URL** — Host `privacy.html` at a stable public HTTPS URL (GitHub Pages, Cloudflare Pages, etc.). Put that exact URL in the store listing.
2. **Support email** — Required on the listing. Use an address you check; the legal pages point users there.
3. **Single purpose & permissions** — Your listing must honestly describe why you need `host_permissions` (show buddy on open http/https tabs when a reminder fires; no page reading).
4. **Data safety form** — In the Developer Dashboard, declare what the extension collects. For Brush Buddies as shipped:
   - **No** data sent to the developer’s servers
   - **Local** storage only: reminder settings, prefs, pending state, last Done time, buddy position
   - **Not** used for advertising or sale
   - **Optional:** if you enable Amazon affiliate links, disclose in listing + privacy (already in `privacy.html`)

Suggested answers align with “data stored locally on device” and “not collected by developer”.

## Cookies — what you heard about and what applies to you

| Situation | Cookie banner? |
|-----------|----------------|
| Brush Buddies extension only (no analytics) | **No** — extension uses `chrome.storage`, not website cookies |
| Static legal pages, no trackers | **Usually no** |
| Marketing website with Google Analytics / ads / Facebook pixel | **Yes** (UK GDPR / EU ePrivacy) — use a consent platform |
| Amazon links user clicks | Amazon sets cookies **on amazon.com** — disclose in privacy; no banner needed in extension for that |

UK rules: [ICO guidance on cookies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/).

## GDPR / UK GDPR (if you have UK or EEA users)

You are a **controller** for any personal data you process. Brush Buddies minimizes this:

- **No accounts, no cloud database** — most “rights” requests are satisfied by uninstalling or clearing extension data.
- **Document** what you do in `privacy.html` (done).
- **Lawful basis** — providing the extension users installed; legitimate interests for operating it (documented in privacy policy).
- **No DPIA** typically required for this low-risk local-only design; reassess if you add sync, accounts, or analytics.

## Terms of use

Not always mandatory for a free extension, but **recommended** to limit liability (no dental advice, as-is service, cap on damages). Host `terms.html` next to privacy and link from the store “website” or support docs if you want.

## Affiliate (Amazon Associates)

If you set `AFFILIATE_TAG` in `lib/affiliates.js`:

- Follow [Amazon’s operating agreement](https://affiliate-program.amazon.co.uk/help/operating/policies) and **clearly disclose** affiliate relationship (FTC-style: “we may earn a commission” — in privacy + on settings page via `BrushAffiliates.disclosure`).
- Do not imply Amazon endorses Brush Buddies.

## Hosting the legal pages (recommended)

1. Create a repo or folder with:
   - `privacy.html`
   - `terms.html`
   - `cookies.html`
   - `legal/legal.css`
2. Enable GitHub Pages (or similar) on `main` → `https://yourusername.github.io/brushbuddy/privacy.html`
3. Store listing **Privacy policy** field → that URL.
4. Optional: add Terms URL in “Official website” or developer site field.

**Do not** add Google Analytics to these pages unless you implement consent.

## Before launch — quick audit

- [ ] Public privacy URL live and matches extension behaviour
- [ ] Support email on store listing matches what you monitor
- [ ] Data safety form completed honestly
- [ ] Screenshots and description match actual permissions
- [ ] If affiliates enabled: disclosure visible + Amazon policies read
- [ ] Governing law in `terms.html` matches where you operate (default: England and Wales — edit if needed)
- [ ] Replace “developer on store listing” with your legal/trading name in policies if your jurisdiction requires a named controller address

## What reduces lawsuit risk (realistically)

- **Truthful privacy policy** and minimal data collection (you already do this).
- **No medical claims** — terms say “reminder only” (done).
- **Reasonable liability cap** in terms (done; enforceability varies by country).
- **Respond to user emails** and fix security issues promptly.
- **Insurance** — optional professional indemnity if you scale or add paid features.

None of this guarantees zero legal risk; it aligns with common practice for a small, local-only extension.
