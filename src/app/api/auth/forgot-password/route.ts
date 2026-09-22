import { NextResponse } from "next/server";
import { z } from "zod";
import { createPasswordResetToken } from "@/lib/auth/users";
import { sendPasswordResetEmail } from "@/lib/mail";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  turnstileToken: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (ip && !rateLimit(`forgot-password:ip:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      {
        error:
          "Too many password reset requests from this IP. Please try again later.",
      },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, turnstileToken } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const verification = await verifyTurnstileToken(turnstileToken, ip);
    if (!verification.success) {
      return NextResponse.json(
        {
          error:
            verification.error ||
            "Security check failed. Please refresh and try again.",
        },
        { status: 400 },
      );
    }

    if (
      !rateLimit(`forgot-password:email:${normalizedEmail}`, 3, 15 * 60 * 1000)
    ) {
      return NextResponse.json(
        {
          error:
            "Too many reset requests for this email address. Please check your inbox or try again in a few minutes.",
        },
        { status: 429 },
      );
    }

    const result = await createPasswordResetToken(normalizedEmail);
    if (result) {
      try {
        await sendPasswordResetEmail(
          result.user.email,
          result.user.name,
          result.token,
        );
      } catch (mailError) {
        console.error(
          "[Forgot Password] Failed to dispatch reset email:",
          mailError,
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "If an account exists with that email address, a password reset link has been sent.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Forgot Password Error]:", error);
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 },
    );
  }
}
