'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { AdSlot } from '@/components/AdSlot';
import { RefreshCw, Home, ServerCrash, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Runtime Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-red-500/5 blur-[120px] dark:bg-red-500/10" />
            </div>

            <div className="relative z-10 max-w-2xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Icon Container */}
                <div className="relative mx-auto w-32 h-32 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl flex items-center justify-center">
                    <ServerCrash className="h-16 w-16 text-red-500 animate-bounce" />
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">
                        500
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Server <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">Hiccup</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                        Something went wrong while processing your request. Our technicians are already looking into it.
                    </p>
                    {error.digest && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-200 dark:bg-white/5 rounded-full text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            <AlertTriangle className="h-3 w-3" />
                            Error ID: {error.digest}
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button
                        onClick={() => reset()}
                        className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                    <Button asChild variant="outline" className="h-12 px-8 rounded-xl border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-bold gap-2 active:scale-95 transition-all">
                        <Link href="/">
                            <Home className="h-4 w-4" />
                            Back to Control Center
                        </Link>
                    </Button>
                </div>

                {/* Ad Slot for Error Page */}
                <div className="mt-12 pt-12 border-t border-slate-200 dark:border-white/5">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4">Diagnostics Sponsor</p>
                    <Suspense fallback={<div className="h-[250px] bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />}>
                        <AdSlot slotType="error_page_content" className="w-full" />
                    </Suspense>
                </div>
            </div>

            <div className="mt-20 py-8 text-center border-t border-slate-200 dark:border-white/5 w-full">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    {process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode'} • Uptime Guarantee System
                </p>
            </div>
        </div>
    );
}
