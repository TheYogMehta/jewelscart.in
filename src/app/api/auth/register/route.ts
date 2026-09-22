import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createUser,
  findUserByEmail,
  createVerificationToken,
} from "@/lib/auth/users";
import { isEmailVerificationEnabled, sendVerificationEmail } from "@/lib/mail";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100)
    .nullable()
    .optional(),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  turnstileToken: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (ip && !rateLimit(`register:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      {
        error:
          "Too many accounts created from this IP. Please try again later.",
      },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password, turnstileToken } = parsed.data;

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

    const verificationEnabled = isEmailVerificationEnabled();
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists. Please sign in.",
        },
        { status: 400 },
      );
    }

    const newUser = await createUser({
      name: name || undefined,
      email,
      password,
      provider: "credentials",
      emailVerified: !verificationEnabled,
    });

    if (verificationEnabled) {
      try {
        const token = await createVerificationToken(newUser.id);
        await sendVerificationEmail(newUser.email, newUser.name, token);
      } catch (mailError) {
        console.error(
          "[Register] Failed to dispatch verification email:",
          mailError,
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        requiresVerification: verificationEnabled,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Register Error]:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 },
    );
  }
}
