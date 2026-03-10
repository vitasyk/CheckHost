'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
    Shield, ScanEye, Menu, X, Home as HomeIcon, Info as InfoIcon,
    Newspaper as BlogIcon, LayoutDashboard, Settings, LogOut,
    BarChart3, Database, ShieldCheck, History, Megaphone, LogIn,
    Newspaper
} from 'lucide-react';
import dynamic from 'next/dynamic';

const VisitorIpInfo = dynamic(() => import('@/components/VisitorIpInfo').then(mod => mod.VisitorIpInfo), {
    ssr: false,
    loading: () => <div className="h-10 w-32 bg-slate-100/50 dark:bg-slate-800/20 rounded-2xl animate-pulse" />
});
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useXRay } from '@/components/admin/XRayProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import React, { useState } from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from '@/lib/utils';

const publicNavItems = [
    { labelKey: 'home', icon: HomeIcon, href: '/' as const },
    { labelKey: 'docs', icon: Newspaper as any, href: '/docs' as const },
    { labelKey: 'about', icon: InfoIcon, href: '/about' as const },
    { labelKey: 'blog', icon: BlogIcon, href: '/blog' as const },
];

const adminNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Documentation', icon: Newspaper, href: '/admin/docs' },
    { label: 'Blog Posts', icon: BlogIcon, href: '/admin/blog' },
    { label: 'Ads Management', icon: Megaphone, href: '/admin/ads' },
    { label: 'Access Control', icon: ShieldCheck, href: '/admin/access' },
    { label: 'Audit Logs', icon: History, href: '/admin/audit' },
    { label: 'Analytics', icon: BarChart3, href: '#', disabled: true },
    { label: 'API Logs', icon: Database, href: '#', disabled: true },
    { label: 'Settings', icon: Settings, href: '/admin/settings' },
];

