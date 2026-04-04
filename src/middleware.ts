export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - /login
     * - /api/auth (NextAuth routes)
     * - /_next (static files)
     * - /favicon.ico
     * - public assets
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)",
  ],
};
