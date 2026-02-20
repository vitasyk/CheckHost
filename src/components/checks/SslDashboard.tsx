'use client';

import { CheckCircle2, ChevronRight, Globe, Lock, ShieldCheck, Timer, AlertTriangle, XCircle, Info, Clock, Layers, Calendar, Fingerprint, Shield, Cpu, ShieldAlert, ExternalLink, ChevronDown, Unlock, Server, FileText, Download, Share2, Link, Check, Loader2 } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';


interface SslCertInfo {
    subject: {
        CN: string;
        O?: string;
        OU?: string;
        L?: string;
        ST?: string;
        C?: string;
    };
    issuer: {
        CN: string;
        O?: string;
        OU?: string;
        L?: string;
    };
    valid_from: string;
    valid_to: string;
    fingerprint: string;
    serialNumber: string;
    bits: number;
    pubkey: string;
    asn1Curve?: string;
    nistCurve?: string;
    ext_key_usage?: string[];
    subjectaltname?: string;
    sigalg?: string;
}


interface CipherInfo {
    name: string;
    standardName: string;
    version: string;
    bits: number;
}

interface SslResult {
    host: string;
    hostIp?: string;
    serverType?: string;
    port: number;
    authorized?: boolean;
    authorizationError?: string;
    protocol?: string;
    cipher?: CipherInfo;
    certificate?: SslCertInfo;
    chain?: SslCertInfo[];
    error?: string;
    errorCode?: string;
    status?: 'failed' | 'success';
}

interface SslDashboardProps {
    data: SslResult;
    host?: string;
    isSharedView?: boolean;
}

