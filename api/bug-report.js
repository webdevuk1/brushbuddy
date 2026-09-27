import { getBugReportLock, recordBugReport } from "./_lib/bugReportGuard.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return { error: "Invalid JSON body" };
    }
  }
  return { body: body || {} };
}

function sanitizeText(value, maxLen) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLen);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false, error: "method-not-allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.BUG_REPORT_TO_EMAIL;
  const fromEmail = process.env.RESEND_FROM || "BrushBuddy <onboarding@resend.dev>";

  if (!apiKey || !toEmail) {
    return res.status(503).json({ ok: false, error: "not-configured" });
  }

  const lock = getBugReportLock(req);
  if (lock.locked) {
    res.setHeader("Retry-After", String(lock.retryAfterSec));
    return res.status(429).json({ ok: false, error: "rate-limited" });
  }

  const parsed = parseBody(req);
  if (parsed.error) {
    return res.status(400).json({ ok: false, error: parsed.error });
  }

  const body = parsed.body;
  if (body.company) {
    return res.status(200).json({ ok: true });
  }

  const email = sanitizeText(body.email, 120);
  const message = sanitizeText(body.message, 2000);
  const source = sanitizeText(body.source, 40) || "unknown";
  const version = sanitizeText(body.version, 24);

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: "invalid-email" });
  }
  if (message.length < 10) {
    return res.status(400).json({ ok: false, error: "message-too-short" });
  }

  const subject = "BrushBuddy bug report";
  const text =
    "From: " +
    email +
    "\nSource: " +
    source +
    (version ? "\nVersion: " + version : "") +
    "\n\n" +
    message;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: subject,
        text: text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Resend error", response.status, detail);
      return res.status(502).json({ ok: false, error: "send-failed" });
    }

    recordBugReport(lock.key);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("bug-report", err);
    return res.status(502).json({ ok: false, error: "send-failed" });
  }
}
