'use client';

import { useSession, signOut } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    BarChart3,
    Database,
    Save,
    Loader2,
    CheckCircle2,
    Megaphone,
    SwitchCamera,
    Share2,
    Trash2,
    Terminal
} from 'lucide-react';
import { Header } from '@/components/Header';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface IpInfoDisplayConfig {
    showFeaturedMap: boolean;
    showRdapData: boolean;
    showProviderCards: boolean;
}

interface FeatureFlagsConfig {
    globalCheckEnabled: boolean;
}

interface AdSlotConfig {
    id: string;
    enabled: boolean;
}

interface AdSenseConfig {
    client_id: string;
    enabled: boolean;
    slots: Record<string, AdSlotConfig>;
}

interface ShareResultsConfig {
    ttlDays: number;
}

export default function AdminSettings() {
    const { data: session } = useSession();
    const [config, setConfig] = useState<AdSenseConfig | null>(null);
    const [ipConfig, setIpConfig] = useState<IpInfoDisplayConfig>({
        showFeaturedMap: true,
        showRdapData: true,
        showProviderCards: true
    });
    const [featureConfig, setFeatureConfig] = useState<FeatureFlagsConfig>({
        globalCheckEnabled: true
    });
    const [shareConfig, setShareConfig] = useState<ShareResultsConfig>({
        ttlDays: 30
    });
    const [systemConfig, setSystemConfig] = useState({
        verboseLogging: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                // Fetch AdSense
                try {
                    const adsenseRes = await fetch('/api/admin/settings?key=adsense');
                    if (adsenseRes.ok) {
                        const data = await adsenseRes.json();

                        // Create deep copy of default slots
                        const defaultSlots = {
                            homepage_hero: { id: '', enabled: false },
                            results_bottom: { id: '', enabled: false },
                            blog_content: { id: '', enabled: false },
                            blog_top: { id: '', enabled: false },
                            blog_bottom: { id: '', enabled: false }
                        };

                        if (data) {
                            // Merge existing slots with defaults to ensure all identified slots are visible
                            const mergedSlots = { ...defaultSlots, ...(data.slots || {}) };
                            setConfig({
                                ...data,
                                client_id: data.client_id || '',
                                enabled: data.enabled ?? false,
                                slots: mergedSlots
                            });
                        } else {
                            // Initialize with defaults if no config exists
                            setConfig({
                                client_id: '',
                                enabled: false,
                                slots: defaultSlots
                            });
                        }
                    }
                } catch (e) {
                    console.error('AdSense fetch error:', e);
                }

                // Fetch IP Info Display
                const ipRes = await fetch('/api/admin/settings?key=ip_info_display');
                if (ipRes.ok) {
                    const data = await ipRes.json();
                    if (data) setIpConfig(data);
                }

                // Fetch Feature Flags
                const featureRes = await fetch('/api/admin/settings?key=feature_flags');
                if (featureRes.ok) {
                    const data = await featureRes.json();
                    if (data) setFeatureConfig(data);
                }

                // Fetch Share Results Config
                const shareRes = await fetch('/api/admin/settings?key=share_results');
                if (shareRes.ok) {
                    const data = await shareRes.json();
                    if (data) setShareConfig(data);
                }

                // Fetch System Config
                const systemRes = await fetch('/api/admin/settings?key=system_config');
                if (systemRes.ok) {
                    const data = await systemRes.json();
                    if (data) setSystemConfig(data);
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
            // Save AdSense
            const p1 = fetch('/api/admin/settings?key=adsense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            // Save IP Info Display
            const p2 = fetch('/api/admin/settings?key=ip_info_display', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ipConfig),
            });

            // Save Feature Flags
            const p3 = fetch('/api/admin/settings?key=feature_flags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(featureConfig),
            });

            // Save Share Config
            const p4 = fetch('/api/admin/settings?key=share_results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shareConfig),
            });

            // Save System Config
            const p5 = fetch('/api/admin/settings?key=system_config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(systemConfig),
            });

            await Promise.all([p1, p2, p3, p4, p5]);
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
            const res = await fetch('/api/admin/snapshots?all=true', {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('All shared snapshots have been cleared.');
            } else {
                const data = await res.json();
                alert(`Failed to clear snapshots: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to clear snapshots:', error);
            alert('An error occurred while clearing snapshots.');
        } finally {
            setClearing(false);
        }
    };

    const updateSlot = (slotKey: string, updates: Partial<AdSlotConfig>) => {
        if (!config) return;
        setConfig({
            ...config,
            slots: {
                ...config.slots,
                [slotKey]: { ...config.slots[slotKey], ...updates }
            }
        });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <AdminSidebar />

                    {/* Main Content */}
                    <main className="flex-1 space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Site Configuration</h2>
                                <p className="text-slate-500 mt-1">Manage AdSense and global parameters</p>
                            </div>
                            <Button
                                className="h-10 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6 rounded-xl"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                                {saved ? 'Settings Saved' : 'Save Changes'}
                            </Button>
                        </div>

                        {/* IP Info Display Section */}
                        <div className="space-y-6">
                            <Card className="p-8 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                                <Database className="absolute -right-4 -bottom-4 h-24 w-24 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors" />

                                <div className="space-y-1 mb-6">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold font-display">IP Info Dashboard</h3>
                                        <Badge variant="outline" className="text-[10px] py-0 border-slate-200 text-slate-500 bg-slate-50 dark:bg-slate-800/50">UI Blocks</Badge>
                                    </div>
                                    <p className="text-sm text-slate-400">Enable or disable specific sections of the IP information report.</p>
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    <Card className="p-4 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-bold">Featured Map</div>
                                            <Switch
                                                checked={ipConfig.showFeaturedMap}
                                                onCheckedChange={(val) => setIpConfig({ ...ipConfig, showFeaturedMap: val })}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400">Shows the prominent map and coordinates at the top of results.</p>
                                    </Card>

                                    <Card className="p-4 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-bold">RDAP / WHOIS</div>
                                            <Switch
                                                checked={ipConfig.showRdapData}
                                                onCheckedChange={(val) => setIpConfig({ ...ipConfig, showRdapData: val })}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400">Displays domain registration and public WHOIS information.</p>
                                    </Card>

                                    <Card className="p-4 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-bold">Provider Cards</div>
                                            <Switch
                                                checked={ipConfig.showProviderCards}
                                                onCheckedChange={(val) => setIpConfig({ ...ipConfig, showProviderCards: val })}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400">List of detailed results from individual geolocation providers.</p>
                                    </Card>
                                </div>
                            </Card>

                            {/* Share Results Section */}
                            <Card className="p-8 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                                <Share2 className="absolute -right-4 -bottom-4 h-24 w-24 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors" />

                                <div className="space-y-1 mb-6">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold font-display">Share Results</h3>
                                        <Badge variant="outline" className="text-[10px] py-0 border-slate-200 text-slate-500 bg-slate-50 dark:bg-slate-800/50">Snapshots</Badge>
                                    </div>
                                    <p className="text-sm text-slate-400">Configure how check results are shared and stored as permanent links.</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="p-4 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-bold">Retention Period (Days)</div>
                                            <div className="w-24">
                                                <Input
                                                    type="number"
                                                    value={shareConfig.ttlDays}
                                                    onChange={(e) => setShareConfig({ ...shareConfig, ttlDays: parseInt(e.target.value) || 30 })}
                                                    className="h-8 text-center font-bold"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400">How many days the shared results link remains active before deletion. Default is 30 days.</p>
                                    </Card>

                                    <Card className="p-4 border-red-100 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/10 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-bold text-red-600 dark:text-red-400">Clean Snapshots</div>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="h-8 gap-2 rounded-lg"
                                                onClick={handleClearSnapshots}
                                                disabled={clearing}
                                            >
                                                {clearing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                                Clear All
                                            </Button>
                                        </div>
                                        <p className="text-xs text-slate-400">Permanently delete all shared result snapshots from the database. <span className="text-red-500 font-bold">This cannot be undone.</span></p>
                                    </Card>
                                </div>
                            </Card>

                            {/* System Configuration Section */}
                            <Card className="p-8 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                                <Terminal className="absolute -right-4 -bottom-4 h-24 w-24 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors" />

                                <div className="space-y-1 mb-6">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold font-display">System Configuration</h3>
                                        <Badge variant="outline" className="text-[10px] py-0 border-slate-200 text-slate-500 bg-slate-50 dark:bg-slate-800/50">Core</Badge>
                                    </div>
                                    <p className="text-sm text-slate-400">Internal system parameters and diagnostic controls.</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="p-4 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-bold">Verbose Logging</div>
                                            <Switch
                                                checked={systemConfig.verboseLogging}
                                                onCheckedChange={(val) => setSystemConfig({ ...systemConfig, verboseLogging: val })}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400">Enable detailed application logs in the server terminal. Useful for debugging check flows.</p>
                                    </Card>

                                    <Card className="p-4 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex flex-col gap-4 opacity-50 cursor-not-allowed">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-bold">Debug Mode</div>
                                            <Switch disabled checked={false} />
                                        </div>
                                        <p className="text-xs text-slate-400">Enable deep trace logging for all API interactions (Coming soon).</p>
                                    </Card>
                                </div>
                            </Card>
                        </div>

                        {/* AdSense Section */}
                        <div className="space-y-6">
                            <Card className="p-8 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                                <Megaphone className="absolute -right-4 -bottom-4 h-24 w-24 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors" />

                                <div className="flex items-center justify-between gap-4 mb-8">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold font-display">Google AdSense</h3>
                                            <Badge variant="outline" className="text-[10px] py-0 border-slate-200 text-slate-500 bg-slate-50 dark:bg-slate-800/50">Global Toggle</Badge>
                                        </div>
                                        <p className="text-sm text-slate-400">Master switch to enable or disable all advertisements across the platform.</p>
                                    </div>
                                    <Switch
                                        checked={config?.enabled}
                                        onCheckedChange={(val) => setConfig(config ? { ...config, enabled: val } : null)}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Client ID (AdSense Publisher ID)</label>
                                        <Input
                                            value={config?.client_id}
                                            onChange={(e) => setConfig(config ? { ...config, client_id: e.target.value } : null)}
                                            placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                                            className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 rounded-xl h-12 font-mono"
                                        />
                                    </div>
                                </div>
                            </Card>

                            <div className="grid md:grid-cols-3 gap-6">
                                {config && Object.entries(config.slots).map(([key, slot]) => (
                                    <Card key={key} className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary" className="capitalize bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 border-0">
                                                    {key.replace(/_/g, ' ')}
                                                </Badge>
                                                <Switch
                                                    checked={slot.enabled}
                                                    onCheckedChange={(val) => updateSlot(key, { enabled: val })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slot ID</label>
                                                <Input
                                                    value={slot.id}
                                                    onChange={(e) => updateSlot(key, { id: e.target.value })}
                                                    placeholder="1234567890"
                                                    className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 rounded-lg h-10 font-mono text-xs"
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
