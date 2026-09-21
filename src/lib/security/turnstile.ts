export interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
  errorCodes?: string[];
}

export async function verifyTurnstileToken(
  token?: string | null,
  remoteIp?: string,
): Promise<TurnstileVerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secretKey) {
    return { success: true };
  }

  if (!token || typeof token !== "string" || !token.trim()) {
    return {
      success: false,
      error: "Security check required. Please try again.",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        signal: AbortSignal.timeout(6000),
      },
    );

    if (!res.ok) {
      return {
        success: false,
        error: `Turnstile verification service responded with status ${res.status}`,
      };
    }

    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (data.success) {
      return { success: true };
    }

    return {
      success: false,
      error: "Turnstile validation failed",
      errorCodes: data["error-codes"],
    };
  } catch (err) {
    console.error("[Turnstile] Verification error:", err);
    return {
      success: false,
      error: "Unable to verify security challenge. Please try again.",
    };
  }
}
