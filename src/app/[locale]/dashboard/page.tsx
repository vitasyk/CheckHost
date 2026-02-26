import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Activity, ShieldAlert, MonitorCheck, LayoutDashboard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const metadata = {
    title: 'Dashboard | CheckHost',
    description: 'User dashboard',
};

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/signin');
    }

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
                                User Dashboard
                            </h1>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">
                                Welcome back, {session.user.name || session.user.email}.
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
                                    <h3 className="font-bold text-slate-900 dark:text-white">Active Monitors</h3>
                                    <p className="text-xs text-slate-500 font-medium">Coming soon</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Set up automated uptime and performance tracking for your domains.
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
                                    <h3 className="font-bold text-slate-900 dark:text-white">API Usage</h3>
                                    <p className="text-xs text-slate-500 font-medium">Free Plan</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Check limits and track your CheckHost API consumption.
                            </p>
                        </Card>

                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 shadow-inner">
                            <div className={`flex items-center gap-3 mb-2 ${session.user.role === 'admin' ? 'text-indigo-500' : 'text-rose-500'}`}>
                                {session.user.role === 'admin' ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                                <h3 className="font-bold">Access Level</h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                {session.user.role === 'admin'
                                    ? "You are logged in as an Administrator. You have full access to the administrative control panel."
                                    : "You are logged in as a standard user. You do not have access to the administrative control panel."}
                            </p>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest ${session.user.role === 'admin'
                                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                                : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
                                }`}>
                                Role: {session.user.role}
                            </div>
                            {session.user.role === 'admin' && (
                                <div className="mt-4">
                                    <Link href="/admin" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                                        Go to Admin Panel &rarr;
                                    </Link>
                                </div>
                            )}
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}
