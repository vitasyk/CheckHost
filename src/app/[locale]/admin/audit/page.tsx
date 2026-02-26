'use client';

import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import {
    History,
    Search,
    RefreshCw,
    Info,
    User,
    Calendar
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Terminal,
    Trash2,
    FileText
} from 'lucide-react';

interface AuditLog {
    id: string;
    admin_email: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    details: any;
    ip_address: string | null;
    created_at: string;
}

export default function AuditLogsPage() {
    const { data: _session } = useSession();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [blogLogs, setBlogLogs] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'audit' | 'blog'>('audit');

    const fetchAuditLogs = async () => {
        try {
            const res = await fetch('/api/admin/audit?type=audit');
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        }
    };

    const fetchBlogLogs = async () => {
        try {
            const res = await fetch('/api/admin/audit?type=blog');
            if (res.ok) {
                const text = await res.text();
                setBlogLogs(text);
            } else if (res.status === 404) {
                setBlogLogs('Log file is empty or not found.');
            }
        } catch (error) {
            console.error('Failed to fetch blog logs:', error);
        }
    };

    const fetchLogs = async () => {
        setRefreshing(true);
        if (activeTab === 'audit') {
            await fetchAuditLogs();
        } else {
            await fetchBlogLogs();
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchLogs();
    }, [activeTab]);

    // Simple polling for blog logs if active
    useEffect(() => {
        if (activeTab !== 'blog') return;
        const interval = setInterval(() => fetchBlogLogs(), 10000);
        return () => clearInterval(interval);
    }, [activeTab]);

    const filteredLogs = logs.filter(log =>
        log.admin_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getActionBadge = (action: string) => {
        if (action.includes('DELETE')) return <Badge variant="error" className="text-[10px] uppercase">{action}</Badge>;
        if (action.includes('UPDATE')) return <Badge variant="warning" className="text-[10px] uppercase">{action}</Badge>;
        if (action.includes('CREATE')) return <Badge variant="success" className="text-[10px] uppercase">{action}</Badge>;
        if (action.includes('BLOCK')) return <Badge variant="error" className="bg-orange-500 text-white text-[10px] uppercase border-0">{action}</Badge>;
        return <Badge variant="secondary" className="text-[10px] uppercase">{action}</Badge>;
    };

    return (
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                <AdminSidebar />

                <div className="flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                <History className="h-8 w-8 text-indigo-500" />
                                Security Audit Logs
                            </h2>
                            <p className="text-slate-500 mt-1">Timeline of all administrative actions in the system</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchLogs}
                            disabled={refreshing}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh Logs
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg w-fit border border-slate-200 dark:border-white/5">
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'audit'
                                    ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Security Audit
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('blog')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'blog'
                                    ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Terminal className="h-4 w-4" />
                                Blog Generation
                            </div>
                        </button>
                    </div>

                    {/* Search & Stats - Only for Audit logs */}
                    {activeTab === 'audit' && (
                        <Card className="p-4 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by email, action or entity type..."
                                    className="pl-10 h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </Card>
                    )}

                    {/* Content */}
                    <Card className="border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800 shadow-sm overflow-hidden min-h-[400px]">
                        {activeTab === 'audit' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4">Admin Email</th>
                                            <th className="px-6 py-4">Action</th>
                                            <th className="px-6 py-4">Target Entity</th>
                                            <th className="px-6 py-4">IP Address</th>
                                            <th className="px-6 py-4">Timestamp</th>
                                            <th className="px-6 py-4">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                                        {loading ? (
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td className="px-6 py-4" colSpan={6}>
                                                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full" />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : filteredLogs.length > 0 ? (
                                            filteredLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-3 w-3 text-slate-400" />
                                                            {log.admin_email}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {getActionBadge(log.action)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="font-mono text-[9px] dark:border-white/10 dark:text-slate-400">
                                                            {log.entity_type} {log.entity_id && `:${log.entity_id}`}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                        {log.ip_address || 'unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400 text-xs flex items-center gap-2">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            className="text-indigo-500 hover:text-indigo-600 transition-colors p-1"
                                                            title={JSON.stringify(log.details)}
                                                            onClick={() => alert(JSON.stringify(log.details, null, 2))}
                                                        >
                                                            <Info className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td className="px-6 py-12 text-center text-slate-400" colSpan={6}>
                                                    No audit logs found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-0 flex flex-col h-[700px]">
                                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <FileText className="h-4 w-4" />
                                        debug-blog.log
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">
                                            Live Polling Active
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs leading-relaxed">
                                    {loading ? (
                                        <div className="flex flex-col gap-2">
                                            {[...Array(10)].map((_, i) => (
                                                <div key={i} className="h-3 bg-slate-800 rounded animate-pulse w-full" />
                                            ))}
                                        </div>
                                    ) : (
                                        <pre className="text-slate-300 whitespace-pre-wrap break-all">
                                            {blogLogs || 'No log data available.'}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
