"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ChevronLeft, ChevronRight, Activity, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useTranslations } from 'next-intl';

interface ActivityLog {
    id: string;
    check_type: string;
    target_host: string;
    user_ip: string;
    status: string;
    created_at: string;
}

export function GlobalActivityFeed() {
    const t = useTranslations('GlobalActivityFeed');
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    // Filters
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [targetHostSearch, setTargetHostSearch] = useState<string>("");
    const [userIpSearch, setUserIpSearch] = useState<string>("");

    // Sorting
    const [sortColumn, setSortColumn] = useState<string>("created_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Debounced search queries
    const [debouncedTargetHost, setDebouncedTargetHost] = useState("");
    const [debouncedUserIp, setDebouncedUserIp] = useState("");

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTargetHost(targetHostSearch);
            setDebouncedUserIp(userIpSearch);
            setPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [targetHostSearch, userIpSearch]);

    // Reset pagination when filters change (handle Select directly)
    const handleTypeChange = (value: string) => {
        setTypeFilter(value);
        setPage(1);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortOrder("desc"); // Default to desc when changing column
        }
        setPage(1);
    };

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sort: sortColumn,
                order: sortOrder,
            });

            if (typeFilter !== "all") params.append("type", typeFilter);
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (debouncedTargetHost) params.append("target_host", debouncedTargetHost);
            if (debouncedUserIp) params.append("user_ip", debouncedUserIp);

            const res = await fetch(`/api/dashboard/activity?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch activity logs");

            const data = await res.json();
            setLogs(data.data || []);
            setTotalPages(data.totalPages || 1);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [page, typeFilter, statusFilter, debouncedTargetHost, debouncedUserIp, sortColumn, sortOrder]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const renderSortIcon = (column: string) => {
        if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-slate-400" />;
        return sortOrder === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4 text-indigo-500" />
        ) : (
            <ArrowDown className="ml-2 h-4 w-4 text-indigo-500" />
        );
    };

    return (
        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 shadow-sm relative overflow-hidden flex flex-col pt-8">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Activity className="w-48 h-48" />
            </div>

            <div className="mb-6 z-10">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    {t('title')}
                </h2>
                <p className="text-slate-500 text-sm">{t('subtitle')}</p>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 z-10 w-full lg:w-3/4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('type')}</label>
                    <Select value={typeFilter} onValueChange={handleTypeChange}>
                        <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10">
                            <SelectValue placeholder={t('allTypes')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allTypes')}</SelectItem>
                            <SelectItem value="ping">Ping</SelectItem>
                            <SelectItem value="http">HTTP</SelectItem>
                            <SelectItem value="dns">DNS</SelectItem>
                            <SelectItem value="tcp">TCP</SelectItem>
                            <SelectItem value="udp">UDP</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('status')}</label>
                    <Select value={statusFilter} onValueChange={handleStatusChange}>
                        <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10">
                            <SelectValue placeholder={t('allStatuses')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allStatuses')}</SelectItem>
                            <SelectItem value="success">{t('success')}</SelectItem>
                            <SelectItem value="error">{t('error')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('targetHost')}</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder={t('searchHost')}
                            value={targetHostSearch}
                            onChange={(e) => setTargetHostSearch(e.target.value)}
                            className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('userIp')}</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder={t('searchIp')}
                            value={userIpSearch}
                            onChange={(e) => setUserIpSearch(e.target.value)}
                            className="pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden z-10 bg-white/50 dark:bg-slate-950/50">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-white/5">
                        <TableRow className="border-slate-200 dark:border-white/10 hover:bg-transparent">
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">
                                <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold h-auto" onClick={() => handleSort('created_at')}>
                                    {t('dateTime')}
                                    {renderSortIcon('created_at')}
                                </Button>
                            </TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">
                                <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold h-auto" onClick={() => handleSort('check_type')}>
                                    {t('type')}
                                    {renderSortIcon('check_type')}
                                </Button>
                            </TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">
                                <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold h-auto" onClick={() => handleSort('target_host')}>
                                    {t('targetHost')}
                                    {renderSortIcon('target_host')}
                                </Button>
                            </TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">
                                <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold h-auto" onClick={() => handleSort('user_ip')}>
                                    {t('userIp')}
                                    {renderSortIcon('user_ip')}
                                </Button>
                            </TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">
                                <Button variant="ghost" className="p-0 hover:bg-transparent font-semibold h-auto" onClick={() => handleSort('status')}>
                                    {t('status')}
                                    {renderSortIcon('status')}
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                        <span>{t('loading')}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-red-500 bg-red-50 dark:bg-red-500/10">
                                    {error}
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                    {t('noActivityFound')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id} className="border-slate-100 dark:border-white/5">
                                    <TableCell className="whitespace-nowrap text-xs text-slate-500">
                                        {new Date(log.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200">
                                            {log.check_type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm max-w-[200px] truncate" title={log.target_host}>
                                        {log.target_host}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm text-slate-500">
                                        {log.user_ip || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${log.status === 'success'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                            : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            {log.status === 'success' ? t('success') : t('error')}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {!loading && !error && logs.length > 0 && (
                <div className="flex items-center justify-between mt-4 z-10">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('pageOf', { page, totalPages: totalPages || 1 })}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {t('prev')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
                        >
                            {t('next')}
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}
