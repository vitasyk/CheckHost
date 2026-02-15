'use client';

import { useEffect, useState } from 'react';
import { IpInfoResponse } from '@/types/ip-info';
import { Loader2, MapPin } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';

export function VisitorIpInfo() {
    const [info, setInfo] = useState<IpInfoResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVisitorInfo = async () => {
            try {
                const res = await fetch('/api/ip-info');
                if (res.ok) {
                    const data = await res.json();
                    setInfo(data);
                }
            } catch (err) {
                console.error('Failed to fetch visitor IP info:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchVisitorInfo();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Detecting IP...</span>
            </div>
        );
    }

    if (!info) return null;

    const countryCode = info.providers.maxmind?.countryCode || info.providers.ipapi?.countryCode || info.providers.ipinfo?.country;
    const countryName = info.providers.maxmind?.country || info.providers.ipapi?.country || info.providers.ipinfo?.country_name || (info.ip === '::1' || info.ip === '127.0.0.1' ? 'Local Network' : 'Global');

    const isLocal = info.ip === '::1' || info.ip === '127.0.0.1';

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-100/50 dark:bg-white/5 rounded-full border border-slate-200/50 dark:border-white/10 transition-all hover:bg-slate-100 dark:hover:bg-white/10">
            <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full overflow-hidden shadow-sm">
                    {countryCode && (
                        <ReactCountryFlag
                            countryCode={countryCode}
                            svg
                            style={{
                                width: '1.2em',
                                height: '1.2em',
                                objectFit: 'cover'
                            }}
                        />
                    )}
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight mr-1">Your IP:</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {info.ip}
                </span>
            </div>

            <div className="h-3 w-px bg-slate-300 dark:bg-white/20" />

            <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-indigo-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {countryName || 'Unknown'}
                </span>
            </div>
        </div>
    );
}
