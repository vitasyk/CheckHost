'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Globe, Shield } from 'lucide-react';
import { VisitorIpInfo } from '@/components/VisitorIpInfo';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function Header() {
    const { data: session } = useSession();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-xl dark:bg-gray-950/80 dark:border-white/5 supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between relative">
                    {/* Left side: Logo */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity z-10">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                            <Globe className="h-6 w-6 text-white" />
                        </div>
                        <div className="hidden sm:block text-left">
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-none">
                                CheckHost
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 opacity-70">Expert Tools</p>
                        </div>
                    </Link>

                    {/* Center: Navigation & Visitor Info */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-8">
                        <Link href="/blog" className="text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                            Blog
                        </Link>
                        <VisitorIpInfo />
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-4">
                        {session && (
                            <Link href="/admin">
                                <Button variant="ghost" size="sm" className="gap-2 text-xs font-bold uppercase tracking-wider h-10">
                                    <Shield className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>Admin</span>
                                </Button>
                            </Link>
                        )}
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}
