import { NextResponse } from "next/server";
import { z } from "zod";
import {
  resetPasswordWithToken,
  validatePasswordResetToken,
} from "@/lib/auth/users";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  turnstileToken: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (ip && !rateLimit(`reset-password-check:ip:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json(
      { valid: false, error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { valid: false, error: "Missing reset token" },
      { status: 400 },
    );
  }

  const user = await validatePasswordResetToken(token);
  if (!user) {
    return NextResponse.json(
      {
        valid: false,
        error:
          "This password reset link is invalid or has expired. Please request a new one.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ valid: true, email: user.email }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (ip && !rateLimit(`reset-password:ip:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      {
        error:
          "Too many password reset attempts from this IP. Please try again later.",
      },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { token, password, turnstileToken } = parsed.data;

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

    const updatedUser = await resetPasswordWithToken(token, password);
    if (!updatedUser) {
      return NextResponse.json(
        {
          error:
            "This password reset link is invalid or has expired. Please request a new one.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your password has been successfully reset.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Reset Password Error]:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 },
    );
  }
}
