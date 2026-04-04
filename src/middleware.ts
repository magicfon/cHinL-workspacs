import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - /login
     * - /api/auth (NextAuth routes)
     * - /_next (static files)
     * - /favicon.ico
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)",
  ],
};
