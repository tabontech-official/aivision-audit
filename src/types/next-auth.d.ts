import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      plan: string;
      sessionId: string;
      /** true when the user has verified their email (avoids clashing with AdapterUser.emailVerified: Date|null) */
      isEmailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    plan: string;
    sessionId: string;
    isEmailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    plan?: string;
    sessionId?: string;
    isEmailVerified?: boolean;
  }
}
