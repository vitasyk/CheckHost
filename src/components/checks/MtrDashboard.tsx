import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Network, ArrowRight, Camera, Copy, Check, FileText, Loader2, Activity } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { MtrHop } from '@/types/checkhost';

interface MtrDashboardProps {
    result: any;
    nodeCity?: string;
    onPingIp?: (ip: string) => void;
    targetHost?: string;
}

export function MtrDashboard({ result, nodeCity, onPingIp, targetHost }: MtrDashboardProps) {
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [screenshotCopied, setScreenshotCopied] = useState(false);
    const [textCopied, setTextCopied] = useState(false);

    const captureOptions = {
        pixelRatio: 2,
        cacheBust: true,
        filter: (node: HTMLElement) => !node.classList?.contains('screenshot-hide')
    };

    const processMtrData = (rawResult: any): MtrHop[] => {
        if (!rawResult) return [];

        // Handle [null, {message: "..."}] error format
        if (Array.isArray(rawResult) && rawResult.length > 1 && rawResult[0] === null && typeof rawResult[1] === 'object' && rawResult[1] !== null && 'message' in rawResult[1]) {
            return [{
                host: (rawResult[1] as any).message || 'Error',
                ip: '',
                loss: 100,
                sent: 0,
                last: 0,
                avg: 0,
                best: 0,
                worst: 0,
                stdev: 0
            }];
        }

        if (!Array.isArray(rawResult)) return [];

        const extractHops = (data: any, depth = 0): any[] | null => {
            if (!Array.isArray(data) || data.length === 0) return null;
            if (depth > 5) return null;

            for (const item of data) {
                if (Array.isArray(item)) {
                    if (item.length > 0) {
                        const first = item[0];
                        const isProbe = (v: any) => v === null || (typeof v === 'object' && !Array.isArray(v));
                        if (isProbe(first)) return data;
                        const deeper = extractHops(item, depth + 1);
                        if (deeper) return deeper;
                    } else if (data.length > 1) {
                        continue;
                    }
                }
            }
            return null;
        };

        let rawHops = extractHops(rawResult);
        if (!rawHops && rawResult.length > 0 && Array.isArray(rawResult[0])) {
            rawHops = rawResult;
        }

        if (!Array.isArray(rawHops)) return [];

        return rawHops.map((hopProbes: any) => {
            if (!Array.isArray(hopProbes)) return null;

            let allTimes: number[] = [];
            let totalSent = 0;
            let totalLoss = 0;
            let lastHost = '???';
            let lastIp = '';

            const processProbe = (probe: any) => {
                if (probe === null || probe === undefined) {
                    totalSent++;
                    totalLoss++;
                    return;
                }

                if (typeof probe === 'object') {
                    if (probe.host) {
                        lastHost = probe.host;
                        lastIp = probe.host;
                    }

                    if (Array.isArray(probe.query_times)) {
                        probe.query_times.forEach((t: any) => {
                            totalSent++;
                            if (t === null || t === undefined || t === "-") {
                                totalLoss++;
                            } else {
                                const timeVal = parseFloat(t);
                                if (!isNaN(timeVal)) {
                                    allTimes.push(timeVal);
                                } else {
                                    totalLoss++;
                                }
                            }
                        });
                    }
                }
            };

            hopProbes.forEach((p: any) => {
                if (Array.isArray(p)) p.forEach(processProbe);
                else processProbe(p);
            });

            if (totalSent === 0 && lastHost === '???') {
                if (hopProbes.length > 0) {
                    return {
                        host: '???',
                        ip: '',
                        loss: 100,
                        sent: 0,
                        last: 0,
                        avg: 0,
                        best: 0,
                        worst: 0,
                        stdev: 0
                    } as MtrHop;
                }
                return null;
            }

            const avg = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
            const best = allTimes.length > 0 ? Math.min(...allTimes) : 0;
            const worst = allTimes.length > 0 ? Math.max(...allTimes) : 0;
            const last = allTimes.length > 0 ? allTimes[allTimes.length - 1] : 0;

            return {
                host: lastHost,
                ip: lastIp,
                loss: totalSent > 0 ? (totalLoss / totalSent) * 100 : 0,
                sent: totalSent,
                last,
                avg,
                best,
                worst,
                stdev: 0
            } as MtrHop;
        }).filter(h => h !== null) as MtrHop[];
    };

    const hops = processMtrData(result);

    const handleScreenshot = async () => {
        if (dashboardRef.current) {
            try {
                const dataUrl = await toPng(dashboardRef.current, captureOptions);
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `mtr-${targetHost || 'trace'}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (err) {
                console.error('Screenshot failed:', err);
            }
        }
    };

    const handleCopyToClipboard = async () => {
        if (dashboardRef.current) {
            try {
                const blob = await toBlob(dashboardRef.current, captureOptions);
                if (blob) {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    setScreenshotCopied(true);
                    setTimeout(() => setScreenshotCopied(false), 2000);
                }
            } catch (err) {
                console.error('Copy to clipboard failed:', err);
            }
        }
    };

    const handleCopyText = async () => {
        let text = `MTR Report for ${targetHost || 'Unknown'}\n`;
        text += `Node: ${nodeCity || 'Remote'}\n`;
        text += `Generated: ${new Date().toLocaleString()}\n\n`;
        text += `Hop | Host/IP | Loss% | Last | Avg | Best | Worst\n`;
        text += `--- | --- | --- | --- | --- | --- | ---\n`;

        hops.forEach((h, i) => {
            text += `${i + 1} | ${h.host} | ${h.loss.toFixed(1)}% | ${h.last.toFixed(1)} | ${h.avg.toFixed(1)} | ${h.best.toFixed(1)} | ${h.worst.toFixed(1)}\n`;
        });

        try {
            await navigator.clipboard.writeText(text);
            setTextCopied(true);
            setTimeout(() => setTextCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    if (hops.length === 0) {
        return (
            <div className="p-8 text-center text-sm text-muted-foreground bg-slate-50/50 dark:bg-slate-900/30 rounded-lg border border-slate-200/50 dark:border-white/5 my-2 flex flex-col items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                <span className="font-medium">Collecting traceroute data...</span>
            </div>
        );
    }

    const maxLoss = Math.max(...hops.map(h => h.loss));

    return (
        <div className="mt-8">
            {/* Content area with hover buttons - Framework pattern */}
            <div ref={dashboardRef} className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-white/5 relative group/screenshot pb-1">
                {/* Hover-reveal floating action buttons */}
                <div className="screenshot-hide absolute top-0 right-3 z-10 flex items-center opacity-0 group-hover/screenshot:opacity-100 transition-all duration-300">
                    <button
                        onClick={handleCopyText}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-l-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 text-[10px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/90 dark:hover:bg-indigo-900/30 transition-all duration-200 shadow-sm cursor-pointer"
                    >
                        {textCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <FileText className="h-3 w-3" />}
                        <span>{textCopied ? 'Copied' : 'Copy TXT'}</span>
                    </button>
                    <button
                        onClick={handleCopyToClipboard}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-l-0 border-slate-200/80 dark:border-white/10 text-[10px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/90 dark:hover:bg-indigo-900/30 transition-all duration-200 shadow-sm cursor-pointer"
                    >
                        {screenshotCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        <span>{screenshotCopied ? 'Copied Img' : 'Copy Img'}</span>
                    </button>
                    <button
                        onClick={handleScreenshot}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-r-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-l-0 border-slate-200/80 dark:border-white/10 text-[10px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/90 dark:hover:bg-indigo-900/30 transition-all duration-200 shadow-sm cursor-pointer"
                    >
                        <Camera className="h-3 w-3" />
                        <span>Save</span>
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-[calc(1rem-1px)] shadow-sm overflow-hidden p-4 mx-1 mt-1">
                    <div className="mb-4 flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <Network className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 leading-none">
                                    Traceroute <ArrowRight className="h-3 w-3 opacity-50" /> {targetHost}
                                </h4>
                                <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-none uppercase tracking-wider">
                                    FROM {nodeCity || 'Remote Node'} • {new Date().toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow className="h-8 hover:bg-transparent border-0 bg-slate-50/50 dark:bg-slate-950/30">
                                <TableHead className="h-8 text-[10px] uppercase font-bold w-12 text-center">Hop</TableHead>
                                <TableHead className="h-8 text-[10px] uppercase font-bold">Host / IP</TableHead>
                                <TableHead className="h-8 text-[10px] uppercase font-bold text-center w-24">Loss %</TableHead>
                                <TableHead className="h-8 text-[10px] uppercase font-bold text-right w-16">Last</TableHead>
                                <TableHead className="h-8 text-[10px] uppercase font-bold text-right w-16">Avg</TableHead>
                                <TableHead className="h-8 text-[10px] uppercase font-bold text-right w-16">Best</TableHead>
                                <TableHead className="h-8 text-[10px] uppercase font-bold text-right w-16">Worst</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {hops.map((hop: MtrHop, i: number) => (
                                <TableRow key={i} className="h-8 hover:bg-slate-100/50 dark:hover:bg-white/[0.02] border-0 transition-colors">
                                    <TableCell className="py-1 text-xs font-mono text-muted-foreground text-center">{i + 1}</TableCell>
                                    <TableCell className="py-1 text-xs font-mono">
                                        <div className="flex flex-col">
                                            <span
                                                className={cn(
                                                    "font-medium text-slate-700 dark:text-slate-200 transition-colors",
                                                    onPingIp && "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                                                )}
                                                onClick={(e) => {
                                                    if (onPingIp && hop.ip) {
                                                        e.stopPropagation();
                                                        onPingIp(hop.ip);
                                                    }
                                                }}
                                            >
                                                {hop.host || '???'}
                                            </span>
                                            {hop.ip && hop.ip !== hop.host && (
                                                <span
                                                    className={cn(
                                                        "text-[10px] text-muted-foreground transition-colors",
                                                        onPingIp && "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                                                    )}
                                                    onClick={(e) => {
                                                        if (onPingIp) {
                                                            e.stopPropagation();
                                                            onPingIp(hop.ip);
                                                        }
                                                    }}
                                                >
                                                    {hop.ip}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-1 text-xs text-center">
                                        <Badge
                                            variant={hop.loss > 0 ? (hop.loss > 20 ? "error" : "warning") : "success"}
                                            className="h-5 px-1.5 text-[10px] min-w-[45px] justify-center"
                                        >
                                            {hop.loss.toFixed(1)}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-1 text-xs text-right font-mono text-slate-600 dark:text-slate-400">
                                        {hop.last.toFixed(1)}
                                    </TableCell>
                                    <TableCell className="py-1 text-xs text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                        {hop.avg.toFixed(1)}
                                    </TableCell>
                                    <TableCell className="py-1 text-xs text-right font-mono text-muted-foreground opacity-70">
                                        {hop.best.toFixed(1)}
                                    </TableCell>
                                    <TableCell className="py-1 text-xs text-right font-mono text-muted-foreground opacity-70">
                                        {hop.worst.toFixed(1)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 font-medium italic">
                            * Latency values are in milliseconds (ms)
                        </p>
                        <div className="flex items-center gap-3 opacity-50">
                            <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                                <Check className="h-3 w-3" /> Professional Reporting
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
