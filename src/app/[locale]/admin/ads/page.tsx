'use client';

import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Megaphone,
    Save,
    Loader2,
    CheckCircle2,
    Info,
    Eye,
    Plus,
    Globe,
    Trash2
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AdPlacement {
    id: string;
    zone: string;
    path_pattern: string;
    enabled: boolean;
    alignment: 'left' | 'right' | 'center';
    width?: number;
    height?: number;
}

interface AdSenseConfig {
    client_id: string;
    enabled: boolean;
    slots: Record<string, any>;
    placements: AdPlacement[];
}

const defaultSlots = {
    homepage_hero: { id: '', enabled: false, width: undefined, height: undefined, alignment: 'center' },
    results_bottom: { id: '', enabled: false, width: undefined, height: undefined, alignment: 'center' },
    blog_content: { id: '', enabled: false, width: undefined, height: undefined, alignment: 'center' },
    blog_top: { id: '', enabled: false, width: undefined, height: undefined, alignment: 'center' },
    blog_bottom: { id: '', enabled: false, width: undefined, height: undefined, alignment: 'center' },
    homepage_bottom: { id: '', enabled: false, width: undefined, height: undefined, alignment: 'center' },
    sidebar_left: { id: '', enabled: false, width: 160, height: 600, alignment: 'center' },
    sidebar_right: { id: '', enabled: false, width: 160, height: 600, alignment: 'center' },
    share_content: { id: '', enabled: false, width: undefined, height: undefined, alignment: 'center' },
    error_page_content: { id: '', enabled: false, width: undefined, height: undefined, alignment: 'center' }
};

