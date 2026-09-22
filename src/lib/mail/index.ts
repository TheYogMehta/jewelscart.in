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

export async function sendPasswordResetEmail(
  email: string,
  name: string | null | undefined,
  token: string,
) {
  if (!isEmailVerificationEnabled()) return;

  const resetUrl = `${SITE_URL}/reset-password?token=${token}`;
  const recipientName = name ? name.trim() : "Valued Customer";

  const text = `Hello ${recipientName},\n\nWe received a request to reset the password for your JewelsCart account. Please open the following link in your browser to choose a new password:\n\n${resetUrl}\n\nThis password reset link will expire in 1 hour.\n\nIf you did not request a password reset, you can safely ignore this email. Your account remains secure.`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset your password - JewelsCart</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf9; margin: 0; padding: 40px 16px; color: #1c1917;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 26px; font-weight: 700; color: #1c1917; margin: 0;">
              Jewels<span style="color: #c9933e;">Cart</span>
            </h1>
          </div>
          
          <h2 style="font-size: 19px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #292524;">
            Reset your password
          </h2>

          <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin-bottom: 24px;">
            Hello <strong>${recipientName}</strong>,<br>
            We received a request to reset your password for your JewelsCart account. Click the button below to set a new password:
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Reset Password
            </a>
          </div>

          <p style="font-size: 12px; line-height: 1.5; color: #78716c; margin-bottom: 16px;">
            If the button above does not work, copy and paste the following link into your browser:<br>
            <a href="${resetUrl}" style="color: #c9933e; word-break: break-all;">${resetUrl}</a>
          </p>

          <p style="font-size: 12px; color: #a8a29e; margin-top: 28px; border-top: 1px solid #f5f5f4; padding-top: 16px;">
            This link is valid for 1 hour. If you did not request a password reset, please ignore this email or reach out to us if you have concerns.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Reset your JewelsCart password",
    text,
    html,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  order: {
    orderNumber: string;
    userName: string;
    items: {
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      image?: string;
      sku?: string;
    }[];
    subtotal: number;
    shippingFee: number;
    totalAmount: number;
    shippingAddress: {
      fullName?: string;
      phone?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      pincode: string;
    };
    paymentId: string;
    createdAt: string;
    paymentMethod?: string;
  },
) {
  if (!isEmailVerificationEnabled()) return;

  const addr = order.shippingAddress || ({} as typeof order.shippingAddress);
  const recipientName = addr.fullName || order.userName || "Customer";
  const cityState = [addr.city, addr.state]
    .map((s: unknown) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .join(", ");
  const destination = [
    cityState,
    addr.pincode ? `(${String(addr.pincode).trim()})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = orderDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = orderDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemsHtml = order.items
    .map((item) => {
      const imageUrl = item.image
        ? item.image.startsWith("http")
          ? item.image
          : `${SITE_URL}${item.image.startsWith("/") ? "" : "/"}${item.image}`
        : null;

      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; vertical-align: middle;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width: 52px; vertical-align: middle; padding-right: 12px;">
                  ${
                    imageUrl
                      ? `<img src="${imageUrl}" alt="${item.name}" width="50" height="50" style="display: block; width: 50px; height: 50px; border-radius: 8px; object-fit: cover; border: 1px solid #e7e5e4;" />`
                      : `<div style="width: 50px; height: 50px; border-radius: 8px; background-color: #f5f5f4; border: 1px solid #e7e5e4; line-height: 50px; text-align: center; color: #a8a29e; font-size: 10px;">Item</div>`
                  }
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-weight: 500; font-size: 13px; color: #1c1917; line-height: 1.35;">
                    ${item.name}
                  </div>
                  <div style="font-size: 11px; color: #78716c; margin-top: 4px;">
                    ${item.sku ? `<span style="font-family: monospace; background-color: #f5f5f4; padding: 2px 5px; border-radius: 4px; color: #57534e;">${item.sku}</span>&nbsp;&nbsp;` : ""}
                    <span>Qty: ${item.quantity}</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; vertical-align: middle; font-size: 13px; font-weight: 600; color: #1c1917; white-space: nowrap;">
            ₹${item.totalPrice.toLocaleString("en-IN")}
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - JewelsCart</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf9; margin: 0; padding: 40px 16px; color: #1c1917; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 600px; margin: 0 auto;">
          <!-- Top Greeting Section -->
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 26px; font-weight: 700; color: #1c1917; margin: 0 0 16px; letter-spacing: -0.5px;">
              Jewels<span style="color: #c9933e;">Cart</span>
            </h1>
            <h2 style="font-size: 22px; font-weight: 600; margin: 0 0 10px; color: #1c1917;">
              Thank you for your order!
            </h2>
            <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin: 0 auto; max-width: 480px;">
              Hello <strong>${recipientName}</strong>,<br>
              We've received your order and are getting it ready to ship. We will notify you once it's on its way.
            </p>
          </div>

          <!-- Middle Receipt Box (Matching Receipt Card) -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04); margin-bottom: 24px;">
            <!-- Header: Date/Time on top-right, Emerald checkmark, Order Confirmed -->
            <tr>
              <td style="padding: 24px 28px 20px; text-align: center; border-bottom: 1px solid #f5f5f4;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="right" style="font-size: 12px; line-height: 1.35; padding-bottom: 8px;">
                      <span style="font-weight: 500; color: #44403c; display: block;">${formattedDate}</span>
                      <span style="font-size: 11px; color: #a8a29e; display: block;">${formattedTime}</span>
                    </td>
                  </tr>
                </table>

                <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; text-align: center; border-radius: 50%; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; font-size: 20px; font-weight: bold; margin-bottom: 12px;">
                  &#10003;
                </div>

                <h3 style="font-family: Georgia, serif; font-size: 24px; font-weight: 500; color: #1c1917; margin: 0 0 6px;">
                  Order Confirmed
                </h3>
                <p style="font-size: 13px; color: #78716c; margin: 0 auto; max-width: 440px; line-height: 1.5;">
                  Thank you, <strong style="font-weight: 600; color: #292524;">${recipientName}</strong>. A receipt has been sent to <span style="font-weight: 500; color: #292524;">${email}</span>.
                </p>
              </td>
            </tr>

            <!-- Purchased Pieces -->
            <tr>
              <td style="padding: 24px 28px 20px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #a8a29e; margin-bottom: 14px;">
                  Purchased Pieces (${order.items.length})
                </div>

                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${itemsHtml}
                </table>

                <!-- Financial Summary (Full Width) -->
                <div style="margin-top: 20px; border-top: 1px solid #f5f5f4; padding-top: 16px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; line-height: 1.8;">
                    <tr>
                      <td style="color: #78716c;">Items Subtotal</td>
                      <td align="right" style="font-weight: 500; color: #1c1917;">₹${order.subtotal.toLocaleString("en-IN")}</td>
                    </tr>
                    <tr>
                      <td style="color: #78716c;">Delivery Charges</td>
                      <td align="right" style="font-weight: 500; color: #1c1917;">
                        ${order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee.toLocaleString("en-IN")}`}
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px; border-top: 1px solid #e7e5e4; padding-top: 12px;">
                    <tr>
                      <td style="font-size: 14px; font-weight: 700; color: #1c1917;">Total Paid</td>
                      <td align="right" style="font-size: 18px; font-weight: 700; color: #1c1917;">₹${order.totalAmount.toLocaleString("en-IN")}</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>

            <!-- 2-Column Details: Shipping Address & Order / Payment Info -->
            <tr>
              <td style="background-color: #fafaf9; border-top: 1px solid #f5f5f4; padding: 20px 28px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <!-- Shipping Address -->
                    <td width="50%" valign="top" style="padding-right: 16px; font-size: 12px; line-height: 1.5;">
                      <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #a8a29e; margin-bottom: 6px;">
                        Shipping Address
                      </div>
                      <div style="font-weight: 600; color: #1c1917; margin-bottom: 2px;">
                        ${recipientName}
                      </div>
                      ${order.shippingAddress.phone ? `<div style="color: #78716c; font-size: 11px; margin-bottom: 3px;">Phone: ${order.shippingAddress.phone}</div>` : ""}
                      <div style="color: #57534e;">
                        ${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}<br>
                        ${destination}
                      </div>
                    </td>

                    <!-- Order Details & Payment -->
                    <td width="50%" valign="top" style="padding-left: 16px; border-left: 1px solid #e7e5e4; font-size: 12px; line-height: 1.5;">
                      <div style="margin-bottom: 12px;">
                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #a8a29e; margin-bottom: 4px;">
                          Order Number
                        </div>
                        <div style="font-family: monospace; font-size: 13px; font-weight: 700; color: #1c1917;">
                          ${order.orderNumber}
                        </div>
                      </div>

                      <div style="border-top: 1px solid #e7e5e4; padding-top: 10px;">
                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #a8a29e; margin-bottom: 4px;">
                          Payment Method
                        </div>
                        <div style="font-weight: 600; color: #1c1917;">
                          ${(order.paymentMethod || "ONLINE PAYMENT").toUpperCase()}
                        </div>
                        ${order.paymentId ? `<div style="font-family: monospace; font-size: 11px; color: #78716c; margin-top: 2px; word-break: break-all;">ID: ${order.paymentId}</div>` : ""}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Footer Note -->
          <div style="text-align: center; padding: 12px 16px;">
            <p style="font-size: 12px; line-height: 1.6; color: #78716c; margin: 0;">
              If you have any questions, reply to this email or visit our <a href="${SITE_URL}/contact" style="color: #c9933e; text-decoration: underline;">support page</a>.<br>
              Thank you for shopping with JewelsCart!
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html,
  });
}

