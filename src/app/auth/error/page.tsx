'use client';

import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Header } from '@/components/Header';
import Link from 'next/link';

export default function AuthErrorPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <Header />

            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden rounded-2xl">
                    <div className="bg-rose-500 p-8 text-center text-white">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold tracking-tight">Authentication Error</h2>
                        <p className="text-white/70 text-sm mt-1">A technical problem occurred</p>
                    </div>

                    <div className="p-8 space-y-6 text-center">
                        <div className="text-slate-600 dark:text-slate-400 text-sm">
                            {error === 'Configuration' && (
                                <p>It seems the server is not configured correctly (missing `NEXTAUTH_SECRET` or other keys).</p>
                            )}
                            {error === 'AccessDenied' && (
                                <p>You do not have permission to access this panel.</p>
                            )}
                            {!error && <p>An unknown error occurred during sign in.</p>}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link href="/auth/signin">
                                <Button className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-xl py-6 font-bold">
                                    <RefreshCcw className="h-4 w-4 mr-2" />
                                    Try Again
                                </Button>
                            </Link>
                            <Link href="/">
                                <Button variant="ghost" className="w-full rounded-xl py-6 font-semibold">
                                    <Home className="h-4 w-4 mr-2" />
                                    Go to Homepage
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