function MobileUnifiedNav() {
    const pathname = usePathname();
    const t = useTranslations('Navigation');
    const { data: session } = useSession();
    const isAuthenticated = !!session;
    const { isXRayActive, toggleXRay } = useXRay();
    const [open, setOpen] = useState(false);

    const isAdminRoute = pathname.startsWith('/admin');

    const navItemStyle = (active: boolean) =>
        `w-full justify-start items-center gap-3 px-3 h-12 rounded-[1.2rem] transition-all duration-300 ${active
            ? 'bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-white shadow-[inset_0_0_0_1px_rgba(79,70,229,0.1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]'
            : 'text-slate-500 dark:text-white/40 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
        }`;

    const iconStyle = (active: boolean) =>
        `h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border transition-all duration-500 ${active
            ? 'border-indigo-200 bg-white dark:border-white/20 dark:bg-white/5 shadow-sm'
            : 'border-slate-100 bg-transparent dark:border-white/5'
        }`;

    return (
        <div className="lg:hidden">
            <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
                <DialogPrimitive.Trigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all active:scale-95" aria-label={t('openMenu')} suppressHydrationWarning>
                        <Menu className="h-6 w-6" />
                    </Button>
                </DialogPrimitive.Trigger>

                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <DialogPrimitive.Content
                        className={cn(
                            "fixed left-[50%] top-4 z-50 w-[94%] max-w-md translate-x-[-50%] border border-slate-200/50 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 p-0 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] dark:shadow-2xl overflow-hidden backdrop-blur-2xl rounded-[2.5rem] duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%] outline-none transition-all flex flex-col max-h-[90vh]"
                        )}
                    >
                        <DialogPrimitive.Title className="sr-only">Navigation Menu</DialogPrimitive.Title>
                        <DialogPrimitive.Description className="sr-only">Main navigation links.</DialogPrimitive.Description>

                        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent top-0" />

                        {/* Header */}
                        <div className="px-6 pt-8 pb-3">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/30 mb-2">
                                        {isAdminRoute ? 'System' : 'Menu'}
                                    </div>
                                    <div className="h-1 w-6 bg-indigo-500 rounded-full opacity-50" />
                                </div>
                                {isAdminRoute && session?.user?.role === 'admin' && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant={isXRayActive ? "default" : "outline"}
                                            size="icon"
                                            onClick={toggleXRay}
                                            className={`h-9 w-9 rounded-lg transition-all duration-300 ${isXRayActive
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border-none'
                                                : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10 dark:text-white/50'}`}
                                            aria-label="Toggle X-Ray Mode"
                                        >
                                            <ScanEye className={`h-4 w-4 ${isXRayActive ? 'animate-pulse' : ''}`} />
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-center mb-4">
                                <VisitorIpInfo />
                            </div>
                        </div>

                        {/* Nav Items */}
                        <div className="px-3 pb-8 space-y-3 overflow-y-auto max-h-[55vh] no-scrollbar">
                            <div className="grid gap-1 px-1">
                                {isAdminRoute ? (
                                    <>
                                        {/* Back to site */}
                                        <DialogPrimitive.Close asChild>
                                            <Link href="/" className="w-full">
                                                <Button variant="ghost" className={navItemStyle(false)}>
                                                    <div className={iconStyle(false)}>
                                                        <HomeIcon className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-sm font-bold tracking-tight">Back to Site</span>
                                                </Button>
                                            </Link>
                                        </DialogPrimitive.Close>
                                        <div className="mx-3 my-1 h-px bg-slate-100 dark:bg-white/5" />
                                        {/* Admin items */}
                                        {adminNavItems.map((item) => (
                                            <DialogPrimitive.Close key={item.label} asChild>
                                                <Link href={item.href} className="w-full">
                                                    <Button
                                                        variant="ghost"
                                                        disabled={item.disabled}
                                                        className={navItemStyle(pathname === item.href)}
                                                    >
                                                        <div className={iconStyle(pathname === item.href)}>
                                                            <item.icon className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-sm font-bold tracking-tight">{item.label}</span>
                                                        {item.label === 'Audit Logs' && (
                                                            <span className="ml-auto bg-indigo-100 dark:bg-white/10 text-indigo-600 dark:text-white/60 text-[9px] px-2 py-0.5 rounded-md font-black italic">3</span>
                                                        )}
                                                    </Button>
                                                </Link>
                                            </DialogPrimitive.Close>
                                        ))}
                                        <div className="mx-3 my-1 h-px bg-slate-100 dark:bg-white/5" />
                                        {/* Logout */}
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start items-center gap-3 px-3 h-12 rounded-[1.2rem] text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10"
                                            onClick={() => signOut({ callbackUrl: '/' })}
                                        >
                                            <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border border-rose-100 dark:border-rose-900/30 bg-transparent">
                                                <LogOut className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-bold tracking-tight">Logout</span>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {/* Public nav items */}
                                        {publicNavItems.map((item) => (
                                            <DialogPrimitive.Close key={item.href} asChild>
                                                <Link href={item.href} className="w-full">
                                                    <Button variant="ghost" className={navItemStyle(pathname === item.href)}>
                                                        <div className={iconStyle(pathname === item.href)}>
                                                            <item.icon className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-sm font-bold tracking-tight">{t(item.labelKey as any)}</span>
                                                    </Button>
                                                </Link>
                                            </DialogPrimitive.Close>
                                        ))}
                                        {/* Dashboard/Admin link if authenticated, Login if not */}
                                        <div className="mx-3 my-1 h-px bg-slate-100 dark:bg-white/5" />
                                        {isAuthenticated ? (
                                            <DialogPrimitive.Close asChild>
                                                <Link href={session?.user?.role === 'admin' ? "/admin" : "/dashboard"} className="w-full">
                                                    <Button variant="ghost" className={`${navItemStyle(false)} bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30`}>
                                                        <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-indigo-900/20">
                                                            {session?.user?.role === 'admin' ? (
                                                                <Shield className="h-4 w-4 text-indigo-500" />
                                                            ) : (
                                                                <LayoutDashboard className="h-4 w-4 text-indigo-500" />
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-bold tracking-tight">
                                                            {session?.user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                                                        </span>
                                                    </Button>
                                                </Link>
                                            </DialogPrimitive.Close>
                                        ) : (
                                            <DialogPrimitive.Close asChild>
                                                <Link href="/auth/signin" rel="nofollow" className="w-full">
                                                    <Button className="w-full justify-start items-center gap-3 px-3 h-12 rounded-[1.2rem] bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all duration-200">
                                                        <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-white/20">
                                                            <LogIn className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-sm font-bold tracking-tight">Sign In</span>
                                                    </Button>
                                                </Link>
                                            </DialogPrimitive.Close>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Close button */}
                        <div className="flex justify-center pt-2 pb-6 mt-auto">
                            <DialogPrimitive.Close asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 w-full max-w-[180px] gap-2 rounded-xl bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 dark:hover:border-white/20 transition-all font-bold shadow-sm active:scale-95"
                                >
                                    <X className="h-4 w-4" />
                                    {t('closeMenu')}
                                </Button>
                            </DialogPrimitive.Close>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </div>
    );
}

function NavIsland() {
    const pathname = usePathname();
    const t = useTranslations('Navigation');

    const items = [
        { labelKey: 'home', icon: HomeIcon, href: '/' },
        { labelKey: 'blog', icon: BlogIcon, href: '/blog' },
        { labelKey: 'about', icon: InfoIcon, href: '/about' },
    ] as const;

    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href);

    return (
        <nav
            className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/20 border border-slate-200/80 dark:border-white/[0.04] rounded-2xl p-1 backdrop-blur-sm shadow-sm dark:shadow-none"
            aria-label="Main navigation"
        >
            {items.map(({ labelKey, icon: Icon, href }) => {
                const active = isActive(href);
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${active
                            ? 'bg-white dark:bg-white/[0.06] text-indigo-600 dark:text-white shadow-sm shadow-slate-200/80 dark:shadow-none'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.03]'
                            }`}
                    >
                        <Icon className={`h-3.5 w-3.5 shrink-0 transition-colors ${active ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'
                            }`} />
                        {t(labelKey as any)}
                        {active && (
                            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500/60" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

export function Header() {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const { isXRayActive, toggleXRay } = useXRay();

    const pathname = usePathname();
    const isAdminPage = pathname.includes('/admin');
    const isDashboardPage = pathname.includes('/dashboard');

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl dark:bg-slate-950/80 dark:border-white/5">
            {/* Header Main Container */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
                <div className="flex h-20 items-center justify-between relative group/header">
                    {/* Logo Area */}
                    <div className="flex-1 flex items-center z-10">
                        <Link href="/" className="flex items-center hover:opacity-90 transition-all group/logo">
                            <div className="flex h-12 w-12 items-center justify-center shrink-0 group-hover/logo:scale-110 transition-all duration-500 ease-out">
                                <Image
                                    src="/logo.svg"
                                    alt="CheckHost"
                                    width={56}
                                    height={56}
                                    className="object-contain drop-shadow-[0_0_15px_rgba(79,70,229,0.35)]"
                                    priority
                                />
                            </div>
                        </Link>
                    </div>

                    {/* Center: Navigation & Visitor Info — md+ support */}
                    <div className="hidden md:flex items-center justify-center gap-4">
                        <div className="hidden lg:block"><NavIsland /></div>
                        <VisitorIpInfo />
                    </div>

                    {/* Right side actions */}
                    <div className="flex-1 flex items-center justify-end gap-3 sm:gap-6">
                        {/* X-Ray button — admin only */}
                        <div className="hidden sm:flex items-center gap-2 transition-all duration-300">
                            {isAuthenticated && session?.user?.role === 'admin' && (
                                <Button
                                    variant={isXRayActive ? "default" : "outline"}
                                    size="sm"
                                    className={`gap-2 h-10 transition-all ${isXRayActive ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-indigo-600 border-slate-200 dark:border-white/10 dark:text-slate-400'}`}
                                    onClick={toggleXRay}
                                    title="Live Layout Preview (X-Ray Mode)"
                                    aria-label="Toggle X-Ray Mode"
                                >
                                    <ScanEye className={`h-4 w-4 ${isXRayActive ? 'animate-pulse' : ''}`} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">X-Ray</span>
                                </Button>
                            )}
                        </div>

                        {/* Admin/Dashboard pill button + Login — desktop only (mobile uses burger menu) */}
                        <div className="hidden md:flex items-center gap-2 min-h-[44px] justify-end">
                            {isAuthenticated ? (
                                <Button
                                    asChild
                                    size="sm"
                                    className={`h-9 px-3 gap-2 text-xs font-bold rounded-xl transition-all duration-200 shadow-sm cursor-pointer ${session?.user?.role === 'admin'
                                        ? (isAdminPage
                                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/20'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 border-none')
                                        : (isDashboardPage
                                            ? 'bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200/40 dark:border-indigo-500/10'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 border-none')
                                        }`}
                                >
                                    <Link href={session?.user?.role === 'admin' ? "/admin" : "/dashboard"} className="flex items-center gap-1.5">
                                        {session?.user?.role === 'admin' ? (
                                            <Shield className="h-3.5 w-3.5" />
                                        ) : (
                                            <LayoutDashboard className="h-3.5 w-3.5" />
                                        )}
                                        <span className="hidden sm:inline">
                                            {session?.user?.role === 'admin' ? 'Admin' : 'Dashboard'}
                                        </span>
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    asChild
                                    size="sm"
                                    className="h-9 px-4 gap-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 border-none transition-all duration-200 cursor-pointer"
                                    aria-label="Sign in to your account"
                                >
                                    <Link href="/auth/signin" rel="nofollow" className="flex items-center gap-1.5">
                                        <LogIn className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Sign In</span>
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Single unified mobile nav burger */}
                    <div className="h-10 flex items-center border-l border-slate-200 dark:border-white/5 pl-3 sm:pl-4 ml-1 gap-1.5 sm:gap-4">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        <MobileUnifiedNav />
                    </div>
                </div>
            </div>
        </header>
    );
}
