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

## Checklist ticks

Checkbox state is stored in **localStorage** in your browser only (not on the server).
