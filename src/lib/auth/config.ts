import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

process.env.AUTH_URL ??= process.env.NEXT_PUBLIC_SITE_URL;

function getEmailSet(envVar: string | undefined): Set<string> {
  const raw = envVar ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isDeveloperEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getEmailSet(process.env.DEVELOPER_EMAILS).has(email.toLowerCase());
}

export function resolveRoleFromEmail(
  email: string | null | undefined,
): "developer" | "user" {
  if (isDeveloperEmail(email)) return "developer";
  return "user";
}

export function isStaffOrAbove(role: string | undefined): boolean {
  return role === "developer" || role === "admin" || role === "staff";
}

export function canManageUsers(role: string | undefined): boolean {
  return role === "developer" || role === "admin";
}

export function canViewLogs(role: string | undefined): boolean {
  return role === "developer" || role === "admin";
}

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return url;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        /* invalid URL */
      }
      return baseUrl;
    },
    async jwt({ token, user, account }) {
      if (!token) return null as unknown as typeof token;
      if (user) {
        token.role =
          (user as { role?: string }).role ?? resolveRoleFromEmail(user.email);
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
      if (account?.provider === "google") {
        token.provider = "google";
        token.isEmailVerified = true;
      }
      const email = user?.email ?? token.email;
      if (email && !token.role) {
        token.role = resolveRoleFromEmail(email);
      }
      return token;
    },
    async session({ session, token }) {
      if (!token || !token.sub) {
        return null as unknown as typeof session;
      }
      if (session?.user) {
        session.user.id = (token.sub as string) ?? "";
        session.user.role = (token.role as string) ?? "user";
        session.user.provider = (token.provider as string) ?? "credentials";
        session.user.isEmailVerified = Boolean(token.isEmailVerified);
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  trustHost: true,
};
