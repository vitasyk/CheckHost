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
    FileText,
    Settings
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ToolStat, CountryStat } from '@/components/admin/AdminCharts';
import dynamic from 'next/dynamic';
import { GlobalActivityFeed } from '@/components/dashboard/GlobalActivityFeed';
import { useTranslations } from 'next-intl';

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

export default function AdminDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<Stats | null>(null);
    const [toolData, setToolData] = useState<ToolStat[]>([]);
    const [countryData, setCountryData] = useState<CountryStat[]>([]);
    const [blogData, setBlogData] = useState<BlogStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const t = useTranslations('Admin.dashboard');

    // Filters
    const [timeRange, setTimeRange] = useState('24h');
    const [toolFilter, setToolFilter] = useState('all');

    const fetchStats = useCallback(async () => {
        setRefreshing(true);
        try {
            const params = new URLSearchParams({ timeRange, tool: toolFilter });
            const res = await fetch(`/api/admin/stats?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
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
    }, [timeRange, toolFilter]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Sidebar */}
                <AdminSidebar />

                {/* Main Content */}
                <div className="flex-1 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('title')}</h2>
                            <p className="text-slate-500 mt-1">{t('subtitle')}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 gap-2 border-slate-200 bg-white dark:bg-slate-900 dark:border-white/5"
                            onClick={fetchStats}
                            disabled={refreshing}
                        >
                            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            {t('refreshData')}
                        </Button>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid sm:grid-cols-3 gap-6">
                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                            <Activity className="absolute -right-4 -bottom-4 h-24 w-24 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors" />
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('totalChecks')}</h3>
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
                                <Badge variant="outline" className="text-[10px] py-0 border-green-200 text-green-600 bg-green-50 dark:bg-green-900/20 dark:border-green-900/50">{t('liveTracker')}</Badge>
                            </div>
                        </Card>

                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                            <Globe className="absolute -right-4 -bottom-4 h-24 w-24 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors" />
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('apiHealth')}</h3>
                            {loading ? (
                                <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                            ) : (
                                <div className="text-4xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    {stats?.uptime}%
                                </div>
                            )}
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-3">{t('last24h')}</p>
                        </Card>

                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                            <AlertCircle className="absolute -right-4 -bottom-4 h-24 w-24 text-rose-500/5 group-hover:text-rose-500/10 transition-colors" />
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t('resolvedFailures')}</h3>
                            {loading ? (
                                <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                            ) : (
                                <div className="text-4xl font-mono font-bold text-rose-500">
                                    {stats?.errors}
                                </div>
                            )}
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-3">{t('errorCount')}</p>
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
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{t('contentFactory')}</h3>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-3xl font-bold">{blogData ? blogData.published : '-'}</span>
                                        <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t('published')}</span>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="text-xs text-slate-500"><span className="font-bold text-amber-500">{blogData ? blogData.draft : '-'}</span> {t('drafts')}</div>
                                    <div className="text-xs text-slate-500"><span className="font-bold text-slate-800 dark:text-slate-200">{blogData ? blogData.keywordsPending : '-'}</span> {t('keywordsQty')}</div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between relative overflow-hidden group">
                            <Settings className="absolute -right-4 -bottom-4 h-24 w-24 text-slate-500/5 group-hover:text-slate-500/10 transition-colors spin-slow" />
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{t('adSense')}</h3>
                                <p className="text-xs text-slate-500">{t('adSenseDesc')}</p>
                            </div>
                            <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50">{t('active')}</Badge>
                        </Card>
                    </div>

                    {/* Recent Activity Table using the new Component */}
                    <GlobalActivityFeed />
                </div>
            </div>
        </div>
    );
}
