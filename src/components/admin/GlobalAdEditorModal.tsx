'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Loader2, Save, LayoutTemplate, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function GlobalAdEditorModal() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const slotType = searchParams.get('edit_ad');

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any>(null);

    // Form state
    const [enabled, setEnabled] = useState(false);
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [alignment, setAlignment] = useState('center');

    useEffect(() => {
        if (slotType) {
            setIsOpen(true);
            fetchConfig();
        } else {
            setIsOpen(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slotType]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/adsense-config');
            if (res.ok) {
                const data = await res.json();
                setConfig(data);

                // load specific slot
                const slot = data.slots?.[slotType as string];
                if (slot) {
                    setEnabled(slot.enabled || false);
                    setWidth(slot.width?.toString() || '');
                    setHeight(slot.height?.toString() || '');
                    setAlignment(slot.alignment || 'center');
                } else {
                    // Initialize empty state for this slot if it doesn't exist
                    setEnabled(false);
                    setWidth('');
                    setHeight('');
                    setAlignment('center');
                }
            }
        } catch (error) {
            console.error('Failed to load ad config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('edit_ad');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSave = async () => {
        if (!config || !slotType) return;
        setSaving(true);

        const newConfig = { ...config };
        if (!newConfig.slots) newConfig.slots = {};

        // Ensure ID is generated for new slots
        const existingId = newConfig.slots[slotType]?.id;
        const generatedId = existingId || Math.floor(Math.random() * 10000000000).toString();

        newConfig.slots[slotType] = {
            id: generatedId,
            enabled,
            width: width ? parseInt(width) : null,
            height: height ? parseInt(height) : null,
            alignment
        };

        try {
            const res = await fetch('/api/admin/settings?key=adsense_config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });

            if (res.ok) {
                handleClose();
                // Refresh the page slightly to reflect new ad state correctly
                router.refresh();
                // Alternatively window.location.reload() for full refresh of adsbygoogle
                setTimeout(() => window.location.reload(), 500);
            }
        } catch (error) {
            console.error('Failed to save ad slot', error);
        } finally {
            setSaving(false);
        }
    };

    if (!slotType) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <LayoutTemplate className="h-5 w-5 text-indigo-500" />
                        Edit Slot
                    </DialogTitle>
                    <DialogDescription className="font-mono text-xs mt-1 text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded inline-block w-fit">
                        {slotType}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <div className="grid gap-6 py-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                            <div className="space-y-0.5">
                                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Enable Slot</label>
                                <p className="text-xs text-slate-500">Turn this specific ad block on or off.</p>
                            </div>
                            <Switch checked={enabled} onCheckedChange={setEnabled} />
                        </div>

                        {!enabled && (
                            <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-500 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="text-xs leading-relaxed">
                                    When disabled, this ad slot will remain invisible to regular users, but you can still preview it in X-Ray mode.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Width (px)</label>
                                <Input
                                    placeholder="Auto (Responsive)"
                                    className="bg-slate-50 dark:bg-black/20"
                                    value={width}
                                    onChange={(e) => setWidth(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Height (px)</label>
                                <Input
                                    placeholder="Auto"
                                    className="bg-slate-50 dark:bg-black/20"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Alignment</label>
                            <Select value={alignment} onValueChange={setAlignment}>
                                <SelectTrigger className="bg-slate-50 dark:bg-black/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="center">Center (Recommended)</SelectItem>
                                    <SelectItem value="left">Left</SelectItem>
                                    <SelectItem value="right">Right</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-between gap-3 sm:gap-0 border-t border-slate-100 dark:border-white/5 pt-4">
                    <Button variant="ghost" onClick={handleClose} disabled={saving} className="rounded-xl">Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || loading} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 rounded-xl gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Slot
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
