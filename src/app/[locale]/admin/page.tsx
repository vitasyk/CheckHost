'use client';

import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Activity,
    Globe,
    AlertCircle,
    Loader2,
    RefreshCw,
    TrendingUp,
    FileText,
    Settings,
    MapPin,
    Filter
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ToolStat, CountryStat } from '@/components/admin/AdminCharts';
import dynamic from 'next/dynamic';

const AdminCharts = dynamic(() => import('@/components/admin/AdminCharts'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[400px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse">
            <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
        </div>
    )
});

interface Stats {
    totalChecks: number;
    totalChecksTrend: number;
    uptime: string;
    errors: number;
}
interface BlogStats {
    published: number;
    draft: number;
    keywordsPending: number;
    keywordsCompleted: number;
}

interface LogEntry {
    id: string;
    check_type: string;
    target_host: string;
    user_ip: string;
    created_at: string;
    status: string;
}

export default function AdminDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<Stats | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [toolData, setToolData] = useState<ToolStat[]>([]);
    const [countryData, setCountryData] = useState<CountryStat[]>([]);
    const [blogData, setBlogData] = useState<BlogStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [mounted, setMounted] = useState(false);


    // Filters
    const [timeRange, setTimeRange] = useState('24h');
    const [toolFilter, setToolFilter] = useState('all');

    const fetchStats = async () => {
        setRefreshing(true);
        try {
            const params = new URLSearchParams({ timeRange, tool: toolFilter });
            const res = await fetch(`/api/admin/stats?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setLogs(data.recentLogs);
                setToolData(data.toolDistribution || []);
                setCountryData(data.countryStats || []);
                setBlogData(data.blogStats || null);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchStats();
    }, [timeRange, toolFilter]);

    return (
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Sidebar */}
                <AdminSidebar />

                {/* Main Content */}
                <div className="flex-1 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Administrator Console</h2>
                            <p className="text-slate-500 mt-1">Status overview for {session?.user?.email}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 gap-2 border-slate-200 bg-white dark:bg-slate-900 dark:border-white/5"
                            onClick={fetchStats}
                            disabled={refreshing}
                        >
                            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Refresh Data
                        </Button>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid sm:grid-cols-3 gap-6">
                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                            <Activity className="absolute -right-4 -bottom-4 h-24 w-24 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors" />
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Total User Checks</h3>
                            {loading && !stats ? (
                                <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                            ) : (
                                <div className="text-4xl font-mono font-bold text-slate-900 dark:text-slate-100 flex items-baseline gap-2">
                                    {stats?.totalChecks.toLocaleString()}
                                    {stats?.totalChecksTrend !== undefined && (
                                        <span className={`text-sm font-medium ${stats.totalChecksTrend > 0 ? 'text-green-500' : stats.totalChecksTrend < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                            {stats.totalChecksTrend > 0 ? '⬆️+' : stats.totalChecksTrend < 0 ? '⬇️' : '⚖️'}{Math.abs(stats.totalChecksTrend)}%
                                        </span>
                                    )}
                                </div>
                            )}
                            <div className="text-[10px] text-green-500 font-bold uppercase tracking-tighter mt-3 flex items-center gap-1">
                                <Badge variant="outline" className="text-[10px] py-0 border-green-200 text-green-600 bg-green-50 dark:bg-green-900/20 dark:border-green-900/50">Live Tracker</Badge>
                            </div>
                        </Card>

                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                            <Globe className="absolute -right-4 -bottom-4 h-24 w-24 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors" />
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">API Health Uptime</h3>
                            {loading ? (
                                <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                            ) : (
                                <div className="text-4xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    {stats?.uptime}%
                                </div>
                            )}
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-3">Last 24 Hours</p>
                        </Card>

                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                            <AlertCircle className="absolute -right-4 -bottom-4 h-24 w-24 text-rose-500/5 group-hover:text-rose-500/10 transition-colors" />
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Resolved Failures</h3>
                            {loading ? (
                                <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                            ) : (
                                <div className="text-4xl font-mono font-bold text-rose-500">
                                    {stats?.errors}
                                </div>
                            )}
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-3">Error count (24h)</p>
                        </Card>
                    </div>

                    {/* Extended Analytics (Recharts - CSR Only) */}
                    <AdminCharts
                        toolData={toolData}
                        countryData={countryData}
                        loading={loading}
                        timeRange={timeRange}
                        setTimeRange={setTimeRange}
                        toolFilter={toolFilter}
                        setToolFilter={setToolFilter}
                    />

                    {/* Content Factory & SEO Status */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                            <FileText className="absolute -left-4 -bottom-4 h-24 w-24 text-blue-500/5 group-hover:text-blue-500/10 transition-colors" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Content Factory (SEO)</h3>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-3xl font-bold">{blogData ? blogData.published : '-'}</span>
                                        <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Published</span>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="text-xs text-slate-500"><span className="font-bold text-amber-500">{blogData ? blogData.draft : '-'}</span> Drafts</div>
                                    <div className="text-xs text-slate-500"><span className="font-bold text-slate-800 dark:text-slate-200">{blogData ? blogData.keywordsPending : '-'}</span> Keywords Qty</div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between relative overflow-hidden group">
                            <Settings className="absolute -right-4 -bottom-4 h-24 w-24 text-slate-500/5 group-hover:text-slate-500/10 transition-colors spin-slow" />
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">AdSense Status</h3>
                                <p className="text-xs text-slate-500">Global monetization engine</p>
                            </div>
                            <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50">Active</Badge>
                        </Card>
                    </div>

                    {/* Recent Activity Table */}
                    <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5">
                            <h3 className="font-bold text-lg">Global Activity Feed</h3>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mt-1">Recent check requests from users</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Target Host</th>
                                        <th className="px-6 py-4">User IP</th>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-4" colSpan={5}>
                                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : logs.length > 0 ? (
                                        logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-0 font-mono text-[10px] uppercase">
                                                        {log.check_type}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 font-mono text-xs">
                                                    {log.target_host}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                                    {log.user_ip}
                                                </td>
                                                <td className="px-6 py-4 text-slate-400 text-xs">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {log.status === 'success' ? (
                                                        <div className="flex items-center gap-1.5 text-green-500 font-bold text-[10px] uppercase tracking-tighter">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                            Completed
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[10px] uppercase tracking-tighter">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                            Failed
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td className="px-6 py-12 text-center text-slate-400 italic" colSpan={5}>
                                                No activity recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
