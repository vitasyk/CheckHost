"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Activity, Plus, Trash2, ArrowRight } from "lucide-react";
import { useTranslations } from 'next-intl';

interface Monitor {
    id: string;
    domain: string;
    type: string;
    status: string;
}

interface FeedEvent {
    id: string;
    event_type: string;
    title: string;
    message: string;
    created_at: string;
}

export function UserActivityFeed() {
    const t = useTranslations('Dashboard');

    const [monitors, setMonitors] = useState<Monitor[]>([]);
    const [feed, setFeed] = useState<FeedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add Monitor Form
    const [newDomain, setNewDomain] = useState("");
    const [newType, setNewType] = useState("ssl");
    const [isAdding, setIsAdding] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch monitors
            const mRes = await fetch('/api/user/monitors');
            const mData = await mRes.json();
            if (mRes.ok) setMonitors(mData.data || []);

            // Fetch feed
            const fRes = await fetch('/api/user/feed?limit=10');
            const fData = await fRes.json();
            if (fRes.ok) setFeed(fData.data || []);

        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddMonitor = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            const res = await fetch('/api/user/monitors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: newDomain, type: newType })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to add monitor');

            setNewDomain("");
            fetchData(); // Refresh lists
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteMonitor = async (id: string) => {
        if (!confirm("Are you sure you want to remove this monitor?")) return;
        try {
            const res = await fetch(`/api/user/monitors?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete monitor');
            fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Monitors Section */}
            <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            {t('activeMonitors')}
                        </h2>
                        <p className="text-slate-500 text-sm">{t('activeMonitorsDesc')}</p>
                    </div>
                </div>

                {/* Add Monitor Form */}
                <form onSubmit={handleAddMonitor} className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                    <input
                        type="text"
                        placeholder="example.com"
                        required
                        value={newDomain}
                        onChange={e => setNewDomain(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                        value={newType}
                        onChange={e => setNewType(e.target.value)}
                        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="ssl">SSL Certificate</option>
                        <option value="dns">DNS Records</option>
                        <option value="uptime">Uptime / Ping</option>
                        <option value="blacklist">IP Blacklist</option>
                        <option value="smtp">SMTP / Port 25</option>
                    </select>
                    <Button type="submit" disabled={isAdding} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        Add Monitor
                    </Button>
                </form>

                {/* Monitors List */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {monitors.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-950/50">
                            <div>
                                <h3 className="font-bold text-sm truncate max-w-[150px]">{m.domain}</h3>
                                <p className="text-xs text-slate-500 font-mono uppercase mt-1">{m.type}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${m.status === 'pending' ? 'bg-orange-400' : m.status === 'ok' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                <button onClick={() => handleDeleteMonitor(m.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {monitors.length === 0 && !loading && (
                        <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                            No monitors active. Add a domain to start tracking!
                        </div>
                    )}
                </div>
            </Card>

            {/* Personalized Activity Feed */}
            <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm relative overflow-hidden">
                <div className="mb-6 z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        Activity Feed
                    </h2>
                    <p className="text-slate-500 text-sm">Real-time alerts and notifications from your monitored domains.</p>
                </div>

                <div className="space-y-4">
                    {feed.length === 0 && !loading ? (
                        <div className="py-12 text-center text-slate-500">
                            Your feed is currently empty.
                        </div>
                    ) : (
                        feed.map(item => (
                            <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors">
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.event_type === 'error' ? 'bg-red-500' :
                                    item.event_type === 'warning' ? 'bg-orange-500' :
                                        item.event_type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                                    }`} />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{item.message}</p>
                                    <p className="text-xs text-slate-400 mt-2">{new Date(item.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
