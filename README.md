# BrushBuddy

A Chrome / Brave reminder to brush your teeth. Your buddy pops up on the site you’re on when a time you chose arrives (if reminders are on).

## How it works

1. **Toolbar popup** — Click the BrushBuddy icon. Set times, turn sound on, preview, or mark Done / Snooze when he’s waiting.
2. **On-page buddy** — On any normal `http` / `https` tab, he appears in the corner with Done, Snooze, and dismiss. Drag to move him.
3. **No website open** — If notifications are on, Windows / Brave shows a system alert instead.
4. **Full settings tab** — `brave://extensions` → BrushBuddy → **Details** → **Extension options** (same settings as the popup, bigger layout).
5. **Legal** — Privacy + Terms linked from the popup; host `privacy.html`, `terms.html`, `cookies.html`, and `legal/` publicly for the store (see `docs/LEGAL-COMPLIANCE.md`).

**Sound:** Pick your alert chime in the popup. **Preview buddy** plays it so you can hear it. Real alarms use the same sound. Replace the built-in chime by adding `assets/sounds/alert.mp3` (see that folder’s README).

**Not a separate website** — Everything runs inside the extension except the privacy page you host for the store.

## Load it

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. **Load unpacked** and choose this folder

Morning 7:30 and night 21:30 start on. Afternoon is there but off. Change them in the popup’s **Edit times**.

The buddy is drawn only while a reminder is waiting, and only on a normal website tab (`https://` or `http://`). On `chrome://` pages you’ll get a notification instead. If you close the buddy’s tab, open the popup and press **Done** or **Snooze 10 min**.

**Preview buddy** needs a normal website tab behind the popup.

## Money

The app stays free. Recommended links live only on the settings page.

1. Join [Amazon Associates](https://affiliate-program.amazon.co.uk/)
2. Put your tracking ID in `lib/affiliates.js` as `AFFILIATE_TAG`
3. Reload the extension

Until that ID is set, the links are ordinary Amazon searches and the settings page says so.

## Store

1. Host the legal pages at a public HTTPS URL (`privacy.html` is required in the listing; also publish `terms.html` and `cookies.html`). Put your support email on the listing. Read `docs/LEGAL-COMPLIANCE.md` for cookies, GDPR, and the Data safety form.
2. Run `powershell -File scripts/pack-store.ps1`. Upload `dist/BrushBuddy-store.zip`. The pack leaves out the local `key`, so your unpacked extension id stays stable.
3. Permission reason: the buddy is drawn on normal websites when a reminder is due. It does not read those pages.
4. Screenshots are in `store/` at 1280×800.

Suggested listing line: “Your little buddy pops up when it's time to brush your teeth.”

Shopping links stay hidden until `AFFILIATE_TAG` in `lib/affiliates.js` is set.
