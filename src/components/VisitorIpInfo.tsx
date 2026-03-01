'use client';

import { useEffect, useState } from 'react';
import { IpInfoResponse } from '@/types/ip-info';
import { Loader2, MapPin, Copy, CheckCheck } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { cn } from '@/lib/utils';

export function VisitorIpInfo() {
    const [info, setInfo] = useState<IpInfoResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchVisitorInfo = async () => {
            try {
                const res = await fetch('/api/ip-info');
                if (res.ok) {
                    const data = await res.json();
                    setInfo(data);
                } else {
                    console.warn(`[VisitorIpInfo] API error: ${res.status} ${res.statusText}`);
                }
            } catch (err) {
                console.error('[VisitorIpInfo] Fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchVisitorInfo();
    }, []);

    const handleCopyIp = () => {
        if (!info?.ip) return;
        navigator.clipboard.writeText(info.ip);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/80 dark:bg-slate-800/20 border border-slate-200/80 dark:border-white/[0.04] rounded-2xl text-xs text-slate-400 animate-pulse shadow-sm dark:shadow-none">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-[11px] font-medium">Detecting...</span>
            </div>
        );
    }

    if (!info) return null;

    const countryCode = [
        info.providers.maxmind?.countryCode,
        info.providers.ipapi?.countryCode,
        info.providers.ipinfo?.country
    ].find(code => code && code !== 'N/A');

    const countryName = info.providers.maxmind?.country
        || info.providers.ipapi?.country
        || info.providers.ipinfo?.country_name
        || (info.ip === '::1' || info.ip === '127.0.0.1' ? 'Local' : 'Global');

    return (
        <button
            onClick={handleCopyIp}
            title="Click to copy your IP address"
            className="group flex items-center gap-2 px-3 py-2 bg-slate-100/80 dark:bg-slate-800/20 border border-slate-200/80 dark:border-white/[0.04] rounded-2xl backdrop-blur-sm shadow-sm dark:shadow-none transition-all duration-200 hover:bg-white dark:hover:bg-white/[0.03] hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-sm"
        >
            {/* Flag */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                {countryCode && countryCode !== 'N/A' ? (
                    <ReactCountryFlag
                        countryCode={countryCode}
                        svg
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <MapPin className="h-3 w-3 text-slate-400" />
                )}
            </div>

            {/* IP section */}
            <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">
                    IP
                </span>
                <div className="relative">
                    <span className={cn(
                        "text-[12px] font-bold text-slate-700 dark:text-slate-200 font-mono tracking-tight transition-opacity duration-200",
                        copied ? "opacity-0" : "opacity-100"
                    )}>
                        {info.ip}
                    </span>
                    <span className={cn(
                        "absolute inset-0 flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 transition-opacity duration-200 whitespace-nowrap",
                        copied ? "opacity-100" : "opacity-0"
                    )}>
                        <CheckCheck className="h-3 w-3 mr-1" /> Copied!
                    </span>
                </div>
                <Copy className={cn(
                    "h-3 w-3 text-slate-300 dark:text-slate-600 transition-all duration-200",
                    "group-hover:text-indigo-400 dark:group-hover:text-indigo-400",
                    copied && "opacity-0"
                )} />
            </div>

            {/* Separator dot */}
            <span className="text-slate-300 dark:text-white/20 text-[10px]">·</span>

            {/* Location */}
            <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-indigo-400 dark:text-indigo-500 shrink-0 transition-transform group-hover:scale-110" />
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {countryName}
                </span>
            </div>
        </button>
    );
}
