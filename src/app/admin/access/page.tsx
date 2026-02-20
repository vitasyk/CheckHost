'use client';

import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ShieldCheck,
    Plus,
    Trash2,
    Mail,
    Lock,
    Save,
    CheckCircle2,
    Loader2,
    ShieldAlert,
    UserCheck,
    KeyRound,
    Search,
    Ban
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useEffect, useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

interface AdminUser {
    email: string;
    role: 'admin' | 'user';
    status: 'active' | 'blocked';
    addedAt?: string;
}

interface AdminAccessConfig {
    google_emails: AdminUser[];
    credentials: {
        email: string;
        password: string;
    };
}

export default function AdminAccessPage() {
    const { data: session } = useSession();
    const [config, setConfig] = useState<AdminAccessConfig>({
        google_emails: [],
        credentials: {
            email: '',
            password: ''
        }
    });
    const [newEmail, setNewEmail] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/admin/settings?key=admin_access');
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        let migratedEmails: AdminUser[] = [];
                        if (typeof data.google_emails === 'string') {
                            migratedEmails = data.google_emails.split(',').filter(Boolean).map((e: string) => ({
                                email: e.trim().toLowerCase(),
                                role: 'admin',
                                status: 'active',
                                addedAt: new Date().toISOString()
                            }));
                        } else if (Array.isArray(data.google_emails)) {
                            migratedEmails = data.google_emails.map((u: any) => ({
                                email: (typeof u === 'string' ? u : u.email).toLowerCase(),
                                role: u.role || 'admin',
                                status: u.status || 'active',
                                addedAt: u.addedAt || new Date().toISOString()
                            }));
                        }

                        setConfig({
                            google_emails: migratedEmails,
                            credentials: data.credentials || { email: '', password: '' }
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch admin access config:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleAddEmail = () => {
        const trimmed = newEmail.trim().toLowerCase();
        if (!trimmed || !trimmed.includes('@')) return;
        if (config.google_emails.some(u => u.email === trimmed)) {
            setNewEmail('');
            return;
        }

        const newUser: AdminUser = {
            email: trimmed,
            role: 'user',
            status: 'active',
            addedAt: new Date().toISOString()
        };

        setConfig(prev => ({
            ...prev,
            google_emails: [newUser, ...prev.google_emails]
        }));
        setNewEmail('');
    };

    const handleRemoveEmail = (email: string) => {
        setConfig(prev => ({
            ...prev,
            google_emails: prev.google_emails.filter(u => u.email !== email)
        }));
    };

    const handleUpdateUser = (email: string, updates: Partial<AdminUser>) => {
        setConfig(prev => ({
            ...prev,
            google_emails: prev.google_emails.map(u =>
                u.email === email ? { ...u, ...updates } : u
            )
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings?key=admin_access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error('Failed to save access config:', error);
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return config.google_emails;
        const q = searchQuery.toLowerCase().trim();
        return config.google_emails.filter(u => u.email.includes(q));
    }, [config.google_emails, searchQuery]);

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-sans">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <AdminSidebar />

                    <main className="flex-1 space-y-8">
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-display">Access Control</h1>
                                <p className="text-slate-500 mt-1">Manage administrative roles and permissions</p>
                            </div>
                            <Button
                                className="h-10 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6 rounded-xl transition-all active:scale-95"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                                {saved ? 'Settings Saved' : 'Save Changes'}
                            </Button>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Google Accounts Section */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="p-0 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-2xl">
                                    <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                                                    <UserCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold">Authorized Google Accounts</h3>
                                                    <p className="text-xs text-slate-500">Users who can authenticate via Google OAuth</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800">
                                                {config.google_emails.length} Users
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Actions Bar: Add & Search */}
                                        <div className="flex flex-col lg:flex-row gap-4">
                                            <div className="flex-[3] flex gap-2 min-w-0">
                                                <div className="relative flex-1 min-w-0">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        value={newEmail}
                                                        onChange={(e) => setNewEmail(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                                                        placeholder="Add user email..."
                                                        className="pl-10 h-11 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 rounded-xl text-sm w-full"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleAddEmail}
                                                    className="h-11 px-6 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-xl gap-2 font-semibold shrink-0"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add User
                                                </Button>
                                            </div>
                                            <div className="flex-1 relative min-w-0">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Filter users..."
                                                    className="pl-10 h-11 bg-slate-100/50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-black rounded-xl text-sm w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Users List */}
                                        <div className="space-y-3">
                                            {filteredUsers.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl bg-slate-50/30 dark:bg-black/10 text-center px-4">
                                                    <Search className="h-12 w-12 text-slate-200 dark:text-slate-800 mb-3" />
                                                    <p className="text-sm font-medium text-slate-400">
                                                        {searchQuery ? `No results for "${searchQuery}"` : "No accounts added yet"}
                                                    </p>
                                                    {searchQuery && (
                                                        <Button variant="link" onClick={() => setSearchQuery('')} className="text-indigo-500 mt-2">
                                                            Clear Filter
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {filteredUsers.map((user) => (
                                                        <div
                                                            key={user.email}
                                                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-black/20 border rounded-2xl group transition-all duration-300 ${user.status === 'blocked'
                                                                ? 'opacity-60 border-rose-200/50 bg-rose-50/10'
                                                                : 'hover:border-indigo-200 dark:hover:border-indigo-500/30 border-slate-100 dark:border-white/5'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-105 ${user.status === 'blocked' ? 'bg-slate-200 text-slate-500' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                                    }`}>
                                                                    {user.email[0].toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-none">{user.email}</span>
                                                                        {user.status === 'blocked' && (
                                                                            <Badge variant="error" className="h-4 px-2 text-[8px] uppercase tracking-tighter">Blocked</Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-400 font-mono">Added: {new Date(user.addedAt || '').toLocaleDateString()}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 sm:gap-4 ml-16 sm:ml-0">
                                                                {/* Role Selector */}
                                                                <Select
                                                                    value={user.role}
                                                                    onValueChange={(val: 'admin' | 'user') => handleUpdateUser(user.email, { role: val })}
                                                                >
                                                                    <SelectTrigger className="w-24 h-9 bg-white dark:bg-slate-900 border-none shadow-sm rounded-lg text-[11px] font-bold uppercase tracking-wider">
                                                                        <SelectValue placeholder="Role" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
                                                                        <SelectItem value="admin" className="text-[11px] font-bold">ADMIN</SelectItem>
                                                                        <SelectItem value="user" className="text-[11px] font-bold">USER</SelectItem>
                                                                    </SelectContent>
                                                                </Select>

                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleUpdateUser(user.email, { status: user.status === 'active' ? 'blocked' : 'active' })}
                                                                        className={`h-9 w-9 rounded-lg transition-colors ${user.status === 'active'
                                                                            ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                                                            : 'text-amber-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                                                            }`}
                                                                    >
                                                                        <Ban className="h-4 w-4" />
                                                                    </Button>

                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleRemoveEmail(user.email)}
                                                                        className="h-9 w-9 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border-t border-amber-100/50 dark:border-amber-900/20 flex gap-3">
                                        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
                                        <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed font-medium italic">
                                            Environmental admins from <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded not-italic">.env.local</code> have persistent access.
                                        </p>
                                    </div>
                                </Card>
                            </div>

                            {/* Sidebar Config Section */}
                            <div className="space-y-6">
                                <Card className="p-0 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-2xl">
                                    <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                                                <KeyRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold">Secondary Admin</h3>
                                                <p className="text-xs text-slate-500">Credential login</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Admin Email</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        value={config.credentials.email}
                                                        onChange={(e) => setConfig(prev => ({
                                                            ...prev,
                                                            credentials: { ...prev.credentials, email: e.target.value }
                                                        }))}
                                                        placeholder="admin@mysite.com"
                                                        className="pl-10 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 rounded-xl h-11 text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Access Password</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        type="password"
                                                        value={config.credentials.password}
                                                        onChange={(e) => setConfig(prev => ({
                                                            ...prev,
                                                            credentials: { ...prev.credentials, password: e.target.value }
                                                        }))}
                                                        placeholder="••••••••••••"
                                                        className="pl-10 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 rounded-xl h-11"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <div className="flex items-start gap-3">
                                                <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                                    Use strong credentials for fallback access.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
