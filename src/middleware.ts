import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import { diagnosticLimiter, generalLimiter } from "@/lib/rate-limit";

// Define the auth middleware part
const authMiddleware = withAuth({
    callbacks: {
        authorized: ({ token }) => !!token,
    },
});

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl.pathname;
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";

    // 1. Check Rate Limiting for Diagnostic APIs
    if (url.startsWith("/api/check/")) {
        const result = diagnosticLimiter.check(null, 10, ip);
        if (result.isRateLimited) {
            return new NextResponse(
                JSON.stringify({ error: "Too many requests. Please try again in a minute." }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "X-RateLimit-Limit": result.limit.toString(),
                        "X-RateLimit-Remaining": result.remaining.toString(),
                    }
                }
            );
        }
    }

    // 2. Check Rate Limiting for General APIs (Blog, etc.)
    if (url.startsWith("/api/") && !url.startsWith("/api/admin/") && !url.startsWith("/api/auth/")) {
        const result = generalLimiter.check(null, 60, ip);
        if (result.isRateLimited) {
            return new NextResponse(
                JSON.stringify({ error: "Rate limit exceeded." }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                    }
                }
            );
        }
    }

    // 3. Handle Admin Auth Protection
    // For /admin pages, we use next-auth's default redirect behavior.
    // For /api/admin routes, we return a JSON 401 instead of a redirect to avoid SyntaxError in browser console.
    if (url.startsWith("/admin")) {
        // @ts-ignore
        return authMiddleware(req, null);
    }

    if (url.startsWith("/api/admin") && !url.includes("/settings")) {
        // For API routes, we don't want a redirect (HTML), we want a 401 (JSON)
        // Check for JWT token manually
        const hasToken = !!(req.cookies.get("next-auth.session-token") || req.cookies.get("__Secure-next-auth.session-token"));

        if (!hasToken) {
            return new NextResponse(
                JSON.stringify({ error: "Unauthorized. Please login as admin." }),
                {
                    status: 401,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/:path*"],
};
