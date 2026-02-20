import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSiteSetting } from "./site-settings";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Email", type: "text", placeholder: "admin@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                // 1. Check environment variables (primary/fallback)
                const envEmail = process.env.ADMIN_EMAIL || "admin@checkhost.local";
                const envPassword = process.env.ADMIN_PASSWORD || "admin123";

                if (credentials?.username === envEmail && credentials?.password === envPassword) {
                    return { id: "env-admin", name: "System Admin", email: envEmail };
                }

                // 2. Check Database for custom admin
                try {
                    const dbAccess = await getSiteSetting('admin_access');
                    if (dbAccess && dbAccess.credentials) {
                        if (credentials?.username === dbAccess.credentials.email &&
                            credentials?.password === dbAccess.credentials.password) {
                            return { id: "db-admin", name: "Admin", email: dbAccess.credentials.email };
                        }
                    }
                } catch (e) {
                    console.error("[Auth] DB credentials check failed:", e);
                }

                return null;
            }
        })
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const envEmails = process.env.ADMIN_EMAILS?.split(",") || [];

                // Fetch emails from DB
                let allowedEmails: string[] = [...envEmails];
                let blockedEmails: string[] = [];

                try {
                    const dbAccess = await getSiteSetting('admin_access');
                    if (dbAccess && dbAccess.google_emails) {
                        // Handle both old string format and new object-based array format
                        if (typeof dbAccess.google_emails === 'string') {
                            const dbEmails = dbAccess.google_emails.split(",").map((e: string) => e.trim());
                            allowedEmails = [...allowedEmails, ...dbEmails];
                        } else if (Array.isArray(dbAccess.google_emails)) {
                            dbAccess.google_emails.forEach((user: any) => {
                                if (user.status === 'blocked') {
                                    blockedEmails.push(user.email.toLowerCase());
                                } else {
                                    allowedEmails.push(user.email.toLowerCase());
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.error("[Auth] DB allowed emails fetch failed:", e);
                }

                const allAllowed = [...new Set(allowedEmails.map(e => e.toLowerCase()))];
                const userEmail = user.email?.toLowerCase();

                if (userEmail && blockedEmails.includes(userEmail)) {
                    console.warn(`[Auth] Blocked user attempted login: ${userEmail}`);
                    return false;
                }

                if (userEmail && allAllowed.includes(userEmail)) return true;
                if (process.env.NODE_ENV === "development" && allAllowed.length === 0) return true;
                return false;
            }
            return true;
        },
        async session({ session }) {
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only-do-not-use-in-pro",
};
