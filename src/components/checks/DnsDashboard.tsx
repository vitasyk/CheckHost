import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Globe, Mail, Server, Key, Clock, Copy, Check, Camera, FileText, AlertTriangle, Loader2, Layers } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { Button } from '@/components/ui/button';

interface DnsRecord {
    type: string;
    value: string;
    ttl?: number;
    priority?: number;
    auxiliary?: string;
}

interface DnsLookupResult {
    domain: string;
    ip: string | null;
    ipInfo?: any;
    records: DnsRecord[];
    timestamp: number;
    status?: 'success' | 'failed';
    error?: string;
}

interface DnsDashboardProps {
    result: any;
    nodeCity?: string;
    filterType?: string;
    onFilterTypeChange?: (type: string) => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function DnsDashboard({ result, nodeCity, filterType = 'all', onFilterTypeChange, onRefresh, isRefreshing }: DnsDashboardProps) {
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [screenshotCopied, setScreenshotCopied] = useState(false);
    const [textCopied, setTextCopied] = useState(false);

    const captureOptions = {
        pixelRatio: 2,
        cacheBust: true,
        filter: (node: HTMLElement) => !node.classList?.contains('screenshot-hide')
    };

    const handleScreenshot = async () => {
        if (dashboardRef.current) {
            try {
                const dataUrl = await toPng(dashboardRef.current, captureOptions);
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `${data?.domain || 'dns'}-records.png`;
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
        if (!data) return;

        let text = `DNS Records for ${data.domain}${data.ip ? ` (${data.ip})` : ''}\n`;
        text += `Generated: ${new Date(data.timestamp).toLocaleString()}\n`;
        if (filterType !== 'all') {
            text += `Filter: ${filterType}\n`;
        }
        text += '\n';

        if (records.length > 0) {
            // Define sections to match the UI grouping
            const spfRecords = records.filter(r => r.type === 'TXT' && r.value.includes('v=spf1'));
            const dmarcRecords = records.filter(r => r.type === 'TXT' && (r.value.includes('v=DMARC1') || r.auxiliary === '_dmarc.@'));
            const dkimRecords = records.filter(r => r.type === 'TXT' && (r.value.includes('v=DKIM1') || r.auxiliary?.includes('_domainkey')));

            // Helper to check if a TXT record is already categorized
            const isSpecialTxt = (r: DnsRecord) => spfRecords.includes(r) || dmarcRecords.includes(r) || dkimRecords.includes(r);

            const sections = [
                {
                    name: 'Resolution',
                    items: records.filter(r => ['A', 'AAAA', 'CNAME'].includes(r.type))
                },
                {
                    name: 'Email Configuration',
                    items: [
                        ...records.filter(r => r.type === 'MX'),
                        ...spfRecords,
                        ...dmarcRecords,
                        ...dkimRecords
                    ]
                },
                {
                    name: 'Authority',
                    items: records.filter(r => ['NS', 'SOA'].includes(r.type))
                },
                {
                    name: 'Verification & Other',
                    items: [
                        ...records.filter(r => r.type === 'PTR'),
                        ...records.filter(r => r.type === 'TXT' && !isSpecialTxt(r))
                    ]
                }
            ];

            sections.forEach(section => {
                if (section.items.length > 0) {
                    text += `--- ${section.name} ---\n`;
                    section.items.forEach(r => {
                        // Format: [TYPE] [Auxiliary : ] Value (Priority: X) (TTL: Y)
                        let line = `[${r.type}] `;

                        // Add auxiliary (subdomain/selector) if present
                        if (r.auxiliary && r.auxiliary !== '@') {
                            line += `${r.auxiliary} : `;
                        }

                        line += r.value;

                        if (r.priority !== undefined) line += ` (Priority: ${r.priority})`;
                        if (r.ttl !== undefined) line += ` (TTL: ${r.ttl})`;

                        text += line + '\n';
                    });
                    text += '\n';
                }
            });
        } else {
            text += "No records found.\n";
        }

        try {
            await navigator.clipboard.writeText(text);
            setTextCopied(true);
            setTimeout(() => setTextCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    // Extract the DNS lookup result
    const data: DnsLookupResult | null = (() => {
        if (!result) return null;
        // Direct DNS lookup format: { domain, ip, records, timestamp }
        if (result.records && Array.isArray(result.records)) return result;
        return null;
    })();

    // Unified Empty State for Not Found / Refused DNS
    if (!data || !data.records || data.records.length === 0 || data.status === 'failed') {
        return (
            <div ref={dashboardRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 dark:bg-slate-900 rounded-2xl p-1 border border-slate-200/60 dark:border-white/5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-sm">
                    <div className="max-w-md mx-auto space-y-6">
                        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                            <Globe className="h-12 w-12 text-indigo-500" />
                            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-50 dark:border-indigo-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                No DNS Records Found
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                We couldn&apos;t find any public DNS records for <span className="text-indigo-600 dark:text-indigo-400 font-bold">{data?.domain || 'this host'}</span>.
                                This domain might be newly registered, private, or non-existent.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-left">
                            <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 flex items-start gap-4">
                                <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-sm">
                                    <Clock className="h-4 w-4 text-amber-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Propagation delay</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        If you recently updated DNS settings, it may take up to 48 hours to propagate globally.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest bg-slate-100/50 dark:bg-white/5">
                                Status: Unresolved
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Filter records based on selected type
    const records = filterType === 'all'
        ? data.records
        : data.records.filter(r => r.type.toUpperCase() === filterType.toUpperCase());



    // Group records by category
    const aRecords = records.filter(r => r.type === 'A');
    const aaaaRecords = records.filter(r => r.type === 'AAAA');
    const cnameRecords = records.filter(r => r.type === 'CNAME');
    const mxRecords = records.filter(r => r.type === 'MX');
    const nsRecords = records.filter(r => r.type === 'NS');
    const soaRecords = records.filter(r => r.type === 'SOA');

    // Split TXT records into categories
    const spfRecords = records.filter(r => r.type === 'TXT' && r.value.includes('v=spf1'));
    const dmarcRecords = records.filter(r => r.type === 'TXT' && (r.value.includes('v=DMARC1') || r.auxiliary === '_dmarc.@'));
    const dkimRecords = records.filter(r => r.type === 'TXT' && (r.value.includes('v=DKIM1') || r.auxiliary?.includes('_domainkey')));

    const otherTxtRecords = records.filter(r =>
        r.type === 'TXT' &&
        !spfRecords.includes(r) &&
        !dmarcRecords.includes(r) &&
        !dkimRecords.includes(r)
    );
    const ptrRecords = records.filter(r => r.type === 'PTR');

    const hasResolution = aRecords.length > 0 || aaaaRecords.length > 0 || cnameRecords.length > 0;
    const hasEmail = mxRecords.length > 0 || spfRecords.length > 0 || dmarcRecords.length > 0 || dkimRecords.length > 0;
    const hasAuthority = nsRecords.length > 0 || soaRecords.length > 0;
    const hasVerification = otherTxtRecords.length > 0 || ptrRecords.length > 0;

    // Count by type for stats
    const typeCounts: Record<string, number> = {};
    records.forEach(r => {
        typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });

    // Section component
    const Section = ({ icon, title, subtitle, children, variant = 'default' }: {
        icon: React.ReactNode;
        title: string;
        subtitle?: string;
        children: React.ReactNode;
        variant?: 'default' | 'email' | 'authority' | 'verification';
    }) => {
        const accentColors = {
            default: 'bg-indigo-500',
            email: 'bg-amber-500',
            authority: 'bg-emerald-500',
            verification: 'bg-purple-500',
        };

        const iconColors = {
            default: 'text-indigo-600 dark:text-indigo-400',
            email: 'text-amber-600 dark:text-amber-400',
            authority: 'text-emerald-600 dark:text-emerald-400',
            verification: 'text-purple-600 dark:text-purple-400',
        };

        const iconBgColors = {
            default: 'bg-white dark:bg-slate-900',
            email: 'bg-white dark:bg-slate-900',
            authority: 'bg-white dark:bg-slate-900',
            verification: 'bg-white dark:bg-slate-900',
        };

        return (
            <div className="group/section relative pl-10 pb-2">
                {/* Elegant thin vertical accent line */}
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-[2px] rounded-full transition-all duration-300 opacity-60 group-hover/section:opacity-100",
                    accentColors[variant]
                )} />

                <div className="space-y-5">
                    <div className="flex items-center gap-3.5">
                        <div className={cn(
                            "p-2.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm shrink-0",
                            iconBgColors[variant],
                            iconColors[variant]
                        )}>
                            {icon}
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-[13px] font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase leading-none mb-1.5">{title}</h4>
                            {subtitle && <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.1em]">{subtitle}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    // Record row component
    const RecordRow = ({ record }: { record: DnsRecord }) => {
        const isSubdomainRecord = record.auxiliary && record.auxiliary.includes('@');

        return (
            <div className="flex items-center gap-4 py-2 px-4 rounded-xl bg-slate-100/40 dark:bg-white/5 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all duration-500 group/row cursor-default">
                <Badge variant="secondary" className="font-black text-[10px] min-w-[52px] h-6 justify-center shrink-0 rounded-full bg-white dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/10 shadow-sm">
                    {record.type}
                </Badge>
                <div className="flex-1 min-w-0">
                    {isSubdomainRecord && (
                        <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400 mr-2 shrink-0">
                            {record.auxiliary} :
                        </span>
                    )}
                    <span className="font-mono text-[11px] break-all text-slate-800 dark:text-slate-100 leading-relaxed tracking-tight">
                        {record.value}
                    </span>
                    {(record.auxiliary && !isSubdomainRecord) && (
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{record.auxiliary}</div>
                    )}
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    {record.priority !== undefined && (
                        <Badge className="bg-amber-100/40 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200/30 dark:border-amber-900/20 text-[10px] font-bold h-5 px-2 rounded-full">
                            PRI: {record.priority}
                        </Badge>
                    )}
                    {record.ttl !== undefined && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold bg-white/50 dark:bg-white/5 px-2.5 py-1 rounded-full border border-slate-100 dark:border-white/5">
                            <Clock className="h-3 w-3" />
                            <span className="font-mono">{record.ttl}s</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // SPF visual parser
    const SpfRow = ({ record }: { record: DnsRecord }) => {
        const parts = record.value.split(' ').filter(Boolean);
        return (
            <div className="py-3 px-4 rounded-xl bg-slate-100/30 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-all duration-500 cursor-default">
                <div className="flex items-center gap-3 mb-2.5">
                    <Badge variant="secondary" className="font-black text-[10px] min-w-[52px] h-6 justify-center rounded-full bg-white dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/10 shadow-sm">
                        SPF
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Sender Policy Framework</span>
                </div>
                <div className="sm:ml-[65px] font-mono text-[12px] leading-relaxed break-all">
                    {parts.map((part, i) => {
                        let textColor = 'text-slate-600 dark:text-slate-400';
                        if (part.startsWith('include:')) textColor = 'text-blue-600 dark:text-blue-400';
                        else if (part.startsWith('ip4:') || part.startsWith('ip6:')) textColor = 'text-emerald-600 dark:text-emerald-400';
                        else if (part === '~all' || part === '-all') textColor = 'text-rose-600 dark:text-rose-400';
                        else if (part === 'mx' || part === 'a') textColor = 'text-amber-600 dark:text-amber-400';
                        else if (part === 'v=spf1') textColor = 'text-indigo-600 dark:text-indigo-500 font-black';

                        return (
                            <span key={i} className={textColor}>
                                {part}{i < parts.length - 1 ? ' ' : ''}
                            </span>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div ref={dashboardRef} className="bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl relative group/screenshot pb-1 mt-8">
            {/* Hover-reveal floating action buttons */}
            <div className="screenshot-hide absolute top-0 right-3 z-10 flex items-center opacity-0 group-hover/screenshot:opacity-100 transition-all duration-300">
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-l-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 text-[10px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/90 dark:hover:bg-indigo-900/30 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        <Loader2 className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
                        <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                )}
                <button
                    onClick={handleCopyText}
                    className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 text-[10px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/90 dark:hover:bg-indigo-900/30 transition-all duration-200 shadow-sm cursor-pointer",
                        !onRefresh ? "rounded-l-lg" : "border-l-0"
                    )}
                >
                    {textCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <FileText className="h-3 w-3" />}
                    <span>{textCopied ? 'Copied TXT' : 'Copy TXT'}</span>
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
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-950 overflow-hidden shadow-sm mx-1 mt-1 flex flex-col">
                <div className="h-1.5 w-full bg-emerald-500" />
                {/* Summary Header - Balanced Professional Look */}
                <div className="bg-slate-100/50 dark:bg-slate-950/30 border-b border-slate-200 dark:border-white/5 px-6 py-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-400/5 blur-3xl -mr-20 -mt-20 rounded-full" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl shadow-md border border-slate-200 dark:border-white/5">
                                <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100">
                                    {data.domain ? `DNS Records — ${data.domain}` : 'DNS Records'}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                    {data.ip && (
                                        <span className="text-slate-600 dark:text-slate-400 text-xs font-mono bg-slate-200/50 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200/50 dark:border-transparent flex items-center gap-1.5">
                                            {data.ip}
                                            {data.ipInfo?.providers?.ipapi?.countryCode && (
                                                <span className="opacity-80 grayscale-[0.3]">
                                                    {(() => {
                                                        const code = data.ipInfo.providers.ipapi.countryCode;
                                                        const codePoints = code.toUpperCase().split('').map((char: string) => 127397 + char.charCodeAt(0));
                                                        return String.fromCodePoint(...codePoints);
                                                    })()}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                    {(() => {
                                        const providers = data.ipInfo?.providers || {};
                                        const isp = providers.ipapi?.isp ||
                                            providers.ipinfo?.as_name ||
                                            providers.ipgeolocation?.isp ||
                                            providers.maxmind?.org ||
                                            providers.maxmind_local?.org;

                                        if (!isp || isp === 'N/A') return null;

                                        return (
                                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold border border-indigo-100 dark:border-indigo-800/30">
                                                Hosted by: {isp}
                                            </span>
                                        );
                                    })()}
                                    <span className="text-[10px] text-slate-500 dark:text-muted-foreground uppercase tracking-widest font-bold">
                                        {data.records.length} total records
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick stats - Interactive Smart Pills */}
                    <div className="flex flex-wrap gap-2 mt-5 relative z-10">
                        <button
                            onClick={() => onFilterTypeChange?.('all')}
                            className={cn(
                                "border rounded-full px-3 py-1 flex items-center gap-2 transition-all duration-300 shadow-sm",
                                filterType === 'all'
                                    ? "bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20"
                                    : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/10"
                            )}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">ALL</span>
                            <span className={cn(
                                "text-xs font-bold",
                                filterType === 'all' ? "text-white/90" : "text-indigo-600 dark:text-indigo-400"
                            )}>{data.records.length}</span>
                        </button>

                        {Object.entries(typeCounts).map(([type, count]) => (
                            <button
                                key={type}
                                onClick={() => onFilterTypeChange?.(type)}
                                className={cn(
                                    "border rounded-full px-3 py-1 flex items-center gap-2 transition-all duration-300 shadow-sm",
                                    filterType.toUpperCase() === type.toUpperCase()
                                        ? "bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20"
                                        : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/10"
                                )}
                            >
                                <span className="text-[10px] font-bold uppercase tracking-tighter">{type}</span>
                                <span className={cn(
                                    "text-xs font-bold",
                                    filterType.toUpperCase() === type.toUpperCase() ? "text-white/90" : "text-indigo-600 dark:text-indigo-400"
                                )}>{count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mx-1 mt-2.5">
                {/* Sections wrapped in their own Card */}
                <Card className="overflow-hidden border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative group p-6 space-y-8">
                    {/* Resolution Section */}
                    {hasResolution && (
                        <Section
                            icon={<Globe className="h-4 w-4" />}
                            title="Resolution"
                            subtitle="IP addresses this domain resolves to"
                            variant="default"
                        >
                            {aRecords.map((r, i) => <RecordRow key={`a-${i}`} record={r} />)}
                            {aaaaRecords.map((r, i) => <RecordRow key={`aaaa-${i}`} record={r} />)}
                            {cnameRecords.map((r, i) => <RecordRow key={`cname-${i}`} record={r} />)}
                        </Section>
                    )}

                    {/* Email Section */}
                    {hasEmail && (
                        <Section
                            icon={<Mail className="h-4 w-4" />}
                            title="Email Configuration"
                            subtitle="Mail servers and email security policies"
                            variant="email"
                        >
                            {mxRecords.map((r, i) => <RecordRow key={`mx-${i}`} record={r} />)}
                            {spfRecords.map((r, i) => <SpfRow key={`spf-${i}`} record={r} />)}
                            {dmarcRecords.map((r, i) => <RecordRow key={`dmarc-${i}`} record={r} />)}
                            {dkimRecords.map((r, i) => <RecordRow key={`dkim-${i}`} record={r} />)}
                        </Section>
                    )}

                    {/* Authority Section */}
                    {hasAuthority && (
                        <Section
                            icon={<Server className="h-4 w-4" />}
                            title="Authority"
                            subtitle="Nameservers and SOA records"
                            variant="authority"
                        >
                            {nsRecords.map((r, i) => <RecordRow key={`ns-${i}`} record={r} />)}
                            {soaRecords.map((r, i) => <RecordRow key={`soa-${i}`} record={r} />)}
                        </Section>
                    )}

                    {/* Verification & Other TXT */}
                    {hasVerification && (
                        <Section
                            icon={<Key className="h-4 w-4" />}
                            title="Verification & Other"
                            subtitle="Domain verification tokens and other records"
                            variant="verification"
                        >
                            {ptrRecords.map((r, i) => <RecordRow key={`ptr-${i}`} record={r} />)}
                            {otherTxtRecords.map((r, i) => <RecordRow key={`txt-${i}`} record={r} />)}
                        </Section>
                    )}

                    {/* Empty state */}
                    {!hasResolution && !hasEmail && !hasAuthority && !hasVerification && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No DNS records found for this domain.
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
