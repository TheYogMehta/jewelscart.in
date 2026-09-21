import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { authConfig } from "./config";
import {
  findUserByEmail,
  findUserById,
  getActiveUserCached,
  createUser,
  verifyPassword,
  markUserVerified,
  markGoogleLinked,
  type UserRecord,
} from "./users";
import { isEmailVerificationEnabled } from "@/lib/mail";
import { logActivity } from "@/lib/logs";

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is required in production");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...(authConfig.providers || []),
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        const user = await findUserByEmail(email);
        if (!user || !user.password_hash) return null;

        const isValid = verifyPassword(password, user.password_hash);
        if (!isValid) return null;

        if (isEmailVerificationEnabled() && !user.email_verified) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.name ?? undefined,
          email: user.email,
          role: user.role,
          provider: "credentials",
          isEmailVerified: user.email_verified,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const cookieStore = await cookies();
          const expectedCookie = cookieStore.get("jc_expected_gmail")?.value;
          if (expectedCookie) {
            const expectedEmail = decodeURIComponent(expectedCookie)
              .toLowerCase()
              .trim();
            const googleEmail = (user.email || "").toLowerCase().trim();

            if (googleEmail !== expectedEmail) {
              return `/account?error=different_account&expected=${encodeURIComponent(expectedEmail)}`;
            }

            const existingUser = await findUserByEmail(expectedEmail);
            if (existingUser) {
              await markGoogleLinked(existingUser.id);
              logActivity({
                action: "google_account_linked",
                actorId: existingUser.id,
                actorEmail: existingUser.email,
                actorName: existingUser.name,
                targetType: "user",
                targetId: String(existingUser.id),
                targetName: existingUser.email,
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.error(
            "[Auth] Error verifying expected gmail link cookie:",
            err,
          );
        }
      }

      if (user?.email) {
        logActivity({
          action: "user_login",
          actorEmail: user.email,
          actorName: user.name,
          details: { provider: account?.provider || "credentials" },
        }).catch(() => {});
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.provider =
          account?.provider ??
          (user as { provider?: string }).provider ??
          "credentials";
        token.isEmailVerified =
          account?.provider === "google"
            ? true
            : ((user as { isEmailVerified?: boolean }).isEmailVerified ??
              false);
      }

      if (account?.provider === "google" && token.email) {
        try {
          const email = token.email.trim().toLowerCase();
          let dbUser = await findUserByEmail(email);
          if (!dbUser) {
            dbUser = await createUser({
              name: token.name ?? undefined,
              email,
              provider: "google",
              emailVerified: true,
            });
            await markGoogleLinked(dbUser.id);
          } else {
            if (!dbUser.email_verified) {
              await markUserVerified(dbUser.id);
              dbUser.email_verified = true;
            }
            await markGoogleLinked(dbUser.id);
          }
          token.role = dbUser.role;
          token.sub = String(dbUser.id);
          token.isEmailVerified = true;
        } catch (err) {
          console.error("[Auth] DB lookup error for Google user:", err);
        }
      }

      if (!user && (token.sub || token.email)) {
        try {
          const userId = token.sub ? parseInt(String(token.sub), 10) : NaN;
          let dbUser: UserRecord | null = null;
          if (!isNaN(userId)) {
            dbUser = await getActiveUserCached(
              userId,
              token.email ? String(token.email) : undefined,
            );
          } else if (token.email) {
            dbUser = await findUserByEmail(String(token.email));
          }

          if (!dbUser) {
            return null as unknown as typeof token;
          }

          token.role = dbUser.role;
          token.sub = String(dbUser.id);
          token.isEmailVerified = dbUser.email_verified;
          if (dbUser.name) {
            token.name = dbUser.name;
          }
        } catch (err) {
          console.error("[Auth] DB lookup error during jwt verification:", err);
        }
      }

      if (!token) {
        return null as unknown as typeof token;
      }

      return authConfig.callbacks!.jwt!({ token, user, account });
    },
  },
});
