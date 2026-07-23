import "server-only";
import { Resend } from "resend";

/**
 * Email service. Uses Resend when RESEND_API_KEY is set; otherwise logs the
 * message server-side (dev fallback) so flows remain testable without keys.
 * DB-driven email_templates arrive with the admin panel; these are the
 * built-in defaults they will override.
 */

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const FROM = process.env.EMAIL_FROM ?? "AuditFlow <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev fallback — never log in production without a provider configured
    console.info(
      `[email:dev-fallback] to=${to} subject="${subject}"\n${text ?? html.replace(/<[^>]+>/g, " ")}`,
    );
    return { ok: true as const, id: "dev-fallback" };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("[email] send failed:", error.message);
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, id: data?.id ?? "unknown" };
}

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

function layout(content: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;">
          <tr><td style="padding:32px;">
            <div style="font-size:18px;font-weight:700;margin-bottom:24px;">
              <span style="display:inline-block;background:#4f46e5;color:#fff;border-radius:8px;width:28px;height:28px;line-height:28px;text-align:center;margin-right:8px;">A</span>AuditFlow
            </div>
            ${content}
            <p style="font-size:12px;color:#94a3b8;margin-top:32px;">
              If you didn't request this email, you can safely ignore it.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendVerificationEmail(to: string, rawToken: string) {
  const url = appUrl(`/verify-email?token=${encodeURIComponent(rawToken)}`);
  return sendEmail({
    to,
    subject: "Verify your email address",
    html: layout(`
      <h1 style="font-size:20px;margin:0 0 12px;">Verify your email</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;">
        Welcome to AuditFlow. Confirm your email address to activate your account.
      </p>
      <p style="margin:24px 0;">
        <a href="${url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
          Verify email address
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;">This link expires in 24 hours.</p>`),
    text: `Verify your AuditFlow email: ${url} (expires in 24 hours)`,
  });
}

export async function sendPasswordResetEmail(to: string, rawToken: string) {
  const url = appUrl(`/reset-password?token=${encodeURIComponent(rawToken)}`);
  return sendEmail({
    to,
    subject: "Reset your password",
    html: layout(`
      <h1 style="font-size:20px;margin:0 0 12px;">Reset your password</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;">
        We received a request to reset the password for your AuditFlow account.
      </p>
      <p style="margin:24px 0;">
        <a href="${url}" style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">
          Choose a new password
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;">This link expires in 1 hour and can be used once.</p>`),
    text: `Reset your AuditFlow password: ${url} (expires in 1 hour)`,
  });
}
