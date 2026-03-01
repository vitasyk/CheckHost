'use client';

import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Settings,
    Save,
    Loader2,
    CheckCircle2,
    Database,
    Clock,
    ShieldAlert,
    Bell,
    Trash2,
    AlertTriangle,
    Activity,
    RefreshCw,
    Globe,
    Sparkles,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useTranslations } from 'next-intl';
import { FileEditor } from '@/components/admin/FileEditor';

interface SystemConfig {
    maintenanceMode: boolean;
    verboseLogging: boolean;
    db_postgres_enabled: boolean;
    db_supabase_enabled: boolean;
}

interface GlobalNotice {
    enabled: boolean;
    message: string;
    type: 'info' | 'warning' | 'error';
}

interface ShareResultsConfig {
    ttlDays: number;
}

interface SeoConfig {
    siteTitle: string;
    siteDescription: string;
    keywords: string;
}

interface AiConfig {
    geminiKey: string;
    geminiModel: string;
    openaiKey: string;
    claudeKey: string;
    googleRefreshToken: string;
    openaiSessionToken: string;
    claudeSessionKey: string;
    useBrowserAuth: boolean;
    geminiEnabled: boolean;
    openaiEnabled: boolean;
    claudeEnabled: boolean;
    groqEnabled: boolean;
    browserEnabled: boolean;
    groqKey: string;
    groqModel: string;
    preferredProvider: 'gemini' | 'openai' | 'claude' | 'groq' | 'browser';
    masterPrompt: string;
}