export default function AdminAdsPage() {
    const { data: _session } = useSession();

    const [config, setConfig] = useState<AdSenseConfig>({
        client_id: '',
        enabled: false,
        slots: defaultSlots,
        placements: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);

    const adPresets = [
        { label: 'Responsive', width: undefined, height: undefined },
        { label: 'Leaderboard (728x90)', width: 728, height: 90 },
        { label: 'Rectangle (300x250)', width: 300, height: 250 },
        { label: 'Large Rect (336x280)', width: 336, height: 280 },
        { label: 'Skyscraper (160x600)', width: 160, height: 600 },
        { label: 'Mobile Banner (320x50)', width: 320, height: 50 },
    ];

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/admin/settings?key=adsense');
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        const mergedSlots = { ...defaultSlots, ...(data.slots || {}) };
                        // Ensure all slots have default properties if missing
                        Object.keys(mergedSlots).forEach(key => {
                            if (!mergedSlots[key as keyof typeof mergedSlots].alignment) {
                                (mergedSlots as any)[key].alignment = 'center';
                            }
                        });

                        setConfig({
                            client_id: data.client_id || '',
                            enabled: data.enabled ?? false,
                            slots: mergedSlots,
                            placements: data.placements || []
                        });
                    } else {
                        setConfig({
                            client_id: '',
                            enabled: false,
                            slots: defaultSlots,
                            placements: []
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch AdSense config:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings?key=adsense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error('Failed to save AdSense config:', error);
        } finally {
            setSaving(false);
        }
    };

    const updateSlot = (slotKey: string, updates: any) => {
        if (!config) return;
        setConfig({
            ...config,
            slots: {
                ...config.slots,
                [slotKey]: { ...config.slots[slotKey], ...updates }
            }
        });
    };

    const addPlacement = () => {
        if (!config) return;
        const newPlacement: AdPlacement = {
            id: '',
            zone: 'blog_content',
            path_pattern: '*',
            enabled: false,
            alignment: 'center'
        };
        setConfig({
            ...config,
            placements: [...(config.placements || []), newPlacement]
        });
    };

    const updatePlacement = (index: number, updates: Partial<AdPlacement>) => {
        if (!config) return;
        const newPlacements = [...config.placements];
        newPlacements[index] = { ...newPlacements[index], ...updates };
        setConfig({ ...config, placements: newPlacements });
    };

    const removePlacement = (index: number) => {
        if (!config) return;
        const newPlacements = config.placements.filter((_, i) => i !== index);
        setConfig({ ...config, placements: newPlacements });
    };

    if (loading || !config) {
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
                                <Megaphone className="h-8 w-8 text-indigo-500" />
                                Ad Manager 2.0
                            </h2>
                            <p className="text-slate-500 mt-1">Visually manage your ad zones and placements</p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-11 px-6 shadow-lg shadow-indigo-500/20 rounded-xl"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                        </Button>
                    </div>

                    {/* Global Settings */}
                    <Card className="p-6 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm grid md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        Google AdSense
                                        <Badge variant={config?.enabled ? 'default' : 'secondary'} className="ml-2">
                                            {config?.enabled ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </h3>
                                    <p className="text-xs text-slate-500">Global activation and Client ID configuration.</p>
                                </div>
                                <Switch
                                    checked={config?.enabled || false}
                                    onCheckedChange={(val) => setConfig(prev => ({ ...prev, enabled: val }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Client ID</label>
                                <Input
                                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10"
                                    value={config?.client_id || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, client_id: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
                            <Info className="h-5 w-5 text-indigo-500 shrink-0" />
                            <div className="text-xs text-indigo-800 dark:text-indigo-300">
                                <p className="font-semibold">Professional Setup:</p>
                                <p className="mt-1 opacity-90 leading-relaxed">Zones highlighted in blue on the layout preview are active. Click any zone to edit its parameters.</p>
                            </div>
                        </div>
                    </Card>

                    {/* Settings Panel for direct editing */}
                    <Card className="p-8 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
                        <div className="mb-6 flex items-start gap-4 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                            <div className="bg-indigo-500 text-white rounded-lg p-2 shadow-md">
                                <Eye className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Live Ad Editing is Now Active</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    We&apos;ve upgraded our ad management system! You no longer need to use abstract layouts here.
                                    Simply open any page on your website and click the <strong>X-RAY</strong> button in the top navigation bar to edit ad slots directly in their natural context.
                                </p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 items-center">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Fallback Editor</h4>
                                <p className="text-sm text-slate-500">Select a zone below if you need to edit parameters manually.</p>
                                <select
                                    value={selectedZone || ''}
                                    onChange={(e) => setSelectedZone(e.target.value)}
                                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="" disabled>Select Ad Zone to edit</option>
                                    {Object.keys(config.slots).map(zone => (
                                        <option key={zone} value={zone}>{zone.replace('_', ' ').toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Floating Settings Panel */}
                        {selectedZone && (
                            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-indigo-500/30 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                        Settings: <span className="capitalize text-indigo-500">{selectedZone.replace('_', ' ')}</span>
                                    </h4>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedZone(null)}>Close</Button>
                                </div>

                                <div className="grid md:grid-cols-3 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                                            <span className="text-sm font-medium">Zone Enabled</span>
                                            <Switch
                                                checked={config.slots[selectedZone].enabled}
                                                onCheckedChange={(val) => updateSlot(selectedZone, { enabled: val })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Slot ID (Google)</label>
                                            <Input
                                                placeholder="1234567890"
                                                value={config.slots[selectedZone].id}
                                                onChange={(e) => updateSlot(selectedZone, { id: e.target.value })}
                                                className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Visual Alignment</label>
                                            <div className="grid grid-cols-3 gap-1">
                                                {['left', 'center', 'right'].map((align) => (
                                                    <Button
                                                        key={align}
                                                        variant={config.slots[selectedZone!].alignment === align ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="text-[10px] h-8 capitalize"
                                                        onClick={() => updateSlot(selectedZone!, { alignment: align })}
                                                    >
                                                        {align}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Width (px)</label>
                                                <Input
                                                    type="number"
                                                    placeholder="Auto"
                                                    value={config.slots[selectedZone].width || ''}
                                                    onChange={(e) => updateSlot(selectedZone!, { width: e.target.value ? parseInt(e.target.value) : undefined })}
                                                    className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Height (px)</label>
                                                <Input
                                                    type="number"
                                                    placeholder="Auto"
                                                    value={config.slots[selectedZone].height || ''}
                                                    onChange={(e) => updateSlot(selectedZone!, { height: e.target.value ? parseInt(e.target.value) : undefined })}
                                                    className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Placement Presets</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {adPresets.map((preset) => (
                                                <button
                                                    key={preset.label}
                                                    onClick={() => updateSlot(selectedZone!, { width: preset.width, height: preset.height })}
                                                    className="text-[9px] px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 transition-colors"
                                                >
                                                    {preset.label.split(' (')[0]}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[9px] text-slate-400 italic">Pre-set common dimensions for better click-through rate.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Additional Slots Grid (Desktop/Mobile Banner specific) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['homepage_hero', 'homepage_bottom'].map((key) => (
                            <Card key={key} onClick={() => setSelectedZone(key)} className={`p-4 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm cursor-pointer hover:border-indigo-500/50 transition-all ${selectedZone === key ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-xs capitalize">{key.replace('_', ' ')}</span>
                                    <Badge variant={config.slots[key]?.enabled ? 'default' : 'secondary'} className="text-[8px]">
                                        {config.slots[key]?.enabled ? 'Configured' : 'Inactive'}
                                    </Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                    {/* Dynamic Routing Rules */}
                    <Card className="p-8 border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-indigo-500" />
                                    Dynamic Routing Rules
                                </h3>
                                <p className="text-sm text-slate-500">Target specific pages or tabs with custom ad configurations.</p>
                            </div>
                            <Button
                                onClick={addPlacement}
                                variant="outline"
                                className="border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10 gap-2"
                            >
                                <Plus className="h-4 w-4" /> Add Rule
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {config.placements?.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                                    <p className="text-slate-400 text-sm italic">No dynamic rules defined. Standard zones will be used.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {config.placements.map((placement, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                            <div className="flex-1 grid md:grid-cols-4 gap-4 w-full">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Path Pattern</label>
                                                    <Input
                                                        placeholder="/blog/* or ?tab=ping"
                                                        value={placement.path_pattern}
                                                        onChange={(e) => updatePlacement(idx, { path_pattern: e.target.value })}
                                                        className="h-9 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Zone</label>
                                                    <select
                                                        value={placement.zone}
                                                        onChange={(e) => updatePlacement(idx, { zone: e.target.value })}
                                                        className="w-full h-9 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs px-2"
                                                    >
                                                        {Object.keys(defaultSlots).map(z => (
                                                            <option key={z} value={z}>{z.replace('_', ' ')}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ad Slot (Google)</label>
                                                    <Input
                                                        placeholder="AdSense ID"
                                                        value={placement.id}
                                                        onChange={(e) => updatePlacement(idx, { id: e.target.value })}
                                                        className="h-9 text-xs"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-4 pt-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium">Active</span>
                                                        <Switch
                                                            checked={placement.enabled}
                                                            onCheckedChange={(val) => updatePlacement(idx, { enabled: val })}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removePlacement(idx)}
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
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
                    </Card>
                </div>
            </div>
        </div>
    );
}
