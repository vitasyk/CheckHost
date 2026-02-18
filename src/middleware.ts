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
    if (url.startsWith("/admin") || url.startsWith("/api/admin")) {
        // @ts-ignore - Next-auth types mismatch with async middleware sometimes
        return authMiddleware(req as any, null as any);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/:path*"],
};
