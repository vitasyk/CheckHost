"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ChevronLeft, ChevronRight, Users, ShieldCheck, Mail, Calendar, Activity, Eye, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: "admin" | "user";
    plan: string;
    created_at: string;
    last_login: string;
}

interface UserMonitor {
    id: string;
    domain: string;
    type: string;
    status: string;
    created_at: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const limit = 20;

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Monitors Dialog state
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userMonitors, setUserMonitors] = useState<UserMonitor[]>([]);
    const [monitorsLoading, setMonitorsLoading] = useState(false);

    const handleViewMonitors = async (user: User) => {
        setSelectedUser(user);
        setUserMonitors([]);
        setMonitorsLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}/monitors`);
            if (res.ok) {
                const data = await res.json();
                setUserMonitors(data.data || []);
            }
        } catch (e) {
            console.error("Failed to load user monitors", e);
        } finally {
            setMonitorsLoading(false);
        }
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                offset: ((page - 1) * limit).toString()
            });

            if (debouncedSearch) {
                params.append("search", debouncedSearch);
            }

            const res = await fetch(`/api/admin/users?${params.toString()}`);
            if (!res.ok) {
                if (res.status === 401) throw new Error("Unauthorized access");
                throw new Error("Failed to fetch users");
            }

            const data = await res.json();
            setUsers(data.data || []);
            setTotalPages(data.totalPages || 1);
            setTotalUsers(data.total || 0);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return (
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Sidebar */}
                <AdminSidebar />

                {/* Main Content */}
                <div className="flex-1 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                <Users className="w-8 h-8 text-indigo-500" />
                                Users Management
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                View and manage registered users, roles, and activity. Total users: <span className="font-bold text-indigo-500">{totalUsers}</span>
                            </p>
                        </div>
                    </div>

                    <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">

                        {/* Search Bar */}
                        <div className="mb-6 z-10 w-full md:w-1/3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Search users by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10"
                                />
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-white/5">
                                    <TableRow className="border-slate-200 dark:border-white/10 hover:bg-transparent">
                                        <TableHead className="font-semibold text-slate-900 dark:text-slate-300">User</TableHead>
                                        <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Role & Plan</TableHead>
                                        <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Registration</TableHead>
                                        <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Last Activity</TableHead>
                                        <TableHead className="font-semibold text-slate-900 dark:text-slate-300 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                                    <span>Loading users...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : error ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center text-red-500 bg-red-50 dark:bg-red-500/10">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <span>{error}</span>
                                                    <Button variant="outline" size="sm" onClick={fetchUsers}>Try Again</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                                No users found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <TableRow key={user.id} className="border-slate-100 dark:border-white/5 group">
                                                {/* User Info */}
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {user.image ? (
                                                            <Image src={user.image} alt="User Avatar" width={40} height={40} className="rounded-full shadow-sm" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                                                                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{user.name || "No Name Provided"}</p>
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                                                <Mail className="w-3 h-3" />
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Role & Plan */}
                                                <TableCell>
                                                    <div className="flex flex-col gap-1.5 items-start">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin'
                                                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                            }`}>
                                                            {user.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                                                            {user.role}
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                            plan: {user.plan}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* Registration Date */}
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        <span>{new Date(user.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 ml-6 mt-0.5">
                                                        {new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </TableCell>

                                                {/* Last Login/Activity */}
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <Activity className="w-4 h-4 text-emerald-500" />
                                                        <span>{new Date(user.last_login).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 ml-6 mt-0.5">
                                                        {new Date(user.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20"
                                                        onClick={() => handleViewMonitors(user)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Monitors
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        {!loading && !error && users.length > 0 && (
                            <div className="flex items-center justify-between mt-6">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Page {page} of {totalPages || 1}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* User Monitors Dialog */}
                    <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-indigo-500" />
                                    Monitors for {selectedUser?.name || selectedUser?.email}
                                </DialogTitle>
                                <DialogDescription>
                                    All active domains and endpoints currently being monitored by this user.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {monitorsLoading ? (
                                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                        <span>Loading monitors...</span>
                                    </div>
                                ) : userMonitors.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                                        This user has not added any monitors yet.
                                    </div>
                                ) : (
                                    userMonitors.map(m => (
                                        <div key={m.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{m.domain}</h4>
                                                <p className="text-xs text-slate-500 font-mono uppercase mt-1">TYPE: {m.type}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${m.status === 'ok' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                    m.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'ok' ? 'bg-emerald-500' : m.status === 'pending' ? 'bg-orange-500' : 'bg-red-500'}`} />
                                                    {m.status.toUpperCase()}
                                                </span>
                                                <span className="text-[10px] text-slate-400">Added: {new Date(m.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>
        </div>
    );
}
