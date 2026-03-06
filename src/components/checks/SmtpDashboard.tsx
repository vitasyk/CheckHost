import React, { useState } from 'react';
import { SmtpAggregatedResult } from '@/types/checkhost';
import {
    Loader2, Shield, ShieldAlert, CheckCircle2, AlertTriangle, XCircle,
    Server, Network, Globe, Lock, Unlock, MailWarning, Map as MapIcon,
    Copy, Check, Link, RefreshCw, ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface SmtpDashboardProps {
    data: SmtpAggregatedResult | null;
    isLoading: boolean;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    host?: string;
    port?: number;
    isSharedView?: boolean;
    onViewTcpDetails?: () => void;
}

export function SmtpDashboard({ data, isLoading, onRefresh, isRefreshing, host, port, isSharedView = false, onViewTcpDetails }: SmtpDashboardProps) {
    const t = useTranslations('SmtpDashboard');
    const [ipCopied, setIpCopied] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setIpCopied(true);
            setTimeout(() => setIpCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleShare = async () => {
        if (isSharing || !data || !host) return;
        setIsSharing(true);
        try {
            const res = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'smtp',
                    host: host,
                    results: data,
                    checkNodes: {},
                    metadata: {
                        timestamp: new Date().toISOString(),
                        port: port ?? 25
                    }
                })
            });

            if (!res.ok) throw new Error('Failed to create share link');

            const shareData = await res.json();
            const fullUrl = `${window.location.origin}/share/${shareData.id}`;

            await navigator.clipboard.writeText(fullUrl);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 3000);
        } catch (err) {
            console.error('Sharing failed:', err);
        } finally {
            setIsSharing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="mt-8 space-y-6 animate-pulse">
                {/* Skeleton Verdict Bar */}
                <div className="h-20 w-full rounded-2xl bg-slate-200 dark:bg-slate-800/80" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Skeleton Identity Card */}
                    <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800/80" />
                    {/* Skeleton Endpoint Card */}
                    <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800/80" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800/80" />
                    <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800/80" />
                </div>
            </div>
        );
    }

    if (!data) return null;


    const { audit } = data;

    // Evaluate conditions for Verdicts
    const isHandshakeOk = !!data.banner;
    const isSpfPass = audit.spf.status === 'pass';
    const isDmarcPass = audit.dmarc.status === 'pass';
    const isTrustHigh = isSpfPass && isDmarcPass;
    const isTrustPartial = isSpfPass || isDmarcPass;
    const hasRblListings = Object.values(audit.rbl).includes('LISTED');

    return (
        <div className="mt-8 space-y-6 relative group/smtpresult">

            {/* Floating action bar — hover reveal */}
            {!isSharedView && (
                <div className="absolute top-0 right-0 z-10 flex items-center opacity-0 group-hover/smtpresult:opacity-100 transition-all duration-300">
                    <div className="flex bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-lg shadow-md overflow-hidden">
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 cursor-pointer disabled:opacity-50 border-r border-slate-200/80 dark:border-white/10"
                            >
                                <Loader2 className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
                                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                            </button>
                        )}
                        {host && data && (
                            <button
                                onClick={handleShare}
                                disabled={isSharing}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 cursor-pointer disabled:opacity-50"
                            >
                                {shareCopied ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                ) : isSharing ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                                ) : (
                                    <Link className="h-3 w-3" />
                                )}
                                <span>{shareCopied ? 'Link Copied' : 'Copy Link'}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Verdict Bar */}
            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur rounded-2xl border border-slate-200/80 dark:border-white/5 overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex-1 p-4 flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", isHandshakeOk ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400")}>
                        {isHandshakeOk ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    </div>
                    <div>
                        <p className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">Handshake</p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                            {isHandshakeOk ? 'Verified' : 'Incomplete'}
                        </p>
                    </div>
                </div>

                <div className="flex-1 p-4 flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl",
                        isTrustHigh && !hasRblListings ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" :
                            (hasRblListings ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400" : "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400")
                    )}>
                        {isTrustHigh && !hasRblListings ? <Shield className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                    </div>
                    <div>
                        <p className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">Trust Level</p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                            {hasRblListings ? 'Blacklisted' : (isTrustHigh ? 'High (SPF+DMARC)' : (isTrustPartial ? 'Partial' : 'Low'))}
                        </p>
                    </div>
                </div>

                <div className="flex-1 p-4 flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400")}>
                        <Globe className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">Reachability</p>
                        <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
                            Global
                            <span className="text-slate-400 dark:text-slate-500 font-normal"> · TCP</span>
                        </span>
                        <button
                            onClick={() => {
                                if (onViewTcpDetails) {
                                    onViewTcpDetails();
                                }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mt-0.5 w-fit"
                        >
                            TCP Details <ExternalLink className="h-2.5 w-2.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Server Identity & Endpoint */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/80 dark:border-white/5 shadow-sm transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-2 mb-4">
                        <Server className="h-5 w-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white">Server Identity</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">SMTP Banner (220)</p>
                            {data.banner ? (
                                <p className="text-sm font-medium font-mono mt-1 text-slate-900 dark:text-white break-all bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">{data.banner}</p>
                            ) : (
                                <p className="text-sm text-slate-500 italic mt-1 bg-slate-50 dark:bg-slate-900/50 p-2 border border-dashed rounded-lg">No banner captured</p>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Encryption (STARTTLS)</span>
                            {data.starttls ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 flex gap-1 items-center">
                                    <Lock className="h-3 w-3" /> Supported
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 flex gap-1 items-center">
                                    <Unlock className="h-3 w-3" /> Not Detected
                                </Badge>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/80 dark:border-white/5 shadow-sm transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-2 mb-4">
                        <Network className="h-5 w-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white">Connection Endpoint</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-1">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Resolved Target</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]" title={data.resolvedHost}>{data.resolvedHost}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Port</span>
                            <Badge variant="outline">{data.port}</Badge>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-sm text-slate-500 dark:text-slate-400">IP Address</span>
                            {data.ip ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{data.ip}</span>
                                    <button
                                        onClick={() => copyToClipboard(data.ip!)}
                                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-colors"
                                        title="Copy IP"
                                    >
                                        {ipCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            ) : (
                                <span className="text-sm text-slate-500">Unresolved</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Network (ASN)</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{data.asn || 'Unknown'}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Audit Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/80 dark:border-white/5 shadow-sm transition-all duration-200 hover:shadow-md h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white">Security & Delivery</h3>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">SPF (Sender Policy)</span>
                                {audit.spf.status === 'pass' && <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Valid</Badge>}
                                {audit.spf.status === 'fail' && <Badge variant="error">Invalid</Badge>}
                                {audit.spf.status === 'none' && <Badge variant="outline" className="text-slate-500">Missing</Badge>}
                            </div>
                            {audit.spf.record ? (
                                <p className="text-xs font-mono break-all text-slate-600 dark:text-slate-400">{audit.spf.record}</p>
                            ) : (
                                <p className="text-xs text-slate-500 italic">No SPF record found for this domain.</p>
                            )}
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">DMARC</span>
                                {audit.dmarc.status === 'pass' && <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Valid</Badge>}
                                {audit.dmarc.status === 'fail' && <Badge variant="error">Weak/Invalid</Badge>}
                                {audit.dmarc.status === 'none' && <Badge variant="outline" className="text-slate-500">Missing</Badge>}
                            </div>
                            {audit.dmarc.record ? (
                                <p className="text-xs font-mono break-all text-slate-600 dark:text-slate-400">{audit.dmarc.record}</p>
                            ) : (
                                <p className="text-xs text-slate-500 italic">No DMARC policy found.</p>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/80 dark:border-white/5 shadow-sm transition-all duration-200 hover:shadow-md h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <MailWarning className="h-5 w-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white">Reputation (RBLs)</h3>
                    </div>

                    <div className="space-y-1 overflow-y-auto pr-2 max-h-[300px]">
                        {Object.entries(audit.rbl).map(([rbl, status]) => (
                            <div key={rbl} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={rbl}>{rbl}</span>
                                {status === 'CLEAR' && (
                                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Clean
                                    </div>
                                )}
                                {status !== 'CLEAR' && status !== 'ERROR' && status !== 'BLOCKED' && (
                                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-bold uppercase">
                                        <AlertTriangle className="h-3.5 w-3.5" /> {status === 'LISTED' ? 'Listed' : status}
                                    </div>
                                )}
                                {status === 'ERROR' && (
                                    <Badge variant="outline" className="text-slate-400">Timeout</Badge>
                                )}
                                {(status as string) === 'BLOCKED' && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">DNS Blocked</Badge>
                                )}
                            </div>
                        ))}
                        {Object.keys(audit.rbl).length === 0 && (
                            <p className="text-sm text-slate-500 italic py-4 text-center">RBL checks skipped (no IP).</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Infrastructure & Log */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/80 dark:border-white/5 shadow-sm transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center gap-2 mb-4">
                        <MapIcon className="h-5 w-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-900 dark:text-white">Infrastructure</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reverse DNS (PTR)</span>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-900 flex justify-between items-center">
                                <span className="text-sm font-mono text-slate-900 dark:text-white truncate" title={audit.ptr.record || 'None'}>
                                    {audit.ptr.record || 'None'}
                                </span>
                                {audit.ptr.status === 'pass' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mx-2" />}
                                {audit.ptr.status === 'fail' && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mx-2" />}
                            </div>
                        </div>

                        {audit.mx.length > 0 && (
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mail Exchangers (MX)</span>
                                </div>
                                <div className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                                    {audit.mx.slice(0, 3).map((mx, i) => (
                                        <div key={i} className="p-2 px-3 flex justify-between items-center">
                                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate pr-4">{mx.exchange}</span>
                                            <Badge variant="secondary" className="font-mono text-[10px] shrink-0">Pri {mx.priority}</Badge>
                                        </div>
                                    ))}
                                    {audit.mx.length > 3 && (
                                        <div className="p-2 px-3 text-xs text-center text-slate-500">
                                            + {audit.mx.length - 3} more records
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-0 bg-slate-950 border-slate-800 shadow-sm overflow-hidden flex flex-col h-[300px]">
                    <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-slate-200 text-sm">SMTP Handshake Log</h3>
                        <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">Port {data.port}</Badge>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 font-mono text-xs leading-relaxed">
                        {data.log.split('\n').map((line, i) => {
                            if (!line.trim()) return null;
                            let color = 'text-slate-400';
                            if (line.startsWith('S: 2') || line.startsWith('S: 3')) color = 'text-emerald-400';
                            if (line.startsWith('S: 4') || line.startsWith('S: 5')) color = 'text-red-400';
                            if (line.startsWith('C:')) color = 'text-indigo-300';
                            if (line.startsWith('ERROR')) color = 'text-rose-500 font-bold';

                            return (
                                <div key={i} className={color}>{line}</div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}
