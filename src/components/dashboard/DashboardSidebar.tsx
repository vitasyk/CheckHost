'use client';

import { signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Home as HomeIcon,
    MonitorCheck,
    Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Monitors', icon: MonitorCheck, href: '#', disabled: true },
    { label: 'API Usage', icon: Activity, href: '#', disabled: true },
    { label: 'Settings', icon: Settings, href: '#', disabled: true },
];

export function DashboardSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 space-y-2">
            {/* Back to site */}
            <Link href="/">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 p-6 font-medium rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                >
                    <HomeIcon className="h-5 w-5" />
                    Back to Site
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
                Logout
            </Button>
        </aside>
    );
}
