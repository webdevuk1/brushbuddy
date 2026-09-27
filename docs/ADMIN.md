# BrushBuddy admin (go-live checklist)

Private checklist at **`/admin/go-live`** (or `/admin/go-live.html`) on your Vercel site (not linked from the public homepage).

## Login (same pattern as Matty’s BBQ)

1. Vercel → your BrushBuddy project → **Settings** → **Environment Variables**
2. Add for **Production**:
   - `ADMIN_USERNAME` — your chosen username
   - `ADMIN_PASSWORD` — a strong password
3. **Redeploy** (Deployments → … → Redeploy)

Session cookie is HttpOnly, signed server-side (7 days). Failed logins are rate-limited per IP on the serverless function.

## Local preview

`vercel dev` from the repo root serves both `docs/` and `/api/admin/auth`. Without env vars you will see the “Admin locked” setup screen.

## Bug reports (email)

Users can open **Report a bug** on the website and extension. Reports POST to `/api/bug-report` and email you via [Resend](https://resend.com/).

1. Create a Resend account and API key.
2. Vercel → **Environment Variables** (Production):
   - `RESEND_API_KEY` — your Resend API key
   - `BUG_REPORT_TO_EMAIL` — optional; defaults to `info@jameshoy.dev`
   - `RESEND_FROM` — optional; defaults to `BrushBuddy <info@jameshoy.dev>` (domain must be verified in Resend)
3. **Redeploy** after saving.

Replies use the reporter’s email as `Reply-To`.

## Checklist ticks

Checkbox state is stored in **localStorage** in your browser only (not on the server).
