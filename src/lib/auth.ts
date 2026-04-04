import { type NextAuthOptions } from "next-auth";
import LineProvider from "next-auth/providers/line";

// comma-separated LINE UIDs that are allowed to access the workspace
const ALLOWED_UIDS = (process.env.ALLOWED_LINE_UIDS || "")
  .split(",")
  .map((uid) => uid.trim())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "chinl-workspace-default-secret-change-me",
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.LINE_CLIENT_ID && process.env.LINE_CLIENT_SECRET
      ? [
          LineProvider({
            clientId: process.env.LINE_CLIENT_ID,
            clientSecret: process.env.LINE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ account }) {
      if (account?.provider !== "line") return false;

      const lineUid = account.providerAccountId;
      if (!lineUid) return false;

      // If no whitelist is set, allow all LINE users (dev mode)
      if (ALLOWED_UIDS.length === 0) {
        console.warn(
          "[auth] ALLOWED_LINE_UIDS is empty — allowing all LINE users (dev mode)"
        );
        return true;
      }

      return ALLOWED_UIDS.includes(lineUid);
    },

    async jwt({ token, user, account }) {
      if (account?.provider === "line") {
        token.lineUid = account.providerAccountId;
        token.provider = "line";
      }
      if (user) {
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).lineUid = token.lineUid;
        (session.user as Record<string, unknown>).provider = token.provider;
      }
      return session;
    },
  },
};