export default function AdminSettings() {
    const { data: _session } = useSession();
    const [systemConfig, setSystemConfig] = useState<SystemConfig>({
        maintenanceMode: false,
        verboseLogging: false,
        db_postgres_enabled: true,
        db_supabase_enabled: true
    });
    const [globalNotice, setGlobalNotice] = useState<GlobalNotice>({
        enabled: false,
        message: '',
        type: 'info'
    });
    const [shareConfig, setShareConfig] = useState<ShareResultsConfig>({
        ttlDays: 30
    });
    const [seoConfig, setSeoConfig] = useState<SeoConfig>({
        siteTitle: '',
        siteDescription: '',
        keywords: ''
    });
    const [aiConfig, setAiConfig] = useState<AiConfig>({
        geminiKey: '',
        geminiModel: 'gemini-2.0-flash',
        openaiKey: '',
        claudeKey: '',
        googleRefreshToken: '',
        openaiSessionToken: '',
        claudeSessionKey: '',
        useBrowserAuth: false,
        geminiEnabled: true,
        openaiEnabled: true,
        claudeEnabled: false,
        groqEnabled: false,
        browserEnabled: false,
        groqKey: '',
        groqModel: 'llama-3.3-70b-versatile',
        preferredProvider: 'gemini',
        masterPrompt: ''
    });
    const [serverStatus, setServerStatus] = useState<any>(null);
    const [seoStats, setSeoStats] = useState<any>(null);
    const [syncing, setSyncing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [clearingSeo, setClearingSeo] = useState(false);
    const [saved, setSaved] = useState(false);
    const [purgingCache, setPurgingCache] = useState(false);
    const [replacingDomain, setReplacingDomain] = useState(false);
    const [replaceDomainConfig, setReplaceDomainConfig] = useState({
        oldDomain: 'check-host.top',
        newDomain: ''
    });
    const t = useTranslations('Admin.settings');

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                // Fetch System Config
                const systemRes = await fetch('/api/admin/settings?key=system_config');
                if (systemRes.ok) {
                    const data = await systemRes.json();
                    if (data) setSystemConfig(prev => ({ ...prev, ...data }));
                }

                // Fetch Global Notice
                const noticeRes = await fetch('/api/admin/settings?key=global_notice');
                if (noticeRes.ok) {
                    const data = await noticeRes.json();
                    if (data) setGlobalNotice(data);
                }

                // Fetch Share Results Config
                const shareRes = await fetch('/api/admin/settings?key=share_results');
                if (shareRes.ok) {
                    const data = await shareRes.json();
                    if (data) setShareConfig(data);
                }

                // Fetch SEO Config
                const seoRes = await fetch('/api/admin/settings?key=seo_config');
                if (seoRes.ok) {
                    const data = await seoRes.json();
                    if (data) setSeoConfig(data);
                }

                // Fetch AI Config
                const aiRes = await fetch('/api/admin/settings?key=ai_config');
                if (aiRes.ok) {
                    const data = await aiRes.json();
                    if (data) setAiConfig(prev => ({ ...prev, ...data }));
                }

                // Fetch Server Status
                const statusRes = await fetch('/api/admin/server-status');
                if (statusRes.ok) {
                    const data = await statusRes.json();
                    setServerStatus(data);
                }

                // Fetch SEO Stats
                const seoStatsRes = await fetch('/api/admin/seo-stats');
                if (seoStatsRes.ok) {
                    const data = await seoStatsRes.json();
                    setSeoStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch configs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfigs();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                fetch('/api/admin/settings?key=system_config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(systemConfig),
                }),
                fetch('/api/admin/settings?key=global_notice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(globalNotice),
                }),
                fetch('/api/admin/settings?key=share_results', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(shareConfig),
                }),
                fetch('/api/admin/settings?key=seo_config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(seoConfig),
                }),
                fetch('/api/admin/settings?key=ai_config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(aiConfig),
                })
            ]);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save config:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleClearSnapshots = async () => {
        if (!confirm('Are you sure you want to clear all shared results? This will invalidate all existing share links!')) {
            return;
        }

        setClearing(true);
        try {
            const res = await fetch('/api/admin/snapshots?all=true', { method: 'DELETE' });
            if (res.ok) alert('All shared snapshots have been cleared.');
        } catch (error) {
            console.error('Failed to clear snapshots:', error);
        } finally {
            setClearing(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/admin/db-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tables: ['site_settings', 'posts', 'admin_audit_logs', 'share_snapshots'] })
            });
            if (res.ok) {
                const data = await res.json();
                alert(`Sync completed successfully!\n\nStats:\nSettings: ${data.results.site_settings.pushedToSb} to SB, ${data.results.site_settings.pushedToPg} to PG\nPosts: ${data.results.posts.pushedToSb} to SB, ${data.results.posts.pushedToPg} to PG`);

                // Refresh status
                const statusRes = await fetch('/api/admin/server-status');
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    setServerStatus(statusData);
                }
            }
        } catch (error) {
            console.error('Failed to sync databases:', error);
            alert('Failed to sync databases. Check logs.');
        } finally {
            setSyncing(false);
        }
    };

    const handlePurgeCache = async () => {
        if (!confirm('This will unregister all Service Workers and clear browser cache for your current session. The page will be reloaded. Proceed?')) {
            return;
        }

        setPurgingCache(true);
        try {
            // 1. Unregister Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }

            // 2. Clear Caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    await caches.delete(cacheName);
                }
            }

            alert('Client cache purged successfully. Reloading page...');
            window.location.reload();
        } catch (error) {
            console.error('Failed to purge client cache:', error);
            alert('Failed to purge cache. Check console.');
        } finally {
            setPurgingCache(false);
        }
    };

    const handleReplaceDomain = async () => {
        if (!replaceDomainConfig.oldDomain.trim() || !replaceDomainConfig.newDomain.trim()) {
            alert('Please enter both old and new domains.');
            return;
        }

        if (!confirm(`This will replace all old domain links (${replaceDomainConfig.oldDomain}) in existing blog posts with the new domain (${replaceDomainConfig.newDomain}). Proceed?`)) {
            return;
        }

        setReplacingDomain(true);
        try {
            const res = await fetch('/api/admin/blog/replace-domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(replaceDomainConfig)
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Done! Updated ${data.updatedPosts} post(s).\n${data.oldDomain} → ${data.newDomain}`);
            } else {
                alert('Error: ' + (data.error || 'Unknown error'));
            }
        } catch {
            alert('Failed to replace domain. Check logs.');
        } finally {
            setReplacingDomain(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                <AdminSidebar />

                <div className="flex-1 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                <Settings className="h-8 w-8 text-indigo-500" />
                                System Settings
                            </h2>
                            <p className="text-slate-500 mt-1">Manage core system behavior and global configurations</p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-11 px-6 shadow-lg shadow-indigo-500/20 rounded-xl"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Config'}
                        </Button>
                    </div>

                    {/* Maintenance Mode */}
                    <Card className="p-6 border-red-200 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/5 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-red-700 dark:text-red-400">
                                    <ShieldAlert className="h-5 w-5" />
                                    Maintenance Mode
                                    {systemConfig.maintenanceMode && <Badge variant="error" className="ml-2 animate-pulse">Active</Badge>}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">When active, the site will show a maintenance page to all non-admin users. Use this for major updates.</p>
                            </div>
                            <Switch
                                checked={systemConfig.maintenanceMode}
                                onCheckedChange={(val) => setSystemConfig(prev => ({ ...prev, maintenanceMode: val }))}
                                className="data-[state=checked]:bg-red-500"
                            />
                        </div>
                    </Card>

                    {/* Global Notice */}
                    <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-indigo-500" />
                                    Global Site Notice
                                </h3>
                                <p className="text-sm text-slate-500">Display a persistent message at the top of every page.</p>
                            </div>
                            <Switch
                                checked={globalNotice.enabled}
                                onCheckedChange={(val) => setGlobalNotice(prev => ({ ...prev, enabled: val }))}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-4">
                            <div className="sm:col-span-3">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notice Message</label>
                                <Input
                                    placeholder="e.g. We are performing system upgrades..."
                                    className="mt-1 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10"
                                    value={globalNotice.message}
                                    onChange={(e) => setGlobalNotice(prev => ({ ...prev, message: e.target.value }))}
                                    disabled={!globalNotice.enabled}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                                <select
                                    className="mt-1 w-full h-10 px-3 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-sm"
                                    value={globalNotice.type}
                                    onChange={(e) => setGlobalNotice(prev => ({ ...prev, type: e.target.value as any }))}
                                    disabled={!globalNotice.enabled}
                                >
                                    <option value="info">Info (Blue)</option>
                                    <option value="warning">Warning (Yellow)</option>
                                    <option value="error">Critical (Red)</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* LEFT COLUMN */}
                        <div className="space-y-6">
                            {/* Data Retention */}
                            <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                    <Clock className="h-5 w-5 text-indigo-500" />
                                    Snapshot Retention
                                </h3>
                                <p className="text-sm text-slate-500">Configure how long shared result snapshots are kept before automatic deletion.</p>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="number"
                                        value={shareConfig.ttlDays}
                                        onChange={(e) => setShareConfig(prev => ({ ...prev, ttlDays: parseInt(e.target.value) }))}
                                        className="w-24 bg-slate-50 dark:bg-slate-950"
                                    />
                                    <span className="text-sm font-medium text-slate-600">Days</span>
                                </div>
                            </Card>

                            {/* Database Operations */}
                            <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                    <Database className="h-5 w-5 text-indigo-500" />
                                    Data Cleanup
                                </h3>
                                <p className="text-sm text-slate-500 italic">Caution: This action is permanent and affects all users.</p>
                                <Button
                                    variant="outline"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 gap-2"
                                    onClick={handleClearSnapshots}
                                    disabled={clearing}
                                >
                                    {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    Clear All Snapshots
                                </Button>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-6">
                            {/* Domain Replacement */}
                            <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                    <RefreshCw className="h-5 w-5 text-indigo-500" />
                                    Domain Replacement
                                </h3>
                                <p className="text-sm text-slate-500">Find and replace domain mentions in all blog posts (HTTP/HTTPS/WWW auto-handled).</p>

                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Search for (Old Domain)</label>
                                        <Input
                                            placeholder="e.g. check-host.top"
                                            value={replaceDomainConfig.oldDomain}
                                            onChange={(e) => setReplaceDomainConfig(prev => ({ ...prev, oldDomain: e.target.value }))}
                                            className="bg-slate-50 dark:bg-slate-950"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Replace with (New Domain)</label>
                                        <Input
                                            placeholder="e.g. checknode.io"
                                            value={replaceDomainConfig.newDomain}
                                            onChange={(e) => setReplaceDomainConfig(prev => ({ ...prev, newDomain: e.target.value }))}
                                            className="bg-slate-50 dark:bg-slate-950"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 gap-2 mt-2"
                                        onClick={handleReplaceDomain}
                                        disabled={replacingDomain || !replaceDomainConfig.oldDomain || !replaceDomainConfig.newDomain}
                                    >
                                        {replacingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        Replace Domain in Blog Posts
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* SEO Config */}
                    <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Settings className="h-5 w-5 text-indigo-500" />
                                SEO & Branding
                            </h3>
                            <p className="text-sm text-slate-500">Global site metadata for search engines and social sharing.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Site Title</label>
                                <Input
                                    value={seoConfig.siteTitle}
                                    onChange={(e) => setSeoConfig(prev => ({ ...prev, siteTitle: e.target.value }))}
                                    placeholder="e.g. CheckHost - Professional Website Diagnostics"
                                    className="bg-slate-50 dark:bg-slate-950"
                                />
                                <p className="text-[10px] text-slate-400">Ideally between 50-60 characters.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Meta Description</label>
                                <textarea
                                    value={seoConfig.siteDescription}
                                    onChange={(e) => setSeoConfig(prev => ({ ...prev, siteDescription: e.target.value }))}
                                    className="w-full min-h-[100px] p-3 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                    placeholder="Brief summary of your service..."
                                />
                                <p className="text-[10px] text-slate-400">Ideally between 150-160 characters.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">SEO Keywords (comma separated)</label>
                                <Input
                                    value={seoConfig.keywords}
                                    onChange={(e) => setSeoConfig(prev => ({ ...prev, keywords: e.target.value }))}
                                    placeholder="uptime, monitoring, dns, checkhost"
                                    className="bg-slate-50 dark:bg-slate-950"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* AI Config */}
                    <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Globe className="h-5 w-5 text-indigo-500" />
                                AI & Content Generation (Auto-Blog)
                            </h3>
                            <p className="text-sm text-slate-500">Provide API keys from AI providers to enable automated blog generation and cover images.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Primary AI Provider selector */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-indigo-500" />
                                    Primary AI Provider (Default)
                                </label>
                                <select
                                    className="w-full h-10 px-3 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                    value={aiConfig.preferredProvider || 'gemini'}
                                    onChange={(e) => setAiConfig(prev => ({ ...prev, preferredProvider: e.target.value as any }))}
                                >
                                    <option value="gemini">Google Gemini (Recommended)</option>
                                    <option value="openai">OpenAI (ChatGPT/GPT-4o-mini)</option>
                                    <option value="claude">Anthropic Claude (Best Quality)</option>
                                    <option value="groq">Groq (Llama 3.3 70B - Fastest Free)</option>
                                    <option value="browser">Browser Auth (Personal Session)</option>
                                </select>
                                <p className="text-[10px] text-slate-400">This provider will be tried first. If it fails or is disabled, system will use fallbacks.</p>
                            </div>

                            {/* Provider Cards */}
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Enabled Providers — Fallback Chain</p>

                                {/* Gemini */}
                                <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${aiConfig.geminiEnabled ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30'}`}>
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${aiConfig.geminiEnabled ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>G</div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">Google Gemini</span>
                                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Recommended</Badge>
                                                </div>
                                                <p className="text-[10px] text-slate-400">Fast & low-cost article generation</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={aiConfig.geminiEnabled}
                                            onCheckedChange={(val) => setAiConfig(prev => ({ ...prev, geminiEnabled: val }))}
                                        />
                                    </div>
                                    <div className={`transition-all duration-200 ${aiConfig.geminiEnabled ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} overflow-hidden`}>
                                        <div className="px-4 pb-4 space-y-3 border-t border-indigo-100 dark:border-indigo-500/20 pt-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">API Key</label>
                                                <Input
                                                    type="password"
                                                    value={aiConfig.geminiKey}
                                                    onChange={(e) => setAiConfig(prev => ({ ...prev, geminiKey: e.target.value }))}
                                                    placeholder="AIzaSy..."
                                                    className="bg-white dark:bg-slate-950 font-mono text-xs h-9"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Model</label>
                                                <select
                                                    className="w-full h-9 px-3 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                                    value={aiConfig.geminiModel || 'gemini-2.0-flash'}
                                                    onChange={(e) => setAiConfig(prev => ({ ...prev, geminiModel: e.target.value }))}
                                                >
                                                    <optgroup label="Gemini 2.0 (Recommended)">
                                                        <option value="gemini-2.0-flash">gemini-2.0-flash — Fast, cheap, best for most regions ✅</option>
                                                        <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite — Lightweight, ultra-low cost</option>
                                                    </optgroup>
                                                    <optgroup label="Gemini 1.5">
                                                        <option value="gemini-1.5-flash">gemini-1.5-flash — Older, wider regional support</option>
                                                        <option value="gemini-1.5-pro">gemini-1.5-pro — Higher quality, slower</option>
                                                    </optgroup>
                                                    <optgroup label="Gemini 2.5 (Preview)">
                                                        <option value="gemini-2.5-pro-preview-03-25">gemini-2.5-pro-preview — Highest quality (preview only)</option>
                                                    </optgroup>
                                                </select>
                                                <p className="text-[10px] text-slate-400">
                                                    ⚠️ If you get <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">400 User location not supported</code>, switch to <strong>gemini-1.5-flash</strong>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* OpenAI */}
                                <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${aiConfig.openaiEnabled ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30'}`}>
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${aiConfig.openaiEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>O</div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">OpenAI</span>
                                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">DALL-E 3</Badge>
                                                </div>
                                                <p className="text-[10px] text-slate-400">ChatGPT / GPT-4o-mini + image generation</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={aiConfig.openaiEnabled}
                                            onCheckedChange={(val) => setAiConfig(prev => ({ ...prev, openaiEnabled: val }))}
                                        />
                                    </div>
                                    <div className={`transition-all duration-200 ${aiConfig.openaiEnabled ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} overflow-hidden`}>
                                        <div className="px-4 pb-4 space-y-1.5 border-t border-emerald-100 dark:border-emerald-500/20 pt-3">
                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">API Key</label>
                                            <Input
                                                type="password"
                                                value={aiConfig.openaiKey}
                                                onChange={(e) => setAiConfig(prev => ({ ...prev, openaiKey: e.target.value }))}
                                                placeholder="sk-..."
                                                className="bg-white dark:bg-slate-950 font-mono text-xs h-9"
                                            />
                                            <p className="text-[10px] text-slate-400">Used for article text or Cover Images via DALL-E 3.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Claude */}
                                <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${aiConfig.claudeEnabled ? 'border-violet-200 dark:border-violet-500/30 bg-violet-50/40 dark:bg-violet-900/10' : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30'}`}>
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${aiConfig.claudeEnabled ? 'bg-violet-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>C</div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">Anthropic Claude</span>
                                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Best Quality</Badge>
                                                </div>
                                                <p className="text-[10px] text-slate-400">Highest quality SEO content via Claude 3.5 Sonnet</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={aiConfig.claudeEnabled}
                                            onCheckedChange={(val) => setAiConfig(prev => ({ ...prev, claudeEnabled: val }))}
                                        />
                                    </div>
                                    <div className={`transition-all duration-200 ${aiConfig.claudeEnabled ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} overflow-hidden`}>
                                        <div className="px-4 pb-4 space-y-1.5 border-t border-violet-100 dark:border-violet-500/20 pt-3">
                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">API Key</label>
                                            <Input
                                                type="password"
                                                value={aiConfig.claudeKey}
                                                onChange={(e) => setAiConfig(prev => ({ ...prev, claudeKey: e.target.value }))}
                                                placeholder="sk-ant-..."
                                                className="bg-white dark:bg-slate-950 font-mono text-xs h-9"
                                            />
                                            <p className="text-[10px] text-slate-400">Optional: used as a high-quality fallback provider.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Groq */}
                            <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${aiConfig.groqEnabled ? 'border-orange-200 dark:border-orange-500/30 bg-orange-50/40 dark:bg-orange-900/10' : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30'}`}>
                                <div className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${aiConfig.groqEnabled ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>Q</div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold">Groq</span>
                                                <Badge className="text-[9px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Free Tier</Badge>
                                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Llama 3.3</Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-400">14,400 req/day free — fastest inference on Llama 3.3 70B</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={aiConfig.groqEnabled}
                                        onCheckedChange={(val) => setAiConfig(prev => ({ ...prev, groqEnabled: val }))}
                                    />
                                </div>
                                <div className={`transition-all duration-200 ${aiConfig.groqEnabled ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} overflow-hidden`}>
                                    <div className="px-4 pb-4 space-y-3 border-t border-orange-100 dark:border-orange-500/20 pt-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">API Keys (One per line for load balancing)</label>
                                            <textarea
                                                value={aiConfig.groqKey || ''}
                                                onChange={(e) => setAiConfig(prev => ({ ...prev, groqKey: e.target.value }))}
                                                placeholder="gsk_..."
                                                className="w-full h-24 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-md font-mono text-xs focus:ring-2 focus:ring-orange-500/50 outline-none resize-none"
                                            />
                                            <p className="text-[10px] text-slate-400">
                                                Add multiple keys to bypass rate limits (14k RPD per key). Free at{' '}
                                                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">console.groq.com</a>
                                            </p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Model</label>
                                            <select
                                                className="w-full h-9 px-3 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-xs focus:ring-2 focus:ring-orange-500/50 outline-none"
                                                value={aiConfig.groqModel || 'llama-3.3-70b-versatile'}
                                                onChange={(e) => setAiConfig(prev => ({ ...prev, groqModel: e.target.value }))}
                                            >
                                                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile — Best quality, 14k req/day ✅</option>
                                                <option value="llama-3.1-8b-instant">llama-3.1-8b-instant — Ultrafast, high quota</option>
                                                <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 — 32k context window</option>
                                                <option value="gemma2-9b-it">gemma2-9b-it — Google Gemma 2, compact</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Browser Auth */}
                            <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${aiConfig.browserEnabled ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-900/10' : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30'}`}>
                                <div className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${aiConfig.browserEnabled ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>B</div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold">Browser Auth</span>
                                                <Badge variant="outline" className="text-[9px] border-amber-200 text-amber-600 px-1.5 py-0">Advanced</Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-400">SSO / Personal Subscriptions via session cookies</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={aiConfig.browserEnabled}
                                        onCheckedChange={(val) => setAiConfig(prev => ({ ...prev, browserEnabled: val }))}
                                    />
                                </div>
                                <div className={`transition-all duration-200 ${aiConfig.browserEnabled ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} overflow-hidden`}>
                                    <div className="px-4 pb-4 space-y-4 border-t border-amber-100 dark:border-amber-500/20 pt-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] text-slate-500">Use personal account sessions instead of API keys. Uses Windows/Chrome spoofing.</p>
                                            <Switch
                                                checked={aiConfig.useBrowserAuth}
                                                onCheckedChange={(val) => setAiConfig(prev => ({ ...prev, useBrowserAuth: val }))}
                                            />
                                        </div>
                                        <div className="space-y-4 bg-amber-50/30 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium">Google Refresh Token (Gemini)</label>
                                                <Input
                                                    type="password"
                                                    value={aiConfig.googleRefreshToken}
                                                    onChange={(e) => setAiConfig(prev => ({ ...prev, googleRefreshToken: e.target.value }))}
                                                    placeholder="1//0..."
                                                    className="bg-white dark:bg-slate-950 font-mono text-xs h-9"
                                                />
                                                <p className="text-[9px] text-slate-400">Obtained via Google OAuth. Allows Gemini to use your personal quota.</p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium">OpenAI Session Token (__Secure-next-auth.session-token)</label>
                                                <Input
                                                    type="password"
                                                    value={aiConfig.openaiSessionToken}
                                                    onChange={(e) => setAiConfig(prev => ({ ...prev, openaiSessionToken: e.target.value }))}
                                                    placeholder="..."
                                                    className="bg-white dark:bg-slate-950 font-mono text-xs h-9"
                                                />
                                                <p className="text-[9px] text-slate-400">Copy from browser cookies on chat.openai.com.</p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium">Claude Session Key (sessionKey)</label>
                                                <Input
                                                    type="password"
                                                    value={aiConfig.claudeSessionKey}
                                                    onChange={(e) => setAiConfig(prev => ({ ...prev, claudeSessionKey: e.target.value }))}
                                                    placeholder="sk-ant-sid01-..."
                                                    className="bg-white dark:bg-slate-950 font-mono text-xs h-9"
                                                />
                                                <p className="text-[9px] text-slate-400">Copy from browser cookies on claude.ai.</p>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">How to find these:</h4>
                                                <ol className="text-[10px] text-slate-400 list-decimal pl-4 space-y-1">
                                                    <li>Open browser DevTools (F12) → Application → Cookies.</li>
                                                    <li>For OpenAI: look for <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">__Secure-next-auth.session-token</code>.</li>
                                                    <li>For Claude: look for <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">sessionKey</code>.</li>
                                                    <li>To delete/logout: Simply clear these fields and save.</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Prompt Engineering Section */}
                            <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-purple-500" />
                                        Prompt Engineering (Master Prompt)
                                    </h4>
                                    <p className="text-[11px] text-slate-500">Customize the instructions sent to ALL AI models for article generation.</p>
                                </div>

                                <div className="space-y-2">
                                    <textarea
                                        className="w-full h-64 p-3 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-purple-500/50 outline-none resize-none"
                                        placeholder="You are a senior IT engineer..."
                                        value={aiConfig.masterPrompt}
                                        onChange={(e) => setAiConfig(prev => ({ ...prev, masterPrompt: e.target.value }))}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="text-[9px] py-0 px-1.5 cursor-help" title="Will be replaced by specific keyword">
                                            {"{{keyword}}"}
                                        </Badge>
                                        <Badge variant="secondary" className="text-[9px] py-0 px-1.5 cursor-help" title="Will be replaced by target language (e.g. English, Ukrainian)">
                                            {"{{language}}"}
                                        </Badge>
                                        <p className="text-[10px] text-slate-400 ml-auto italic">Leave empty to use the system default prompt.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Sitemap & Programmatic SEO */}
                    <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-indigo-500" />
                                    Sitemap &amp; Programmatic SEO
                                </h3>
                                <p className="text-sm text-slate-500">Automatically generated pages from user searches to boost organic traffic.</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                onClick={() => window.open('/sitemap.xml', '_blank')}
                            >
                                View Sitemap XML
                            </Button>
                        </div>

                        {seoStats ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Indexed Pages</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{seoStats.totalPages.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Unique domains &amp; IPs stored.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Added Today (24h)</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-green-600 dark:text-green-500">+{seoStats.recentPages.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">New pages discovered recently.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-white/5">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                                <p className="text-xs text-slate-500 mt-2">Loading SEO metrics...</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 gap-2"
                                disabled={clearingSeo}
                                onClick={async () => {
                                    if (confirm('Clear unpopular pages older than 30 days?')) {
                                        setClearingSeo(true);
                                        try {
                                            const res = await fetch('/api/admin/seo-stats', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ action: 'clear_old' })
                                            });
                                            if (res.ok) {
                                                alert('Old pages cleared successfully.');
                                                // Refresh stats
                                                const statsRes = await fetch('/api/admin/seo-stats');
                                                if (statsRes.ok) setSeoStats(await statsRes.json());
                                            }
                                        } catch (e) {
                                            console.error('Failed to clear SEO pages', e);
                                        } finally {
                                            setClearingSeo(false);
                                        }
                                    }
                                }}
                            >
                                {clearingSeo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Clear Unpopular Pages (Older than 30 Days)
                            </Button>
                        </div>
                    </Card>

                    {/* Server Status */}
                    {serverStatus && (
                        <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-green-500" />
                                        Server Status
                                    </h3>
                                    <p className="text-sm text-slate-500">Real-time health indicators and database management.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 px-4 border-slate-200 dark:border-white/10 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 gap-2 font-bold"
                                        onClick={handlePurgeCache}
                                        disabled={purgingCache}
                                    >
                                        <Zap className={`h-4 w-4 ${purgingCache ? 'animate-pulse text-amber-500' : ''}`} />
                                        {purgingCache ? 'Purging...' : 'Purge Client Cache'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 px-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-2 font-bold"
                                        onClick={handleSync}
                                        disabled={syncing}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                                        {syncing ? 'Syncing...' : 'Sync Databases'}
                                    </Button>
                                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:block">
                                        Refresh: {new Date(serverStatus.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Memory Usage</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-bold">{Math.round(serverStatus.server.memory.usage)}%</span>
                                        <div className="flex-1 h-3 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mb-1.5">
                                            <div
                                                className={`h-full transition-all duration-1000 ${serverStatus.server.memory.usage > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                                                style={{ width: `${serverStatus.server.memory.usage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">DB PostgreSQL</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2.5 w-2.5 rounded-full ${serverStatus.database.postgres.includes('connected') ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="font-bold text-sm truncate">{serverStatus.database.postgres}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Supabase</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2.5 w-2.5 rounded-full ${serverStatus.database.supabase === 'connected' ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                                        <span className="font-bold text-sm">{serverStatus.database.supabase}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                                <div>OS: {serverStatus.server.platform}</div>
                                <div>Uptime: {Math.floor(serverStatus.server.uptime / 3600)}h {Math.floor((serverStatus.server.uptime % 3600) / 60)}m</div>
                                <div>Node: {serverStatus.server.nodeVersion}</div>
                                <div>Load: {serverStatus.server.loadAvg.map((l: number) => l.toFixed(2)).join(', ')}</div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-medium">PostgreSQL Interface</div>
                                        <div className="text-[10px] text-slate-500">Enable or disable all PostgreSQL operations.</div>
                                    </div>
                                    <Switch
                                        checked={systemConfig.db_postgres_enabled}
                                        onCheckedChange={(checked) => setSystemConfig(prev => ({ ...prev, db_postgres_enabled: checked }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-medium">Supabase Interface</div>
                                        <div className="text-[10px] text-slate-500">Enable or disable all Supabase operations.</div>
                                    </div>
                                    <Switch
                                        checked={systemConfig.db_supabase_enabled}
                                        onCheckedChange={(checked) => setSystemConfig(prev => ({ ...prev, db_supabase_enabled: checked }))}
                                    />
                                </div>
                                {(!systemConfig.db_postgres_enabled && !systemConfig.db_supabase_enabled) && (
                                    <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                            Warning: Disconnecting both will put the site in &quot;Local-Only&quot; mode.
                                            Blog and public shares will be unavailable until re-enabled.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Additional Config */}
                    <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    Verbose Logging
                                </h3>
                                <p className="text-sm text-slate-500">Enable detailed server-side logging for debugging connection tasks.</p>
                            </div>
                            <Switch
                                checked={systemConfig.verboseLogging}
                                onCheckedChange={(val) => setSystemConfig(prev => ({ ...prev, verboseLogging: val }))}
                            />
                        </div>
                    </Card>

                    {/* System File Editor */}
                    <FileEditor />
                </div>
            </div>
        </div>
    );
}
