import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSiteSetting } from "./site-settings";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
            authorization: {
                params: {
                    prompt: "select_account"
                }
            }
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
                    return { id: "env-admin", name: "System Admin", email: envEmail, role: "admin" as const, plan: "enterprise" };
                }

                // 2. Check Database for custom admin
                try {
                    const dbAccess = await getSiteSetting('admin_access');
                    if (dbAccess && dbAccess.credentials && credentials?.password) {
                        if (credentials?.username === dbAccess.credentials.email) {
                            let isMatch = false;

                            // Check if password in DB is hashed
                            if (dbAccess.credentials.password.startsWith('$2') && dbAccess.credentials.password.length === 60) {
                                const bcrypt = await import('bcryptjs');
                                isMatch = await bcrypt.compare(credentials.password, dbAccess.credentials.password);
                            } else {
                                // Fallback for plaintext (before they update it in admin panel)
                                isMatch = credentials.password === dbAccess.credentials.password;
                            }

                            if (isMatch) {
                                return { id: "db-admin", name: "Admin", email: dbAccess.credentials.email, role: "admin" as const, plan: "enterprise" };
                            }
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
                const dbAllowedAdminEmails: string[] = [];
                const dbAllowedUserEmails: string[] = [];
                const blockedEmails: string[] = [];

                try {
                    const dbAccess = await getSiteSetting('admin_access');
                    if (dbAccess && dbAccess.google_emails) {
                        // Handle both old string format and new object-based array format
                        if (typeof dbAccess.google_emails === 'string') {
                            const dbEmails = dbAccess.google_emails.split(",").map((e: string) => e.trim());
                            dbAllowedAdminEmails.push(...dbEmails);
                        } else if (Array.isArray(dbAccess.google_emails)) {
                            dbAccess.google_emails.forEach((u: any) => {
                                if (u.status === 'blocked') {
                                    blockedEmails.push(u.email.toLowerCase());
                                } else if (u.role === 'admin') {
                                    dbAllowedAdminEmails.push(u.email.toLowerCase());
                                } else {
                                    // User role
                                    dbAllowedUserEmails.push(u.email.toLowerCase());
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.error("[Auth] DB allowed emails fetch failed:", e);
                }

                const allAllowedAdminEmails = [...new Set([...envEmails, ...dbAllowedAdminEmails].map(e => e.toLowerCase()))];
                const allAllowedUserEmails = [...new Set(dbAllowedUserEmails.map(e => e.toLowerCase()))];
                const userEmail = user.email?.toLowerCase();

                if (!userEmail) return false;

                if (blockedEmails.includes(userEmail)) {
                    console.warn(`[Auth] Blocked user attempted login: ${userEmail}`);
                    return false;
                }

                // Determine role
                let role: 'admin' | 'user' = 'user';

                if (allAllowedAdminEmails.includes(userEmail) || (process.env.NODE_ENV === "development" && allAllowedAdminEmails.length === 0)) {
                    role = 'admin';
                }
                // else: any valid google account (including those explicitly defined as 'user' in DB) becomes a 'user'

                // Sync user with Database
                try {
                    const pgQuery = (await import('./postgres')).query;

                    // Check if user exists
                    const existingUserRes = await pgQuery('SELECT id, role, plan FROM users WHERE email = $1', [userEmail]);

                    if (existingUserRes.rows.length > 0) {
                        // Update existing user (last_login, name, image)
                        // Note: If they became an admin via Settings, we forcefully upgrade their role here. 
                        // If they were removed from settings, we downgrade them to 'user'.
                        const existingUser = existingUserRes.rows[0];
                        const updatedRole = role === 'admin' ? 'admin' : (existingUser.role === 'admin' ? 'user' : existingUser.role);

                        await pgQuery(
                            'UPDATE users SET name = $1, image = $2, role = $3, last_login = CURRENT_TIMESTAMP WHERE email = $4',
                            [user?.name || null, user?.image || null, updatedRole, userEmail]
                        );

                        // Attach DB info to the NextAuth user object for the jwt callback
                        (user as any).dbId = existingUser.id;
                        (user as any).dbRole = updatedRole;
                        (user as any).dbPlan = existingUser.plan;

                    } else {
                        // Insert new user
                        const insertRes = await pgQuery(
                            'INSERT INTO users (email, name, image, role, plan, last_login) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id',
                            [userEmail, user?.name || null, user?.image || null, role, 'free']
                        );

                        // Attach DB info to the NextAuth user object
                        (user as any).dbId = insertRes.rows[0].id;
                        (user as any).dbRole = role;
                        (user as any).dbPlan = 'free';
                    }
                } catch (e) {
                    console.error("[Auth] Failed to sync user to database:", e);
                    // Decide whether to fail login if DB is down. 
                    // Considering SaaS nature, we should probably allow login but keep them as basic role if DB fails, 
                    // or reject. For now, we allow them in if they are admin, reject if user.
                    if (role !== 'admin') return false;
                }

                return true;
            }
            return true;
        },
        async jwt({ token, user }) {
            // Initial sign in - append db user info to the token
            if (user) {
                if ('dbId' in user) {
                    token.id = (user as any).dbId;
                    token.role = (user as any).dbRole;
                    token.plan = (user as any).dbPlan;
                } else if (user.id === 'env-admin' || user.id === 'db-admin') {
                    // Credentials login
                    token.id = user.id;
                    token.role = 'admin';
                    token.plan = 'enterprise';
                }
                token.lastDbCheck = Date.now();
            } else if (token.id && token.id !== 'env-admin' && token.id !== 'db-admin') {
                // Subsequent requests: Verify role with DB every 15 minutes
                const now = Date.now();
                const lastCheck = (token.lastDbCheck as number) || 0;

                if (now - lastCheck > 15 * 60 * 1000) { // 15 mins
                    try {
                        const pgQuery = (await import('./postgres')).query;
                        const existingUserRes = await pgQuery('SELECT role, plan FROM users WHERE id = $1', [token.id]);

                        if (existingUserRes.rows.length > 0) {
                            token.role = existingUserRes.rows[0].role;
                            token.plan = existingUserRes.rows[0].plan;
                        } else {
                            // User was deleted from DB but still has token
                            token.role = 'user';
                        }
                        token.lastDbCheck = now;
                    } catch (e) {
                        console.error("[Auth] Background role check failed:", e);
                    }
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as 'admin' | 'user';
                session.user.plan = token.plan as string;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 1 Day
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only-do-not-use-in-pro",
};
