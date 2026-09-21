if (!process.env.NEXT_PUBLIC_SITE_URL) {
  if (typeof window === "undefined") {
    console.error(
      "Fatal Error: NEXT_PUBLIC_SITE_URL environment variable is required.",
    );
    process.exit(0);
  }
  throw new Error("NEXT_PUBLIC_SITE_URL environment variable is required.");
}

export const SITE_URL: string = process.env.NEXT_PUBLIC_SITE_URL.replace(
  /\/+$/,
  "",
);
