import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    provider?: string;
    emailVerified?: Date | string | null;
  }

  interface Session {
    user: {
      id?: string;
      role?: string;
      provider?: string;
      isEmailVerified?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: string;
    provider?: string;
    isEmailVerified?: boolean;
  }
}
