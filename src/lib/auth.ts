import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

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
                // Hardcoded admin for initial setup or check vs ENV
                const adminEmail = process.env.ADMIN_EMAIL || "admin@checkhost.local";
                const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

                if (credentials?.username === adminEmail && credentials?.password === adminPassword) {
                    return {
                        id: "1",
                        name: "Administrator",
                        email: adminEmail,
                    };
                }
                return null;
            }
        })
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const allowedEmails = process.env.ADMIN_EMAILS?.split(",") || [];
                if (user.email && allowedEmails.includes(user.email)) return true;
                if (process.env.NODE_ENV === "development" && allowedEmails.length === 0) return true;
                return false;
            }
            return true; // Credentials provider handled by authorize
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
