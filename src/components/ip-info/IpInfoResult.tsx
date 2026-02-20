import { IpInfoResponse } from '@/types/ip-info';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import MapWrapper from '@/components/ip-info/MapWrapper';
import { getCountryCoords } from '@/lib/country-coords';
import { parseRdapData } from '@/lib/rdap-parser';
import { useState, useEffect, useRef } from 'react';
import {
    Share2, Link, Check, Loader2, AlertTriangle, Building2, Flag,
    Navigation, Clock, Sun, Moon, ArrowUpRight, MapPin, Globe,
    ChevronDown, Database, Calendar, ShieldCheck, Mail, Phone,
    ExternalLink, Server, Network, Maximize2, Copy
} from 'lucide-react';

interface IpInfoResultProps {
    data: IpInfoResponse;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    isSharedView?: boolean;
}

export default function IpInfoResult({ data, onRefresh, isRefreshing, isSharedView = false }: IpInfoResultProps) {
    const { providers } = data;
    const screenshotRef = useRef<HTMLDivElement>(null);
    const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
    const [expandedRaw, setExpandedRaw] = useState(false);
    const [displaySettings, setDisplaySettings] = useState({
        showFeaturedMap: false,
        showRdapData: false,
        showProviderCards: false
    });
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Add timestamp to prevent caching
                const res = await fetch(`/api/admin/settings?key=ip_info_display&t=${Date.now()}`);
                if (res.ok) {
                    const settings = await res.json();
                    if (settings) {
                        setDisplaySettings(settings);
                        // Apply conditional expansion logic based on map visibility
                        if (settings.showFeaturedMap) {
                            setExpandedProvider(null);
                        } else {
                            setExpandedProvider('maxmind');
                        }
                    } else {
                        // Fallback to defaults if no settings in DB
                        setDisplaySettings({
                            showFeaturedMap: false,
                            showRdapData: true,
                            showProviderCards: true
                        });
                        setExpandedProvider('maxmind');
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch IP Info display settings:', err);
                // Fallback on error
                setDisplaySettings({
                    showFeaturedMap: false,
                    showRdapData: true,
                    showProviderCards: true
                });
                setExpandedProvider('maxmind');
            } finally {
                setSettingsLoaded(true);
            }
        };
        fetchSettings();
    }, []);

    const toggleProvider = (provider: string) => {
        setExpandedProvider(expandedProvider === provider ? null : provider);
    };

    const handleShare = async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const res = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'info',
                    host: data.host || data.hostname || data.ip || '',
                    results: data, // For IP info, we store the whole response
                    checkNodes: {},
                    metadata: {
                        timestamp: new Date().toISOString(),
                        providerCount: providerConfigs.length
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

    const hasRdap = !!data.rdapRawData;
    const rdap = hasRdap ? parseRdapData(data.rdapRawData) : null;
    // Check if the queried host is an IP Address (IPv4 or IPv6-like fallback)
    const isIP = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[0-9a-fA-F:]+$/.test(data.host || data.ip || '');
    const isUnresolved = data.status === 'failed';

    // Simplified check for "unresolved" state but NO early return here
    // The Execution will continue to define providerConfigs and render the dashboard.

    const providerConfigs = [
        {
            key: 'maxmind',
            name: 'MaxMind GeoIP',
            isReal: !!(providers.maxmind && providers.maxmind._isReal),
            color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
            data: providers.maxmind,
            fields: providers.maxmind ? [
                { label: 'IP Address', value: data.ip },
                { label: 'City', value: providers.maxmind.city },
                { label: 'Region', value: providers.maxmind.region },
                { label: 'Country', value: providers.maxmind.country },
                { label: 'Postal Code', value: providers.maxmind.postal },
                { label: 'Coordinates', value: providers.maxmind.latitude && providers.maxmind.longitude ? `${providers.maxmind.latitude}, ${providers.maxmind.longitude}` : 'N/A' },
                { label: 'Organization', value: providers.maxmind.org },
                { label: 'ASN', value: providers.maxmind.asn },
                { label: 'Accuracy Radius', value: providers.maxmind.accuracyRadius ? `${providers.maxmind.accuracyRadius}km` : 'N/A' },
            ] : []
        },
        {
            key: 'ipinfo',
            name: 'IPInfo.io',
            isReal: true,
            color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50',
            data: providers.ipinfo,
            fields: providers.ipinfo ? [
                { label: 'IP Address', value: data.ip },
                { label: 'City', value: providers.ipinfo.city },
                { label: 'Region', value: providers.ipinfo.region },
                { label: 'Country', value: providers.ipinfo.country },
                { label: 'Country Name', value: providers.ipinfo.country_name },
                { label: 'Continent', value: providers.ipinfo.continent },
                { label: 'Continent Code', value: providers.ipinfo.continent_code },
                { label: 'Postal Code', value: providers.ipinfo.postal },
                { label: 'Coordinates', value: providers.ipinfo.loc },
                { label: 'Organization', value: providers.ipinfo.org },
                { label: 'ASN', value: providers.ipinfo.asn },
                { label: 'AS Name', value: providers.ipinfo.as_name },
                { label: 'AS Domain', value: providers.ipinfo.as_domain },
                { label: 'Timezone', value: providers.ipinfo.timezone },
                { label: 'Anycast', value: providers.ipinfo.anycast ? 'Yes' : 'No' },
            ] : []
        },
        {
            key: 'dbip',
            name: 'DB-IP',
            isReal: false,
            color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/50',
            data: providers.dbip,
            fields: providers.dbip ? [
                { label: 'IP Address', value: data.ip },
                { label: 'City', value: providers.dbip.city },
                { label: 'State/Province', value: providers.dbip.stateProv },
                { label: 'Country', value: providers.dbip.countryName },
                { label: 'Country Code', value: providers.dbip.countryCode },
                { label: 'ISP', value: providers.dbip.isp },
                { label: 'Connection Type', value: providers.dbip.connectionType },
            ] : []
        },
        {
            key: 'ip2location',
            name: 'IP2Location',
            isReal: false,
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50',
            data: providers.ip2location,
            fields: providers.ip2location ? [
                { label: 'IP Address', value: data.ip },
                { label: 'City', value: providers.ip2location.city_name },
                { label: 'Region', value: providers.ip2location.region_name },
                { label: 'Country', value: providers.ip2location.country_name },
                { label: 'Country Code', value: providers.ip2location.cntry_code },
                { label: 'Zip Code', value: providers.ip2location.zip_code },
                { label: 'ISP', value: providers.ip2location.isp },
                { label: 'Net Speed', value: providers.ip2location.net_speed },
                { label: 'Usage Type', value: providers.ip2location.usage_type },
            ] : []
        },
        {
            key: 'ipapi',
            name: 'IP-API.com',
            isReal: true,
            color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50',
            data: providers.ipapi,
            fields: providers.ipapi ? [
                { label: 'IP Address', value: data.ip },
                { label: 'City', value: providers.ipapi.city },
                { label: 'Region', value: providers.ipapi.regionName },
                { label: 'Country', value: providers.ipapi.country },
                { label: 'Zip Code', value: providers.ipapi.zip },
                { label: 'Coordinates', value: `${providers.ipapi.lat}, ${providers.ipapi.lon}` },
                { label: 'ISP', value: providers.ipapi.isp },
                { label: 'Organization', value: providers.ipapi.org },
                { label: 'Timezone', value: providers.ipapi.timezone },
                { label: 'Proxy/VPN', value: providers.ipapi.proxy ? 'Yes' : 'No' },
                { label: 'Hosting', value: providers.ipapi.hosting ? 'Yes' : 'No' },
            ] : []
        },
        {
            key: 'ipgeolocation',
            name: 'IPGeolocation.io',
            isReal: true,
            color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50',
            data: providers.ipgeolocation,
            fields: providers.ipgeolocation ? [
                { label: 'IP Address', value: data.ip },
                { label: 'City', value: providers.ipgeolocation.city },
                { label: 'State/Province', value: providers.ipgeolocation.state_prov },
                { label: 'Country', value: providers.ipgeolocation.country_name },
                { label: 'Country Code', value: providers.ipgeolocation.country_code2 },
                { label: 'Zip Code', value: providers.ipgeolocation.zipcode },
                { label: 'Coordinates', value: providers.ipgeolocation.latitude && providers.ipgeolocation.longitude && providers.ipgeolocation.latitude !== "0" ? `${providers.ipgeolocation.latitude}, ${providers.ipgeolocation.longitude}` : 'N/A' },
                { label: 'ISP', value: providers.ipgeolocation.isp },
                { label: 'Currency', value: providers.ipgeolocation.currency?.code },
                { label: 'Languages', value: providers.ipgeolocation.languages },
            ] : []
        },
        {
            key: 'maxmind_local',
            name: 'MaxMind (Local DB)',
            isReal: true,
            color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/50',
            data: providers.maxmind_local,
            fields: providers.maxmind_local ? [
                { label: 'IP Address', value: data.ip },
                { label: 'City', value: providers.maxmind_local.city },
                { label: 'Region', value: providers.maxmind_local.region },
                { label: 'Country', value: providers.maxmind_local.country },
                { label: 'Postal Code', value: providers.maxmind_local.postal },
                { label: 'Coordinates', value: providers.maxmind_local.latitude && providers.maxmind_local.longitude ? `${providers.maxmind_local.latitude}, ${providers.maxmind_local.longitude}` : 'N/A' },
                { label: 'ASN', value: providers.maxmind_local.asn },
                { label: 'Organization', value: providers.maxmind_local.org },
                { label: 'Accuracy Radius', value: providers.maxmind_local.accuracyRadius ? `${providers.maxmind_local.accuracyRadius}km` : 'N/A' },
            ] : []
        },
    ]
        .filter(config => config.data)
        .map(config => ({
            ...config,
            fields: config.fields.filter(f => f.value && f.value !== 'N/A' && f.value !== '0' && f.value !== '0,0' && f.value !== '0km' && f.value !== '0, 0')
        }));

    if (!isUnresolved && providerConfigs.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No IP information found.</div>;
    }

    if (!settingsLoaded) {
        return (
            <div className="space-y-4">
                <div className="h-24 w-full bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-2xl" />
                <div className="h-[350px] w-full bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
            {/* Screenshot area: Target IP + Domain Registration */}
            <div ref={screenshotRef} className="relative group/screenshot space-y-4">
                {/* Hover-reveal floating action buttons - Positioned relative to frame */}
                <div className="screenshot-hide absolute top-0 right-3 z-10 flex items-center opacity-0 group-hover/screenshot:opacity-100 transition-all duration-300">
                    {!isSharedView && (
                        <div className="flex bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 rounded-lg shadow-sm overflow-hidden">
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
                            <button
                                onClick={handleShare}
                                disabled={isSharing}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 cursor-pointer"
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
                </div>

                {/* Intelligence Banner: Resolution Failed for unresolved domains / IPs */}
                {isUnresolved && (
                    <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm overflow-hidden flex flex-col border border-slate-200/60 dark:border-white/5">
                        <div className={cn("h-1.5 w-full", hasRdap ? "bg-amber-500" : "bg-rose-500")} />
                        <div className="p-6 flex flex-col sm:flex-row gap-6">

                            {/* Left side: Status + Description + Badges + Button */}
                            <div className="flex-1 min-w-0">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn(
                                        "relative shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center",
                                        hasRdap
                                            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                                            : "bg-rose-50 dark:bg-rose-500/10 text-rose-500"
                                    )}>
                                        <AlertTriangle className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className={cn(
                                            "text-[10px] font-black uppercase tracking-widest leading-none flex items-center gap-1.5 mb-1",
                                            hasRdap ? "text-amber-500" : "text-rose-500"
                                        )}>
                                            <span className={cn("inline-block w-1.5 h-1.5 rounded-full animate-pulse", hasRdap ? "bg-amber-500" : "bg-rose-500")} />
                                            {isIP ? 'IP Address Status' : 'Resolution Status'}
                                        </p>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                            {hasRdap ? 'Partial Info Found' : (isIP ? 'Lookup Failed' : 'Resolution Failed')}
                                        </h3>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                    {isIP ? 'The IP address ' : 'The domain '}
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{data.host || 'this host'}</span>
                                    {isIP ? ' currently doesn\'t have public info or might be a private/invalid address.' : ' currently doesn\'t resolve to a valid IP address.'}
                                </p>

                                {/* Possible cause badges */}
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {(isIP ? [
                                        { label: 'PRIVATE IP', color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
                                        { label: 'INVALID FORMAT', color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
                                        { label: 'NO RECORD', color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
                                    ] : [
                                        { label: 'DNS ERROR', color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
                                        { label: 'DOMAIN EXPIRED', color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
                                        { label: 'SERVER DOWN', color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
                                        { label: 'MAINTENANCE', color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
                                    ]).map(({ label, color }) => (
                                        <span key={label} className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black border tracking-widest ${color}`}>
                                            {label}
                                        </span>
                                    ))}
                                </div>

                                {/* DNS Diagnostic button (only for domains) */}
                                {!isIP && (
                                    <a
                                        href={`/checks?tab=dns&host=${encodeURIComponent(data.host || '')}`}
                                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors duration-150 shadow-sm"
                                    >
                                        <Globe className="h-4 w-4" />
                                        Full DNS Diagnostic
                                        <ArrowUpRight className="h-4 w-4" />
                                    </a>
                                )}
                            </div>

                            {/* Right side: Cached RDAP data if available */}
                            {rdap && (rdap.organization || rdap.country || rdap.registrar) && (
                                <div className="sm:w-64 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-white/5 pt-4 sm:pt-0 sm:pl-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5 mb-3">
                                        <Database className="h-3 w-3" />
                                        Cached Repository Data
                                    </p>
                                    <div className="space-y-3">
                                        {rdap.registrar && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Registrar</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{rdap.registrar}</p>
                                            </div>
                                        )}
                                        {rdap.organization && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Registry Info</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{rdap.organization}</p>
                                            </div>
                                        )}
                                        {!rdap.registrar && !rdap.organization && (
                                            <p className="text-xs text-slate-400 italic">No public WHOIS organization data found.</p>
                                        )}
                                        {rdap.country && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Registration Country</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{rdap.country}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {(!rdap || (!rdap.organization && !rdap.country && !rdap.registrar)) && (
                                <div className="sm:w-64 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-white/5 pt-4 sm:pt-0 sm:pl-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5 mb-3">
                                        <Database className="h-3 w-3" />
                                        Cached Repository Data
                                    </p>
                                    <p className="text-xs text-slate-400 italic flex items-center gap-1.5">
                                        <Server className="h-3 w-3 shrink-0" />
                                        No public WHOIS organization data found.
                                    </p>
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {!isUnresolved && (
                    <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm overflow-hidden flex flex-col border border-slate-200/60 dark:border-white/5">
                        <div className="h-1.5 w-full bg-emerald-500" />
                        {/* Unified Summary Header Bar - Premium UI/UX */}
                        <div className="p-4 bg-slate-100/30 dark:bg-slate-900/40 border-b border-slate-200 dark:border-white/5">
                            <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                                {/* Focus: IP & Hostname */}
                                <div className="flex items-center gap-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-border pb-4 lg:pb-0 lg:pr-8 w-full lg:w-auto">
                                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                        <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="flex-1 lg:flex-none min-w-[140px]">
                                        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">
                                            Target IP
                                        </div>
                                        <div className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 leading-none">
                                            {data.ip}
                                            <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-slate-100 dark:bg-white/5 text-slate-500 rounded-md font-bold">
                                                {providerConfigs.length}
                                            </Badge>
                                        </div>
                                        <div className="text-xs font-mono text-slate-400 line-clamp-1 mt-1 flex items-center gap-2">
                                            {data.hostname && data.hostname !== data.ip && (
                                                <span>{data.hostname}</span>
                                            )}
                                            {data.host && data.host !== data.ip && data.host !== data.hostname && (
                                                <>
                                                    {data.hostname && data.hostname !== data.ip && (
                                                        <span className="text-[10px] opacity-50">•</span>
                                                    )}
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{data.host}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Focus: Quick Insights */}
                                <div className="flex flex-1 items-center justify-between w-full">
                                    <div className="flex items-center gap-6 sm:gap-10 overflow-x-auto no-scrollbar py-1">
                                        {/* Location */}
                                        {providers.ipapi?.city && (
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                                    <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">Location</div>
                                                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                                                        {providers.ipapi.city}, {providers.ipapi.countryCode}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Timezone & Info */}
                                        {providers.ipapi?.timezone && (
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                                    <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">Details</div>
                                                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                                                        {providers.ipapi.timezone}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Security Badges - Aligned Right */}
                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                        {providers.ipapi?.proxy && (
                                            <Badge className="bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50 hover:bg-amber-100 transition-colors uppercase text-xs font-bold px-3 py-1">
                                                VPN / Proxy
                                            </Badge>
                                        )}
                                        {providers.ipapi?.hosting && (
                                            <Badge className="bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/50 hover:bg-rose-100 transition-colors uppercase text-xs font-bold px-3 py-1">
                                                Data Center
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Featured Map Section - High Visibility */}
                        {displaySettings.showFeaturedMap && (() => {
                            let featuredLat = 0;
                            let featuredLng = 0;
                            let sourceName = '';

                            // Priority 1: IPInfo.io real coordinates (as requested)
                            if (providers.ipinfo?.loc) {
                                const parts = providers.ipinfo.loc.split(',');
                                const lat = parseFloat(parts[0]);
                                const lng = parseFloat(parts[1]);
                                if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
                                    featuredLat = lat;
                                    featuredLng = lng;
                                    sourceName = 'IPInfo.io';
                                }
                            }

                            // Priority 2: Fallback to any other provider coordinates if IPInfo is missing
                            if (featuredLat === 0) {
                                const fallbackSource = providerConfigs.find(p => {
                                    const d = p.data as any;
                                    return d.latitude || d.lat || d.loc;
                                });

                                if (fallbackSource) {
                                    const d = fallbackSource.data as any;
                                    if (d.loc) {
                                        [featuredLat, featuredLng] = d.loc.split(',').map(parseFloat);
                                    } else {
                                        featuredLat = d.latitude || d.lat;
                                        featuredLng = d.longitude || d.lon;
                                    }
                                    sourceName = fallbackSource.name;
                                }
                            }

                            if (featuredLat === 0) return null;

                            const hourOffset = providers.ipgeolocation?.time_zone?.offset || 0;
                            // Basic night detection (6 PM to 6 AM)
                            const currentHour = (new Date().getUTCHours() + hourOffset + 24) % 24;
                            const isNight = currentHour < 6 || currentHour >= 18;

                            return (
                                <div className="relative overflow-hidden border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm bg-white dark:bg-slate-950 mx-1 mt-4 group/map h-[480px]">
                                    {/* Map as Background */}
                                    <div className="absolute inset-0 z-0 scale-110 group-hover/map:scale-100 transition-transform duration-[3s] ease-out">
                                        <MapWrapper
                                            lat={featuredLat}
                                            lng={featuredLng}
                                            city={providers.ipinfo?.city || providers.ipapi?.city || "Unknown Location"}
                                            country={providers.ipinfo?.country_name || providers.ipapi?.country || ""}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-slate-900/20 pointer-events-none" />
                                    </div>

                                    {/* Glass Tile: Geolocation Hub (Left Top) */}
                                    <div className="absolute top-4 left-4 z-10 w-72 animate-in slide-in-from-left-4 duration-700">
                                        <div className="backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-white/40 dark:border-white/10 rounded-2xl p-4 shadow-2xl">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30">
                                                    <Navigation className="h-4 w-4 text-white" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Network Hub</div>
                                                    <div className="text-sm font-black text-slate-900 dark:text-white leading-none">Geolocation Center</div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-end border-b border-slate-200/50 dark:border-white/5 pb-2">
                                                    <div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-0.5">Primary Coordinates</div>
                                                        <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{featuredLat.toFixed(5)}, {featuredLng.toFixed(5)}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${featuredLat}, ${featuredLng}`);
                                                            // Could add a small local toast here if needed
                                                        }}
                                                        className="p-1.5 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-indigo-500"
                                                        title="Copy Coordinates"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>

                                                {providers.maxmind?.accuracyRadius && (
                                                    <div className="flex items-center gap-2 px-1">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight group/acc relative cursor-help">
                                                            ± {providers.maxmind.accuracyRadius}km accuracy radius
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* External Links Hub */}
                                        <div className="mt-3 flex gap-2">
                                            <a
                                                href={`https://www.google.com/maps?q=${featuredLat},${featuredLng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-white/40 dark:border-white/10 rounded-xl py-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all shadow-xl shadow-black/5"
                                            >
                                                Open Maps <ArrowUpRight className="h-3 w-3" />
                                            </a>
                                            <div className="backdrop-blur-md bg-indigo-500/90 text-white border border-indigo-400/50 rounded-xl px-3 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                                <Globe className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Glass Tile: Regional Intelligence (Right Top) */}
                                    <div className="absolute top-4 right-4 z-10 w-64 animate-in slide-in-from-right-4 duration-700">
                                        <div className="backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-white/40 dark:border-white/10 rounded-2xl p-4 shadow-2xl">
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Regional Profile</div>
                                                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
                                                    {isNight ? <Moon className="h-3 w-3 text-blue-400" /> : <Sun className="h-3 w-3 text-amber-500" />}
                                                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase leading-none">{isNight ? 'Night' : 'Day'}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                                                <div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                        <Clock className="h-2.5 w-2.5" /> Offset
                                                    </div>
                                                    <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                                                        {hourOffset !== undefined ? `UTC ${hourOffset >= 0 ? '+' : ''}${hourOffset}:00` : 'N/A'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                        <Database className="h-2.5 w-2.5" /> Currency
                                                    </div>
                                                    <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                                        {providers.ipgeolocation?.currency?.code || providers.ipapi?.currency || 'N/A'}
                                                        {providers.ipgeolocation?.currency?.symbol && <span className="opacity-50 text-[10px]">{providers.ipgeolocation.currency.symbol}</span>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                        <Phone className="h-2.5 w-2.5" /> Calling
                                                    </div>
                                                    <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                                                        {providers.ipgeolocation?.calling_code ? `+${providers.ipgeolocation.calling_code}` : 'N/A'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                        <MapPin className="h-2.5 w-2.5" /> Languages
                                                    </div>
                                                    <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate pr-1">
                                                        {providers.ipgeolocation?.languages?.split(',')[0] || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Technical Integrity Badge */}
                                        <div className="mt-3 backdrop-blur-md bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between shadow-xl">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Technical Precision</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{sourceName}</span>
                                        </div>
                                    </div>

                                    {/* Bottom Floating Info: City/Country Branding */}
                                    <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between pointer-events-none">
                                        <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
                                            <div className="text-[10px] text-white/60 font-black uppercase tracking-[0.3em] mb-1 drop-shadow-md">Verified Geopoint</div>
                                            <div className="text-3xl font-black text-white drop-shadow-lg tracking-tighter flex items-center gap-3">
                                                {providers.ipinfo?.city || providers.ipapi?.city || "Unknown City"}
                                                <span className="text-white/40 font-light translate-y-1">/</span>
                                                <span className="text-xl text-white/80">{providers.ipinfo?.country_name || providers.ipapi?.country || ""}</span>
                                            </div>
                                        </div>

                                        {/* Status Indicator */}
                                        <div className="p-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-auto hover:bg-white/20 transition-all cursor-default">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                            <span className="text-[10px] text-white font-black uppercase tracking-widest">Network Online</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* RDAP / WHOIS Data Section */}
                {displaySettings.showRdapData && data.rdapRawData && (() => {
                    const rdap = parseRdapData(data.rdapRawData);
                    return (
                        <Card className="border-slate-200/60 dark:border-white/5 overflow-hidden transition-all duration-300 bg-white dark:bg-slate-950 shadow-sm">
                            <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                        <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-none">
                                                Domain Registration Details
                                            </span>
                                            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50 uppercase tracking-tight font-bold text-xs py-1 px-3">
                                                {rdap.domain || 'Registered'}
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">Verified RDAP Data from RDAP.ORG</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {/* Column 1: Registrar & Status */}
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <ExternalLink className="h-3 w-3" /> Registrar
                                        </div>
                                        <div className="text-sm text-slate-900 dark:text-slate-100">
                                            {rdap.registrar || (rdap.objectClassName === 'ip network' ? rdap.name : 'Protected / Hidden')}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Domain Status</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {rdap.status?.map((s, i) => {
                                                const status = s.toLowerCase();
                                                let colorClasses = "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-0";

                                                if (['serverhold', 'clienthold', 'server hold', 'client hold'].includes(status)) {
                                                    colorClasses = "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/50 font-bold";
                                                } else if (['pendingdelete', 'redemptionperiod', 'inactive', 'pending delete', 'redemption period'].includes(status)) {
                                                    colorClasses = "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 font-bold";
                                                }

                                                return (
                                                    <Badge key={i} variant="secondary" className={`text-[10px] ${colorClasses}`}>
                                                        {s}
                                                    </Badge>
                                                );
                                            }) || <span className="text-sm text-slate-400">N/A</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Hosting / ISP & Important Dates */}
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Server className="h-3 w-3" /> Hosting / ISP
                                        </div>
                                        <div className="text-sm text-indigo-600 dark:text-indigo-400">
                                            {providers.ipapi?.isp || providers.ipinfo?.org || rdap.name || 'N/A'}
                                        </div>
                                        {/* ASN / Handle */}
                                        {(providers.ipinfo?.asn || providers.ipapi?.as || rdap.handle) && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                                    <Network className="h-2.5 w-2.5" /> {rdap.objectClassName === 'ip network' ? 'Handle' : 'ASN'}
                                                </div>
                                                <div className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 leading-none">
                                                    {rdap.handle || providers.ipinfo?.asn || providers.ipapi?.as?.split(' ')[0]}
                                                </div>
                                            </div>
                                        )}
                                        {/* IP Range (for Network objects) */}
                                        {rdap.objectClassName === 'ip network' && rdap.startAddress && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                                                    <Maximize2 className="h-2.5 w-2.5" /> Range
                                                </div>
                                                <div className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 leading-none">
                                                    {rdap.startAddress} - {rdap.endAddress}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Calendar className="h-3 w-3" /> Important Dates
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Registered:</span>
                                                <span className="font-medium">{rdap.registrationDate ? new Date(rdap.registrationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' }) : 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Expires:</span>
                                                <span className="font-medium text-amber-600 dark:text-amber-400">{rdap.expirationDate ? new Date(rdap.expirationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' }) : 'N/A'}</span>
                                            </div>
                                            {rdap.transferDate && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Transfer:</span>
                                                    <span className="font-medium text-blue-500">{new Date(rdap.transferDate).toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Last Update:</span>
                                                <span className="font-medium text-slate-500">{rdap.lastChangedDate ? new Date(rdap.lastChangedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' }) : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: Contact & Nameservers */}
                                <div className="space-y-6">
                                    {rdap.abuseContact && (
                                        <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <ShieldCheck className="h-3 w-3" /> Abuse Contact
                                            </div>
                                            <div className="space-y-1.5">
                                                {rdap.abuseContact.email && (
                                                    <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                                                        <Mail className="h-3 w-3" /> {rdap.abuseContact.email}
                                                    </div>
                                                )}
                                                {rdap.abuseContact.phone && (
                                                    <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                                                        <Phone className="h-3 w-3" /> {rdap.abuseContact.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Database className="h-3 w-3" /> Nameservers
                                        </div>
                                        <div className="space-y-1">
                                            {(() => {
                                                const nsList = (rdap.nameservers && rdap.nameservers.length > 0)
                                                    ? rdap.nameservers
                                                    : (data.nameservers && data.nameservers.length > 0)
                                                        ? data.nameservers
                                                        : [];

                                                if (nsList.length > 0) {
                                                    return nsList.map((ns, i) => (
                                                        <div key={i} className="text-sm font-mono text-slate-500 dark:text-slate-400">{ns}</div>
                                                    ));
                                                }
                                                return <span className="text-sm">N/A</span>;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Raw JSON Toggle */}
                            <div className="border-t border-slate-200 dark:border-white/5">
                                <button
                                    onClick={() => setExpandedRaw(!expandedRaw)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Database className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">View Full RDAP / WHOIS JSON Response</span>
                                    </div>
                                    <ChevronDown
                                        className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${expandedRaw ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {expandedRaw && (
                                    <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-950">
                                        <pre className="text-[11px] font-mono text-emerald-500 overflow-x-auto p-4 rounded bg-black/50 max-h-[500px] custom-scrollbar text-left">
                                            {JSON.stringify(data.rdapRawData, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })()}
            </div>

            {/* Provider List (outside of capture area) */}
            {displaySettings.showProviderCards && providerConfigs.length > 0 && (
                <div className="space-y-4 mt-8">
                    <div className="flex items-center justify-between px-2 mb-1">
                        <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-indigo-500" />
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest text-[11px]">Provider Breakdown</h3>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Cross-referencing {providerConfigs.length} global databases</span>
                    </div>
                    {providerConfigs.map(config => {
                        const isExpanded = expandedProvider === config.key;
                        const d = config.data as any;
                        const lat = d.latitude || d.lat || (d.loc ? parseFloat(d.loc.split(',')[0]) : 0);
                        const lng = d.longitude || d.lon || (d.loc ? parseFloat(d.loc.split(',')[1]) : 0);

                        return (
                            <Card
                                key={config.key}
                                className="overflow-hidden border-slate-200 dark:border-white/5 shadow-sm transition-all duration-300"
                            >
                                {/* Provider Header */}
                                <button
                                    onClick={() => toggleProvider(config.key)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={`${config.color} font-semibold`}>
                                            {config.name}
                                        </Badge>
                                        {!config.isReal && (
                                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                Simulated
                                            </Badge>
                                        )}
                                        {(() => {
                                            const d = config.data as any;
                                            const city = d.city || d.city_name || d.cityName;
                                            const country = d.country_name || d.countryName || d.country || d.cntry_code || d.countryCode;

                                            if (!country && (!city || city === 'N/A')) return null;

                                            return (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    <span>
                                                        {city && city !== 'N/A' ? `${city}, ` : ''}{country || 'Unknown'}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <ChevronDown
                                        className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-slate-200 dark:border-border">
                                        <div className="grid md:grid-cols-2 gap-4 p-4">
                                            {/* Data Table */}
                                            <div className="space-y-2">
                                                {config.fields.map((field, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="grid grid-cols-2 gap-4 py-2 border-b border-slate-100 dark:border-border last:border-0"
                                                    >
                                                        <div className="text-sm text-muted-foreground">{field.label}</div>
                                                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 break-all">
                                                            {field.value || 'N/A'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Map */}
                                            {lat !== 0 && lng !== 0 && (
                                                <div className="h-[300px] rounded-lg overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner">
                                                    <MapWrapper
                                                        lat={lat}
                                                        lng={lng}
                                                        city={(config.data as any).city || 'Unknown'}
                                                        country={(config.data as any).country || (config.data as any).country_name || 'Unknown'}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