export async function sendTrackingUpdateEmail(
  email: string,
  order: {
    orderNumber: string;
    userName: string;
    trackingId: string;
    trackingUrl?: string;
    trackingCourier?: string;
  },
) {
  if (!isEmailVerificationEnabled()) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Shipped - JewelsCart</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf9; margin: 0; padding: 40px 16px; color: #1c1917;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 26px; font-weight: 700; color: #1c1917; margin: 0;">
              Jewels<span style="color: #c9933e;">Cart</span>
            </h1>
          </div>
          
          <h2 style="font-size: 19px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #292524; text-align: center;">
            Your order has been shipped!
          </h2>

          <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin-bottom: 24px;">
            Hello <strong>${order.userName}</strong>,<br>
            Great news! Your order <strong>${order.orderNumber}</strong> has been shipped and is on its way to you.
          </p>

          <div style="background-color: #f5f5f4; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
            <div style="font-size: 13px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Tracking ID</div>
            <div style="font-size: 18px; font-weight: 600; color: #292524; margin-bottom: ${order.trackingCourier ? "8px" : "0"};">${order.trackingId}</div>
            ${order.trackingCourier ? `<div style="font-size: 14px; color: #57534e;">Courier: ${order.trackingCourier}</div>` : ""}
          </div>

          ${
            order.trackingUrl
              ? `
          <div style="text-align: center; margin: 32px 0;">
            <a href="${order.trackingUrl}" style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Track Your Order
            </a>
          </div>
          `
              : ""
          }

          <p style="font-size: 12px; color: #a8a29e; margin-top: 28px; border-top: 1px solid #f5f5f4; padding-top: 16px; text-align: center;">
            If you have any questions, visit our <a href="${SITE_URL}/contact" style="color: #c9933e; text-decoration: none;">support page</a>.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Your JewelsCart order ${order.orderNumber} has shipped`,
    html,
  });
}
