import Link from "next/link";
import { verifyUserToken } from "@/lib/auth/users";
import { buildMetadata } from "@/lib/seo";
import { VerifySuccessView } from "./VerifySuccessView";

export const metadata = buildMetadata({
  title: "Verify Email",
  description: "Verify your JewelsCart account email address",
  path: "/verify-email",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let success = false;
  let userEmail: string | undefined;

  if (token) {
    const verifiedUser = await verifyUserToken(token);
    if (verifiedUser) {
      success = true;
      userEmail = verifiedUser.email;
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      {success ? (
        <VerifySuccessView email={userEmail} />
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-stone-900">
            Verification Link Expired
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            This verification link is invalid or has already expired. If you
            already verified your account, you can sign in directly.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-stone-800 transition"
            >
              Go to Sign In
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-full border border-stone-300 px-5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
            >
              Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
