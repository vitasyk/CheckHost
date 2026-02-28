'use client';

import { signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    BarChart3,
    Database,
    Newspaper,
    ShieldCheck,
    History,
    Megaphone,
    Home as HomeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function AdminSidebar() {
    const pathname = usePathname();
    const t = useTranslations('Admin.sidebar');

    const menuItems = [
        { label: t('dashboard'), icon: LayoutDashboard, href: '/admin' },
        { label: t('docs'), icon: Newspaper, href: '/admin/docs' },
        { label: t('blogPosts'), icon: Newspaper, href: '/admin/blog' },
        { label: t('adsManagement'), icon: Megaphone, href: '/admin/ads' },
        { label: t('accessControl'), icon: ShieldCheck, href: '/admin/access' },
        { label: t('auditLogs'), icon: History, href: '/admin/audit' },
        { label: t('analytics'), icon: BarChart3, href: '#', disabled: true },
        { label: t('apiLogs'), icon: Database, href: '#', disabled: true },
        { label: t('settings'), icon: Settings, href: '/admin/settings' },
    ];

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 space-y-2">
            {/* Back to site */}
            <Link href="/">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 p-6 font-medium rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                >
                    <HomeIcon className="h-5 w-5" />
                    {t('backToSite')}
                </Button>
            </Link>

            <hr className="my-2 border-slate-200 dark:border-white/5" />

            {menuItems.map((item) => (
                <Link key={item.label} href={item.href}>
                    <Button
                        variant="ghost"
                        disabled={item.disabled}
                        className={`w-full justify-start gap-3 p-6 font-medium rounded-xl transition-all duration-200 ${pathname === item.href
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 font-semibold shadow-sm'
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900/40'
                            }`}
                    >
                        <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                        {item.label}
                    </Button>
                </Link>
            ))}

            <hr className="my-6 border-slate-200 dark:border-white/5" />

            <Button
                variant="ghost"
                className="w-full justify-start gap-3 p-6 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-semibold"
                onClick={() => signOut({ callbackUrl: '/' })}
            >
                <LogOut className="h-5 w-5" />
                {t('logout')}
            </Button>
        </aside>
    );
}
