'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ResultsDisplay } from '@/components/checks/ResultsDisplay';
import { SslDashboard } from '@/components/checks/SslDashboard';
import { DnsDashboard } from '@/components/checks/DnsDashboard';
import IpInfoResult from '@/components/ip-info/IpInfoResult';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Clock, Globe, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SharePage() {
    const params = useParams();
    const id = params.id as string;
    const [snapshot, setSnapshot] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dnsFilter, setDnsFilter] = useState('all');

    useEffect(() => {
        if (!id) return;

        const fetchSnapshot = async () => {
            try {
                const res = await fetch(`/api/share/${id}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || 'Failed to fetch shared results');
                    return;
                }

                setSnapshot(data);
            } catch (err: any) {
                // Only log unexpected network/syntax errors, not 404/410 which are handled via state
                setError(err.message || 'An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchSnapshot();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                <Header />
                <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-[400px] w-full rounded-2xl" />
                </main>
            </div>
        );
    }

    if (error) {
        const isExpired = error.toLowerCase().includes('expired');
        const isNotFound = error.toLowerCase().includes('not found');

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4 py-20">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-12 rounded-3xl shadow-xl text-center space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500/50" />

                        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                            {isExpired ? (
                                <Clock className="h-12 w-12 text-amber-500" />
                            ) : (
                                <Globe className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                            )}
                            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-50 dark:border-amber-500/20 flex items-center justify-center">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                {isExpired ? 'Link Expired' : isNotFound ? 'Link Not Found' : 'Link Unavailable'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                {isExpired
                                    ? "This shared result has reached its retention limit and is no longer available for public viewing."
                                    : isNotFound
                                        ? "We couldn't find the result snapshot you're looking for. It may have been deleted by the owner."
                                        : error}
                            </p>
                        </div>

                        <div className="pt-4">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                Start New Check
                            </Link>
                        </div>

                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Check-Host.top • Diagnostic Service
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    const isSsl = snapshot.check_type === 'ssl';
    const isIpInfo = snapshot.check_type === 'info';
    const isDnsInfo = snapshot.check_type === 'dns-all';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Header />
            <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                {/* Result Info Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 uppercase text-[10px] font-bold tracking-widest">
                                Snapshot: {snapshot.check_type}
                            </Badge>
                            {snapshot.expires_at && (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-bold">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Expires: {new Date(snapshot.expires_at).toLocaleDateString()}
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight break-all">
                            {snapshot.target_host}
                        </h1>
                    </div>

                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Captured On</p>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                            {new Date(snapshot.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Main Results Content */}
                {isSsl ? (
                    <SslDashboard
                        data={snapshot.results}
                        host={snapshot.target_host}
                        isSharedView={true}
                    />
                ) : isIpInfo ? (
                    <IpInfoResult
                        data={snapshot.results}
                        onRefresh={() => { }}
                        isRefreshing={false}
                        isSharedView={true}
                    />
                ) : isDnsInfo ? (
                    <DnsDashboard
                        result={snapshot.results?.records ? snapshot.results : Object.values(snapshot.results)[0]}
                        isSharedView={true}
                        filterType={dnsFilter}
                        onFilterTypeChange={setDnsFilter}
                    />
                ) : (
                    <ResultsDisplay
                        checkType={snapshot.check_type}
                        results={snapshot.results}
                        nodes={snapshot.check_nodes || {}}
                        targetHost={snapshot.target_host}
                        isSharedView={true}
                    />
                )}

                <div className="text-center pt-8">
                    <p className="text-xs text-slate-400">
                        Check provided by <span className="font-bold text-indigo-500">Check-Host.top</span> • Free global network diagnostics
                    </p>
                </div>
            </main>
        </div>
    );
}
