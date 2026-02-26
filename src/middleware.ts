import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export default async function middleware(req: NextRequest) {
    const adminPathnameRegex = RegExp(
        `^(/(${routing.locales.join('|')}))?/admin(/.*)?$`,
        'i'
    );
    const dashboardPathnameRegex = RegExp(
        `^(/(${routing.locales.join('|')}))?/dashboard(/.*)?$`,
        'i'
    );

    const isAdminPage = adminPathnameRegex.test(req.nextUrl.pathname);
    const isDashboardPage = dashboardPathnameRegex.test(req.nextUrl.pathname);

    if (isAdminPage || isDashboardPage) {
        // Only fetch token if it's a protected route
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

        if (!token) {
            const signInUrl = new URL(`/auth/signin?callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`, req.url);
            return NextResponse.redirect(signInUrl);
        }

        if (isAdminPage && token.role !== 'admin') {
            // Unsuspecting users who login from the default callbackUrl (/admin) will be silently redirected to their dash
            const dashboardUrl = new URL('/dashboard', req.url);
            return NextResponse.redirect(dashboardUrl);
        }

        // At this point, it's either an admin accessing /admin, 
        // or a user/admin accessing /dashboard. Both are allowed.
        return intlMiddleware(req);
    }

    return intlMiddleware(req);
}

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(en|uk|es|de|fr|ru|nl|pl|it)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};

