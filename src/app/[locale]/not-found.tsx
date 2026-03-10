'use client';

import Link from 'next/link';
import { AdSlot } from '@/components/AdSlot';
import { Home, Search, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/10" />
                <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[120px] dark:bg-blue-500/10" />
            </div>

            <div className="relative z-10 max-w-2xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Icon Container */}
                <div className="relative mx-auto w-32 h-32 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl flex items-center justify-center transform hover:rotate-6 transition-transform">
                    <ShieldAlert className="h-16 w-16 text-indigo-500 animate-pulse" />
                    <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">
                        404
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Lost in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500">Hyberspace</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                        The page you&apos;re looking for has moved, expired, or never existed in this sector of the network.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button asChild className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                        <Link href="/">
                            <Home className="h-4 w-4" />
                            Return Home
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12 px-8 rounded-xl border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-bold gap-2 active:scale-95 transition-all">
                        <Link href="/">
                            <Search className="h-4 w-4" />
                            Start New Check
                        </Link>
                    </Button>
                </div>

                {/* Ad Slot for 404 Page */}
                <div className="mt-12 pt-12 border-t border-slate-200 dark:border-white/5">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4">Recommended for you</p>
                    <Suspense fallback={<div className="h-[250px] bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />}>
                        <AdSlot slotType="error_page_content" className="w-full" />
                    </Suspense>
                </div>
            </div>

            <div className="mt-20 py-8 text-center border-t border-slate-200 dark:border-white/5 w-full">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    {process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode'} • Network Diagnostic System
                </p>
            </div>
        </div>
    );
}