export function SslDashboard({ data, host, isSharedView = false }: SslDashboardProps) {
    const { certificate, chain, protocol, authorized, authorizationError } = data;
    const dashboardRef = useRef<HTMLDivElement>(null);
    const displayHost = host || data.host;
    const [isSharing, setIsSharing] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    const handleShare = async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const res = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'ssl',
                    host: displayHost || '',
                    results: data,
                    checkNodes: {},
                    metadata: {
                        timestamp: new Date().toISOString()
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

    // Unified Empty State for SSL errors — contextual based on errorCode
    if (data.status === 'failed' || !certificate) {
        const errorCode = data.errorCode || '';
        const isNotFound = errorCode === 'ENOTFOUND';
        const isTimeout = errorCode === 'ETIMEDOUT';
        const isRefused = errorCode === 'ECONNREFUSED' || (!errorCode && !certificate);

        // Determine state visuals
        const stateColor = isNotFound ? 'rose' : 'amber';
        const stripeClass = isNotFound ? 'bg-rose-500' : 'bg-amber-500';
        const iconBg = isNotFound
            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'
            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500';
        const dotClass = isNotFound ? 'bg-rose-500' : 'bg-amber-500';
        const textColor = isNotFound ? 'text-rose-500' : 'text-amber-500';
        const badgeClass = isNotFound
            ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
            : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';

        // Title + description + badges
        const title = isNotFound
            ? 'Domain Not Reachable'
            : isTimeout
                ? 'Connection Timed Out'
                : 'SSL Not Configured';

        const description = isNotFound
            ? <>The domain <span className="text-indigo-600 dark:text-indigo-400 font-bold">{displayHost}</span> doesn&apos;t resolve to an IP. Check DNS configuration or WHOIS data.</>
            : isTimeout
                ? <>The connection to <span className="text-indigo-600 dark:text-indigo-400 font-bold">{displayHost}</span> timed out after 15 seconds. The server may be behind a firewall or down.</>
                : <>No SSL certificate found on <span className="text-indigo-600 dark:text-indigo-400 font-bold">{displayHost}</span>. Port 443 may not be open or HTTPS is not configured.</>;

        const badges: string[] = isNotFound
            ? ['DNS FAILURE', 'NXDOMAIN', 'DOMAIN EXPIRED', 'NO RECORD']
            : isTimeout
                ? ['TIMEOUT', 'FIREWALL', 'RATE LIMITED', 'SERVER DOWN']
                : ['NO HTTPS', 'PORT 443 CLOSED', 'CERT MISSING', 'HTTP ONLY'];

        const infoTitle = isNotFound ? 'What does this mean?' : 'Possible Causes';
        const infoPoints: string[][] = isNotFound
            ? [
                ['Domain has no A record in DNS', 'rose'],
                ['Domain may have expired', 'rose'],
                ['Verify DNS records in the DNS tab', 'slate'],
                ['Check WHOIS in the Info tab', 'slate'],
            ]
            : isTimeout
                ? [
                    ['Server may be behind a firewall', 'amber'],
                    ['Port 443 may be blocked', 'amber'],
                    ['CDN or proxy may be too slow', 'amber'],
                    ['Try again in a few minutes', 'slate'],
                ]
                : [
                    ['HTTPS may not be enabled on server', 'amber'],
                    ['SSL certificate may not be installed', 'amber'],
                    ['Site only serves over HTTP (port 80)', 'amber'],
                    ['Contact hosting provider for SSL setup', 'slate'],
                ];

        return (
            <div ref={dashboardRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm overflow-hidden border border-slate-200/60 dark:border-white/5">
                    <div className={`h-1.5 w-full ${stripeClass}`} />
                    <div className="p-6 flex flex-col sm:flex-row gap-6">

                        {/* Left: Status + badges + buttons */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`relative shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
                                    <Lock className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none flex items-center gap-1.5 mb-1 ${textColor}`}>
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${dotClass}`} />
                                        SSL Certificate Status
                                    </p>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                        {title}
                                    </h3>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                {description}
                            </p>

                            {/* Cause badges */}
                            <div className="flex flex-wrap gap-2 mb-5">
                                {badges.map(label => (
                                    <span key={label} className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black border tracking-widest ${badgeClass}`}>
                                        {label}
                                    </span>
                                ))}
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2">
                                {isNotFound ? (
                                    <>
                                        <a
                                            href={`/checks?tab=dns&host=${encodeURIComponent(displayHost)}`}
                                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors duration-150 shadow-sm"
                                        >
                                            <Globe className="h-4 w-4" />
                                            Check DNS Records
                                        </a>
                                        <a
                                            href={`/checks?tab=info&host=${encodeURIComponent(displayHost)}`}
                                            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors duration-150 shadow-sm"
                                        >
                                            <Server className="h-4 w-4" />
                                            View WHOIS
                                        </a>
                                    </>
                                ) : isTimeout ? (
                                    <>
                                        <a
                                            href={`/checks?tab=ping&host=${encodeURIComponent(displayHost)}`}
                                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors duration-150 shadow-sm"
                                        >
                                            <Timer className="h-4 w-4" />
                                            Run Ping Test
                                        </a>
                                        <a
                                            href={`/checks?tab=http&host=${encodeURIComponent(displayHost)}`}
                                            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors duration-150 shadow-sm"
                                        >
                                            <Globe className="h-4 w-4" />
                                            Check HTTP
                                        </a>
                                    </>
                                ) : (
                                    <>
                                        <a
                                            href={`/checks?tab=http&host=${encodeURIComponent(displayHost)}`}
                                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors duration-150 shadow-sm"
                                        >
                                            <Globe className="h-4 w-4" />
                                            Check HTTP Instead
                                        </a>
                                        <a
                                            href={`/checks?tab=dns&host=${encodeURIComponent(displayHost)}`}
                                            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors duration-150 shadow-sm"
                                        >
                                            <Server className="h-4 w-4" />
                                            Check DNS
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: Info panel */}
                        <div className="sm:w-64 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-white/5 pt-4 sm:pt-0 sm:pl-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5 mb-3">
                                <Info className="h-3 w-3" />
                                {infoTitle}
                            </p>
                            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                                {infoPoints.map(([point], i) => (
                                    <p key={i}>• <span className="font-semibold text-slate-700 dark:text-slate-300">{point}</span></p>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    const expiryDate = new Date(certificate.valid_to);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining < 0;
    const isExpiringSoon = daysRemaining < 30 && !isExpired;

    const hostnameMatches = certificate.subjectaltname?.includes(displayHost) || certificate.subject.CN === displayHost;

    // Determine overall status
    const getStatus = () => {
        if (isExpired) return { label: "Certificate Expired", color: "red", icon: XCircle };
        if (!hostnameMatches) return { label: "Hostname Mismatch", color: "red", icon: AlertTriangle };
        if (!authorized) return { label: "Not Trusted", color: "amber", icon: Shield };
        return { label: "Verified Trust", color: "emerald", icon: ShieldCheck };
    };

    const status = getStatus();
    const isFullyTrusted = status.color === "emerald";

    const [revealLevel, setRevealLevel] = useState(0);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const reversedChain = [...(chain || [])].reverse();

    const toggleNode = (fingerprint: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(fingerprint)) next.delete(fingerprint);
            else next.add(fingerprint);
            return next;
        });
    };

    const toggleAll = () => {
        if (expandedNodes.size === reversedChain.length) {
            setExpandedNodes(new Set());
        } else {
            setExpandedNodes(new Set(reversedChain.map(c => c.fingerprint)));
        }
    };

    // Sequential reveal for the chain: Root -> Leaf
    useEffect(() => {
        const timer = setInterval(() => {
            setRevealLevel((prev: number) => {
                if (prev >= reversedChain.length + 1) {
                    clearInterval(timer);
                    return prev;
                }
                return prev + 1;
            });
        }, 800);
        return () => clearInterval(timer);
    }, [reversedChain.length]);

    const allExpanded = expandedNodes.size === reversedChain.length;

    return (
        <div ref={dashboardRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl relative group/screenshot pb-1 mt-8">
            {!isSharedView && (
                <div className="screenshot-hide absolute top-0 right-3 z-10 flex items-center opacity-0 group-hover/screenshot:opacity-100 transition-all duration-300">
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 text-[11px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/90 dark:hover:bg-indigo-900/30 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
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
                </div>
            )}
            {/* Professional Security Matrix Header */}
            <Card className="overflow-hidden border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative group mx-1 mt-1">
                <div className={cn(
                    "h-1.5 w-full transition-colors duration-1000",
                    isFullyTrusted ? "bg-emerald-500" : status.color === "red" ? "bg-red-500" : "bg-amber-500"
                )} />

                <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        {/* Main Identity Area */}
                        <div className="flex items-center gap-5">
                            <div className={cn(
                                "h-20 w-20 rounded-2xl flex items-center justify-center shadow-inner relative transition-transform duration-500",
                                isFullyTrusted ? "bg-emerald-50 dark:bg-emerald-500/10" :
                                    status.color === "red" ? "bg-red-50 dark:bg-red-900/10" : "bg-amber-50 dark:bg-amber-500/10",
                                isFullyTrusted && "animate-security-pulse group-hover:scale-105"
                            )}>
                                {isFullyTrusted ? (
                                    <ShieldCheck className="h-10 w-10 text-emerald-500" />
                                ) : status.color === "red" ? (
                                    <XCircle className="h-10 w-10 text-red-500" />
                                ) : (
                                    <AlertTriangle className="h-10 w-10 text-amber-500" />
                                )}
                                <div className="absolute -bottom-1 -right-1">
                                    <Badge className={cn(
                                        "h-6 w-6 rounded-full flex items-center justify-center p-0 border-2 border-white dark:border-slate-900 shadow-sm",
                                        isFullyTrusted ? "bg-emerald-500" : status.color === "red" ? "bg-red-500" : "bg-amber-500"
                                    )}>
                                        <Lock className="h-3 w-3 text-white" />
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-2">{displayHost}</h3>
                                <div className="flex flex-wrap items-center gap-y-2 gap-x-3">
                                    <Badge variant={isFullyTrusted ? "secondary" : "error"}
                                        className={cn(
                                            "px-2 py-0.5 text-[11px] uppercase font-bold tracking-widest border-0",
                                            !isFullyTrusted && status.color === "amber" && "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                                        )}>
                                        {status.label}
                                    </Badge>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[11px] font-mono text-slate-500 font-bold uppercase">
                                        <Cpu className="h-3 w-3" />
                                        {data.serverType || "Server"}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[11px] font-mono text-slate-500 font-bold uppercase">
                                        <Layers className="h-3 w-3" />
                                        {protocol}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* High-Density Diagnostic Strip */}
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 lg:border-l border-slate-100 dark:border-white/5 lg:pl-8">
                            <DiagnosticStat
                                icon={<Globe className="h-4 w-4" />}
                                label="Endpoint IP"
                                value={data.hostIp || "Resolving..."}
                                color="indigo"
                            />
                            <DiagnosticStat
                                icon={<Clock className="h-4 w-4" />}
                                label="Validity"
                                value={isExpired ? "Expired" : `${daysRemaining} days`}
                                subtext={new Date(certificate.valid_to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                color={isExpired ? "red" : isExpiringSoon ? "amber" : "emerald"}
                            />
                            <DiagnosticStat
                                icon={<Fingerprint className="h-4 w-4" />}
                                label="Algorithm"
                                value={certificate.sigalg?.split('With')[0] || "RSA-256"}
                                color="slate"
                            />
                        </div>
                    </div>
                </div>

                {authorizationError && (
                    <div className="px-6 pb-6 pt-0">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-xs text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span className="font-medium">Security Warning: {authorizationError}</span>
                        </div>
                    </div>
                )}
            </Card>

            <div className="mx-1 mt-2.5 space-y-2.5">
                {/* Certificate Chain Visualization - Wrapped in its own Card */}
                <Card className="overflow-hidden border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative group">
                    <div className="p-6 relative">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                    <Layers className="h-5 w-5 text-indigo-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest text-[13px]">Trust Hierarchy</h4>
                                    <p className="text-[11px] text-slate-400 font-medium">Click nodes to reveal technical fingerprints</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={toggleAll}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-white/10 text-[11px] font-bold uppercase tracking-tight text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-mono"
                                >
                                    {allExpanded ? 'Collapse All' : 'Expand All'}
                                </button>
                            </div>
                        </div>

                        <div className="relative flex flex-col transition-all duration-500">
                            {reversedChain.map((cert, index) => {
                                const isVisible = index < revealLevel;
                                const isVerified = index < revealLevel - 1;
                                const isLast = index === reversedChain.length - 1;
                                const isRoot = index === 0;
                                const isExpanded = expandedNodes.has(cert.fingerprint);
                                const isExpired = new Date(cert.valid_to) < new Date();

                                return (
                                    <div key={cert.fingerprint} className={cn(
                                        "flex gap-4 relative transition-all duration-700",
                                        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                    )}>
                                        {/* Left Rail: Icon + Connector */}
                                        <div className="flex flex-col items-center shrink-0 w-10 relative">
                                            {/* Icon Node */}
                                            <div
                                                onClick={() => toggleNode(cert.fingerprint)}
                                                className={cn(
                                                    "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-500 z-20 relative bg-white dark:bg-slate-900 border cursor-pointer hover:scale-105 active:scale-95",
                                                    isExpanded
                                                        ? "border-indigo-500/40 text-indigo-500 shadow-sm"
                                                        : "border-slate-200 dark:border-slate-800",
                                                    isVisible ? "scale-100" : "scale-0",
                                                    // Status Colors
                                                    isVerified && !isExpanded && !isExpired && "bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-500/10",
                                                    isExpired && !isExpanded && "bg-red-50/30 dark:bg-red-900/10 border-red-500/10 ring-1 ring-red-500/10",
                                                    !isVerified && !isExpired && !isExpanded && "bg-amber-50/30 dark:bg-amber-900/10 border-amber-500/10"
                                                )}
                                            >
                                                {isExpired ? (
                                                    <XCircle className="h-4 w-4 text-red-500 animate-in zoom-in duration-700" />
                                                ) : isVerified ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-in zoom-in duration-700" />
                                                ) : isVisible ? (
                                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-in zoom-in duration-700" />
                                                ) : (
                                                    <span className="text-[11px] font-bold text-slate-400">
                                                        {isRoot ? "R" : isLast ? "L" : (reversedChain.length - index)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Connector Line (Grows to fill height) */}
                                            {!isLast && isVisible && (
                                                <div className="flex-1 w-0.5 bg-slate-100 dark:bg-white/5 relative my-1 min-h-[20px] rounded-full overflow-hidden">
                                                    <div className={cn(
                                                        "absolute top-0 left-0 w-full shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-1000",
                                                        isExpired ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]" :
                                                            isVerified ? "bg-emerald-500" : "bg-amber-500",
                                                        (isVerified || isExpired) ? "h-full opacity-100" : "h-0 opacity-0"
                                                    )} />
                                                    {/* Arrowhead at bottom of line */}
                                                    <div className={cn(
                                                        "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 transition-all duration-700 z-10",
                                                        (isVerified || isExpired) ? "opacity-100 scale-100" : "opacity-0 scale-50"
                                                    )}>
                                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"
                                                            className={cn(
                                                                "fill-current",
                                                                isExpired ? "text-red-500" : isVerified ? "text-emerald-500" : "text-amber-500"
                                                            )}>
                                                            <path d="M0 0L5 5L10 0" fill="currentColor" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Content: Card */}
                                        <div className="flex-1 min-w-0 pb-6">
                                            <div
                                                className={cn(
                                                    "rounded-2xl border transition-all duration-300 group/node relative z-10 overflow-hidden",
                                                    isExpanded
                                                        ? "bg-white dark:bg-slate-900 border-indigo-500/45 shadow-sm ring-1 ring-indigo-500/10"
                                                        : isExpired
                                                            ? "bg-red-50/40 dark:bg-red-900/10 border-red-200 dark:border-red-500/20 hover:border-red-300 dark:hover:border-red-500/40"
                                                            : isVerified
                                                                ? "bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-900/30"
                                                                : "bg-amber-50/40 dark:bg-amber-900/10 border-amber-200 dark:border-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/40"
                                                )}
                                            >
                                                {/* Clickable Header */}
                                                <div
                                                    onClick={() => toggleNode(cert.fingerprint)}
                                                    className="flex items-center justify-between gap-3 p-3.5 cursor-pointer select-none"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className={cn(
                                                            "text-[13px] font-bold truncate transition-colors duration-300 select-text",
                                                            isExpanded ? "text-indigo-600 dark:text-indigo-400" :
                                                                isExpired ? "text-red-700 dark:text-red-400" :
                                                                    "text-slate-900 dark:text-slate-100"
                                                        )} onClick={(e) => e.stopPropagation()}>
                                                            {cert.subject.CN}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium truncate pointer-events-none">
                                                            {cert.issuer.O || cert.issuer.CN}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Badge variant="outline" className={cn(
                                                            "text-[8px] uppercase tracking-widest px-1.5 h-4 border-0 font-bold",
                                                            isExpired ? "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400" :
                                                                isRoot ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" :
                                                                    isLast ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                                                        "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                        )}>
                                                            {isExpired ? "EXPIRED" : isLast ? "Leaf" : isRoot ? "Root" : "ICA"}
                                                        </Badge>
                                                        {/* Explicit Toggle Button */}
                                                        <button
                                                            type="button"
                                                            className={cn(
                                                                "h-6 w-6 rounded-full flex items-center justify-center border transition-all duration-300 hover:bg-slate-100 dark:hover:bg-white/10",
                                                                isExpanded
                                                                    ? "rotate-180 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 border-indigo-200 dark:border-indigo-500/20"
                                                                    : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400"
                                                            )}
                                                        >
                                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current stroke-2">
                                                                <path d="M1 1L5 5L9 1" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expandable Technical Details */}
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={cn(
                                                        "overflow-hidden transition-all duration-500 ease-in-out cursor-text px-3.5",
                                                        isExpanded ? "max-h-[800px] opacity-100 pb-3" : "max-h-0 opacity-0 pb-0"
                                                    )}
                                                >
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
                                                        {/* Col 1: Identity */}
                                                        <div className="space-y-1.5">
                                                            <InfoRow label="Issued By" value={cert.issuer.O || cert.issuer.CN} />
                                                            {cert.subject.O && <InfoRow label="Organization" value={cert.subject.O} />}
                                                        </div>

                                                        {/* Col 2: Security */}
                                                        <div className="space-y-1.5">
                                                            <InfoRow label="Algorithm" value={cert.sigalg || 'N/A'} />
                                                            <InfoRow label="Serial Number" value={cert.serialNumber} mono />
                                                        </div>

                                                        {/* Col 3: Context */}
                                                        <div className="space-y-1.5">
                                                            <InfoRow
                                                                label="Validity Window"
                                                                value={`${new Date(cert.valid_from).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} — ${new Date(cert.valid_to).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`}
                                                                mono
                                                            />
                                                            {(cert.subject.L || cert.subject.ST || cert.subject.C) && (
                                                                <InfoRow
                                                                    label="Location"
                                                                    value={[cert.subject.L, cert.subject.ST, cert.subject.C].filter(Boolean).join(', ')}
                                                                />
                                                            )}
                                                        </div>

                                                        {isLast && cert.subjectaltname && (
                                                            <div className="col-span-1 md:col-span-3 pt-0.5">
                                                                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black inline-block mr-2">SANs:</span>
                                                                <div className="inline-flex flex-wrap gap-x-2 gap-y-0 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 align-baseline">
                                                                    {cert.subjectaltname.replace(/DNS:/g, '').split(', ').map((san: string, i: number) => (
                                                                        <span key={san + i}>{san}{i < cert.subjectaltname!.split(', ').length - 1 ? ',' : ''}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-12 pt-6 border-t border-slate-100 dark:border-white/5 text-center">
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest italic">
                            Verification Ritual Complete • Full Trust Chain Encrypted & Validated
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function DiagnosticStat({ icon, label, value, subtext, color }: { icon: React.ReactNode, label: string, value: string, subtext?: string, color: 'emerald' | 'amber' | 'red' | 'indigo' | 'slate' }) {
    const colorMap = {
        emerald: "text-emerald-500",
        amber: "text-amber-500",
        red: "text-red-500",
        indigo: "text-indigo-500",
        slate: "text-slate-500"
    };

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg bg-slate-50 dark:bg-white/5", colorMap[color])}>
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">{label}</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{value}</p>
                    {subtext && <p className="text-[10px] text-slate-400 font-medium">{subtext}</p>}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="space-y-0">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{label}</span>
            <p className={cn(
                "text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight",
                mono && "font-mono text-[11px]"
            )} title={value}>
                {value}
            </p>
        </div>
    );
}
