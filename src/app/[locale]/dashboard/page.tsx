import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Activity, ShieldAlert, MonitorCheck, LayoutDashboard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { UserActivityFeed } from "@/components/dashboard/UserActivityFeed";
import { getTranslations } from 'next-intl/server';

export const metadata = {
    title: 'My Dashboard - Active Monitors & API Setup | CheckNode',
    description: 'User dashboard',
};

export const dynamic = 'force-dynamic';

// NextJS pages with dynamic params receive standard params object but for NextJS app router, 
// using await getTranslations without full request context works for global strings,
// but for locale-based, let's destructure or just use default.
export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/signin');
    }

    if (session.user.role === 'admin') {
        redirect('/admin');
    }

    const t = await getTranslations('Dashboard');

    return (
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                <DashboardSidebar />

                <div className="flex-1 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                <LayoutDashboard className="h-8 w-8 text-indigo-500" />
                                {t('userDashboard')}
                            </h1>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">
                                {t('welcomeBack', { name: session.user.name || session.user.email })}
                            </p>
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <MonitorCheck className="w-24 h-24" />
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-xl">
                                    <MonitorCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{t('activeMonitors')}</h3>
                                    <p className="text-xs text-slate-500 font-medium">{t('comingSoon')}</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {t('activeMonitorsDesc')}
                            </p>
                        </Card>

                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity className="w-24 h-24" />
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-500/10 rounded-xl">
                                    <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{t('apiUsage')}</h3>
                                    <p className="text-xs text-slate-500 font-medium">{t('freePlan')}</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {t('apiUsageDesc')}
                            </p>
                        </Card>

                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 shadow-inner">
                            <div className="flex items-center gap-3 mb-2 text-emerald-500">
                                <ShieldCheck className="h-5 w-5" />
                                <h3 className="font-bold">{t('accessLevel')}</h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                {t('userAccessLevelDesc')}
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                {t('role', { role: session.user.role })}
                            </div>
                        </Card>
                    </div>

                    {/* Personalized Activity Feed & Monitors */}
                    <UserActivityFeed />

                </div>
            </div>
        </div>
    );
}
