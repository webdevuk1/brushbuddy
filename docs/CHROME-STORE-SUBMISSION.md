# Chrome Web Store submission — BrushBuddy

Use this after `dist/BrushBuddy-store.zip` is built and legal pages are live on GitHub Pages.

## URLs (fill after Pages is enabled)

| Field | URL |
|--------|-----|
| Privacy policy | `https://brushbuddy-roan.vercel.app/privacy.html` |
| Official website (optional) | `https://brushbuddy-roan.vercel.app/` |

If your repo name differs, replace `brushbuddy` in the path.

## Upload package

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. **New item** → upload `dist/BrushBuddy-store.zip`
3. **Store listing**
   - **Name:** BrushBuddy
   - **Summary:** Your little buddy pops up when it's time to brush your teeth.
   - **Description:** BrushBuddy reminds you to brush at the times you choose. Set morning and night (or more) in the toolbar popup. When a reminder is due, your buddy appears on the website tab you have open — Done, Snooze, or dismiss. Optional sound and system notifications if no tab can show him. All settings stay on your device; no account required.
   - **Category:** Productivity or Health & Fitness
   - **Language:** English
4. **Graphics:** `store/reminder.png`, `store/settings.png` (1280×800 from smoke test)
5. **Privacy:** paste privacy policy URL above
6. **Contact email:** your real support address

## Single purpose

> Remind the user to brush their teeth at scheduled times by showing an on-page buddy or a notification.

## Permission justification (host access)

> BrushBuddy only injects its own buddy UI on http/https tabs when a reminder the user scheduled is active. It does not read, collect, or transmit page content. Host access is required to draw the reminder on the site the user is already viewing.

## Data safety (typical answers for this build)

| Question | Answer |
|----------|--------|
| Does your extension collect user data? | **No** — or “No data collected by developer”; all reminder data stays in `chrome.storage.local` on device |
| Data types | None transmitted to developer |
| Purpose | Not applicable / local functionality only |
| Sold to third parties | No |
| Used for advertising | No |
| Encryption in transit | N/A (no developer server) |
| Deletion | User uninstalls extension or clears extension data |

Align every answer with `privacy.html`. If Google’s form wording differs, choose the closest honest option.

## Review tips

- Keep a normal website tab open when testing preview in review notes if asked.
- Do not enable Amazon affiliate tag until disclosure is visible in the build you ship.
