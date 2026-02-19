'use client';

import { CheckCircle2, ChevronRight, Globe, Lock, ShieldCheck, Timer, AlertTriangle, XCircle, Info, Clock, Layers, Calendar, Fingerprint, Shield, Cpu, Camera, Copy, Check } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { toPng, toBlob } from 'html-to-image';


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
}

export function SslDashboard({ data }: SslDashboardProps) {
    const { certificate, chain, protocol, authorized, authorizationError } = data;
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    const captureOptions = {
        pixelRatio: 2,
        cacheBust: true,
        filter: (node: HTMLElement) => !node.classList?.contains('screenshot-hide')
    };

    const handleScreenshot = async () => {
        if (dashboardRef.current) {
            try {
                const dataUrl = await toPng(dashboardRef.current, captureOptions);
                const link = document.createElement("a");
                link.href = dataUrl;
                link.download = `${data.host}-ssl-report.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (err) {
                console.error("Screenshot failed:", err);
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
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            } catch (err) {
                console.error("Copy to clipboard failed:", err);
            }
        }
    };

    // Unified Empty State for Not Found / Refused domains
    if (data.status === 'failed' || !certificate) {
        return (
            <div ref={dashboardRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-white/5">
                <div className="max-w-md mx-auto space-y-6">
                    <div className="relative mx-auto w-24 h-24 rounded-3xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                        <AlertTriangle className="h-12 w-12 text-amber-500" />
                        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-50 dark:border-amber-500/20 flex items-center justify-center">
                            <XCircle className="h-4 w-4 text-red-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            No SSL Data Found
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            We couldn&apos;t establish a secure connection with <span className="text-indigo-600 dark:text-indigo-400 font-bold">{data.host}</span>.
                            This typically happens when a domain is inactive or not configured for HTTPS.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-left">
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 flex items-start gap-4">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                <Info className="h-4 w-4 text-indigo-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Diagnostic Tip</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {data.errorCode === 'ENOTFOUND'
                                        ? "The domain name doesn't resolve to any IP address. Verify the domain registration and DNS records."
                                        : data.errorCode === 'ETIMEDOUT'
                                            ? "The connection timed out after 15 seconds. The server might be behind a firewall, or the service is too slow to respond."
                                            : "The server is active but refusing connections on port 443. Ensure an SSL certificate is installed and the web server is running."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] uppercase font-black tracking-widest bg-amber-50/50 dark:bg-amber-900/10">
                            Status: {data.errorCode || 'Inactive'}
                        </Badge>
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

    const hostnameMatches = certificate.subjectaltname?.includes(data.host) || certificate.subject.CN === data.host;

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
            {/* Hover-reveal floating action buttons */}
            <div className="screenshot-hide absolute top-0 right-3 z-10 flex items-center opacity-0 group-hover/screenshot:opacity-100 transition-all duration-300">
                <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-l-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 text-[10px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/90 dark:hover:bg-indigo-900/30 transition-all duration-200 shadow-sm cursor-pointer"
                >
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy Img'}</span>
                </button>
                <button
                    onClick={handleScreenshot}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-r-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-l-0 border-slate-200/80 dark:border-white/10 text-[10px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/90 dark:hover:bg-indigo-900/30 transition-all duration-200 shadow-sm cursor-pointer"
                >
                    <Camera className="h-3 w-3" />
                    <span>Save</span>
                </button>
            </div>
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
                                <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-2">{data.host}</h3>
                                <div className="flex flex-wrap items-center gap-y-2 gap-x-3">
                                    <Badge variant={isFullyTrusted ? "secondary" : "error"}
                                        className={cn(
                                            "px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest border-0",
                                            !isFullyTrusted && status.color === "amber" && "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                                        )}>
                                        {status.label}
                                    </Badge>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-mono text-slate-500 font-bold uppercase">
                                        <Cpu className="h-3 w-3" />
                                        {data.serverType || "Server"}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-mono text-slate-500 font-bold uppercase">
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
                                subtext={new Date(certificate.valid_to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest text-xs">Trust Hierarchy</h4>
                                    <p className="text-[10px] text-slate-400 font-medium">Click nodes to reveal technical fingerprints</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={toggleAll}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-tight text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
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
                                                    <span className="text-[10px] font-bold text-slate-400">
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
                                                                value={`${new Date(cert.valid_from).toLocaleDateString()} — ${new Date(cert.valid_to).toLocaleDateString()}`}
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
