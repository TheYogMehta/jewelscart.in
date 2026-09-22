import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { findUserByEmail, getActiveUserCached } from "@/lib/auth/users";
import { getAddressesByUserId } from "@/lib/addresses";
import { getOrdersByUserId } from "@/lib/orders";
import { buildMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";
import { AccountDashboard } from "./AccountDashboard";

export const metadata = buildMetadata({
  title: "My Account",
  description:
    "Manage your JewelsCart account, delivery addresses, security methods, and preferences.",
  path: "/account",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/account");
  }

  const userEmail = session.user.email ?? "";
  const userId = session.user.id ? parseInt(session.user.id, 10) : NaN;
  const dbUser = !isNaN(userId)
    ? await getActiveUserCached(userId, userEmail || undefined)
    : userEmail
      ? await findUserByEmail(userEmail)
      : null;

  if (!dbUser) {
    redirect("/login?callbackUrl=/account");
  }

  const name = dbUser.name ?? session.user.name ?? "Customer";
  const email = userEmail;
  const hasPassword = Boolean(dbUser.password_hash);
  const isEmailVerified = Boolean(
    session.user.isEmailVerified || dbUser.email_verified,
  );
  const isGoogleLinked = Boolean(
    (dbUser as { google_linked?: boolean })?.google_linked ||
    dbUser.provider === "google",
  );
  const provider = session.user.provider || dbUser.provider || "credentials";
  const role = dbUser.role || "user";

  const memberSince = dbUser.created_at
    ? new Date(dbUser.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recent";

  const [initialAddresses, initialOrders] = await Promise.all([
    getAddressesByUserId(dbUser.id),
    getOrdersByUserId(dbUser.id, email),
  ]);

  return (
    <div className="min-h-[80vh] bg-stone-50/50">
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 py-12">
            <div className="h-32 rounded-3xl bg-stone-200/60 animate-pulse" />
            <div className="mt-8 h-64 rounded-2xl bg-stone-200/40 animate-pulse" />
          </div>
        }
      >
        <AccountDashboard
          user={{
            id: dbUser.id,
            name,
            email,
            memberSince,
            isEmailVerified,
            isGoogleLinked,
            hasPassword,
            provider,
            role,
          }}
          initialAddresses={initialAddresses}
          initialOrders={initialOrders}
        />
      </Suspense>
    </div>
  );
}
