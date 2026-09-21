import { SITE_URL } from "@/lib/env";

export function isEmailVerificationEnabled(): boolean {
  const url = process.env.NEKO_MAIL_URL?.trim();
  const apiKey = process.env.NEKO_MAIL_API_KEY?.trim();
  return Boolean(url && apiKey);
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

function normalizeMailEndpoint(raw: string): string {
  let url = raw.trim();
  if (/^https?\/\//i.test(url)) {
    url = url
      .replace(/^http\/\//i, "http://")
      .replace(/^https\/\//i, "https://");
  } else if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  url = url.replace(/\/+$/, "");
  return url.endsWith("/send") ? url : `${url}/send`;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: SendMailOptions) {
  if (!isEmailVerificationEnabled()) {
    return { success: false, error: "neko-mail is not configured" };
  }

  const endpoint = normalizeMailEndpoint(process.env.NEKO_MAIL_URL!);
  const apiKey = process.env.NEKO_MAIL_API_KEY!.trim();
  const from = process.env.NEKO_MAIL_FROM?.trim();

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-API-Key": apiKey,
    },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      from,
      to: [to],
      cc: [],
      bcc: [],
      reply_to: replyTo || from,
      subject,
      text: text || "",
      html: html || "",
      attachments: [],
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(
      `neko-mail HTTP ${res.status}: ${errorBody || res.statusText}`,
    );
  }

  return res.json();
}

export async function sendVerificationEmail(
  email: string,
  name: string | null | undefined,
  token: string,
) {
  if (!isEmailVerificationEnabled()) return;

  const verifyUrl = `${SITE_URL}/verify-email?token=${token}`;
  const recipientName = name ? name.trim() : "Valued Customer";

  const text = `Hello ${recipientName},\n\nThank you for creating an account with JewelsCart. Please verify your email by opening the following link in your browser:\n\n${verifyUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create this account, please ignore this email.`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your email - JewelsCart</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf9; margin: 0; padding: 40px 16px; color: #1c1917;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 26px; font-weight: 700; color: #1c1917; margin: 0;">
              Jewels<span style="color: #c9933e;">Cart</span>
            </h1>
          </div>
          
          <h2 style="font-size: 19px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #292524;">
            Verify your email address
          </h2>

          <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin-bottom: 24px;">
            Hello <strong>${recipientName}</strong>,<br>
            Thank you for registering with JewelsCart. Please click the button below to verify your email address and activate your account:
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Verify Email Address
            </a>
          </div>

          <p style="font-size: 12px; line-height: 1.5; color: #78716c; margin-bottom: 16px;">
            If the button above does not work, copy and paste the following link into your browser:<br>
            <a href="${verifyUrl}" style="color: #c9933e; word-break: break-all;">${verifyUrl}</a>
          </p>

          <p style="font-size: 12px; color: #a8a29e; margin-top: 28px; border-top: 1px solid #f5f5f4; padding-top: 16px;">
            This link is valid for 24 hours. If you did not create an account on JewelsCart, you can safely disregard this message.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Verify your JewelsCart account",
    text,
    html,
  });
}
