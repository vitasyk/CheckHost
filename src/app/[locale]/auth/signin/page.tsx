'use client';

import { signIn, getSession } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MonitorPlay, Mail, Lock, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

function SignInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    const error = searchParams.get('error');
    const t = useTranslations('Auth.signin');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [showAdminLogin, setShowAdminLogin] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormError('');

        try {
            const res = await signIn('credentials', {
                username: email,
                password: password,
                redirect: false,
            });

            if (res?.error) {
                setFormError(t('invalid'));
            } else {
                // Fetch session to determine role
                const session = await getSession();
                const role = session?.user?.role;

                // If a specific callbackUrl was provided (other than the default /dashboard), respect it
                if (searchParams.get('callbackUrl') && searchParams.get('callbackUrl') !== '/dashboard') {
                    router.push(searchParams.get('callbackUrl') as string);
                } else if (role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/dashboard');
                }

                router.refresh();
            }
        } catch {
            setFormError(t('error'));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        // For OAuth, we can't easily intercept the redirect in the middle.
        // It redirects directly to the provider, then to the callbackUrl provided here.
        // However, we want dynamic behavior. To achieve this, we can redirect to a custom 
        // intermediate route or handle it globally in middleware, or set a generic callback
        // that handles the routing.
        // Easiest approach for now: redirect to a generic endpoint that figures it out.
        // We will create a '/auth/callback' page or just use the dashboard page to handle the redirect if they are admin.

        // As a simple fix, let's redirect them to the dashboard, and if the dashboard sees they are an admin,
        // it can forward them to the admin panel.
        signIn('google', { callbackUrl: '/dashboard' });
    };

    return (
        <div className="flex-1 w-full min-h-[70vh] flex flex-col items-center justify-center relative px-4 py-12 overflow-hidden">

            {/* Background Ambient Glows (Responsive to Light/Dark Mode) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] max-w-[800px] h-[400px] pointer-events-none opacity-50 overflow-hidden">
                <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/20 dark:bg-indigo-500/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-500/20 dark:bg-purple-500/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
            </div>

            <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-500 ease-out">
                {/* Header Text */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/50 dark:border-white/10 flex items-center justify-center mb-6">
                        <MonitorPlay className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
                        {t('title')} <Sparkles className="w-5 h-5 text-indigo-500" />
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Main Card */}
                <Card className="border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 shadow-2xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden rounded-[2rem] backdrop-blur-3xl ring-1 ring-slate-900/5 dark:ring-white/5">
                    <div className="p-8 space-y-6">
                        {(error || formError) && (
                            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium animate-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p>{formError || t('error')}</p>
                            </div>
                        )}

                        {/* Google Sign In Button */}
                        <Button
                            type="button"
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-[0_2px_10px_rgb(0,0,0,0.05)] rounded-2xl py-6 font-bold text-[15px] transition-all flex items-center justify-center gap-3 group dark:bg-white dark:hover:bg-slate-100 dark:border-transparent dark:text-slate-900"
                            onClick={handleGoogleSignIn}
                        >
                            <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {t('googleBtn')}
                        </Button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200 dark:border-white/10"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase font-extrabold tracking-widest text-slate-400">
                                <span className="bg-white dark:bg-slate-900 px-4 rounded-full border border-slate-200 dark:border-white/10 shadow-sm">{t('or')}</span>
                            </div>
                        </div>

                        {/* Admin Login Toggle */}
                        {!showAdminLogin ? (
                            <button
                                onClick={() => setShowAdminLogin(true)}
                                className="w-full text-sm font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors text-center py-2 relative overflow-hidden group rounded-xl"
                            >
                                <span className="relative z-10 transition-transform group-hover:scale-105 inline-block">{t('adminBtn')}</span>
                                <div className="absolute inset-0 bg-slate-100 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                            </button>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-1.5 focus-within:text-indigo-600 dark:focus-within:text-indigo-400">
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-slate-100/50 dark:bg-black/20 border border-slate-200/50 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:ring-indigo-500/30 transition-all text-[15px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
                                            placeholder={t('emailPlace')}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 focus-within:text-indigo-600 dark:focus-within:text-indigo-400">
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-slate-100/50 dark:bg-black/20 border border-slate-200/50 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:ring-indigo-500/30 transition-all text-[15px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 shadow-inner"
                                            placeholder={t('passPlace')}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-xl shadow-slate-900/20 dark:shadow-indigo-500/20 rounded-2xl py-6 font-bold text-[15px] transition-all"
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                                        {t('submitBtn')}
                                    </Button>
                                </div>
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdminLogin(false)}
                                        className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        {t('cancel')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </Card>

                <div className="text-center mt-6 space-x-4 text-xs font-medium text-slate-400 dark:text-slate-500">
                    <a href="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">{t('terms')}</a>
                    <span>&middot;</span>
                    <a href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">{t('privacy')}</a>
                </div>
            </div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-slate-500">Завантаження...</div>}>
            <SignInContent />
        </Suspense>
    );
}
