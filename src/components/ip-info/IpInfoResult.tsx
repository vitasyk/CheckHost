import { IpInfoResponse } from '@/types/ip-info';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, ChevronDown, Database, Calendar, ShieldCheck, Mail, Phone, ExternalLink, Server, Network, Maximize2, Camera, Copy, Check } from 'lucide-react';
import MapWrapper from '@/components/ip-info/MapWrapper';
import { getCountryCoords } from '@/lib/country-coords';
import { parseRdapData } from '@/lib/rdap-parser';
import { useState, useEffect, useRef } from 'react';
import { toPng, toBlob } from 'html-to-image';

interface IpInfoResultProps {
    data: IpInfoResponse;
}

export default function IpInfoResult({ data }: IpInfoResultProps) {
    const { providers } = data;
    const screenshotRef = useRef<HTMLDivElement>(null);
    const [expandedProvider, setExpandedProvider] = useState<string | null>('maxmind');
    const [expandedRaw, setExpandedRaw] = useState(false);
    const [displaySettings, setDisplaySettings] = useState({
        showFeaturedMap: false,
        showRdapData: false,
        showProviderCards: false
    });
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Add timestamp to prevent caching
                const res = await fetch(`/api/admin/settings?key=ip_info_display&t=${Date.now()}`);
                if (res.ok) {
                    const settings = await res.json();
                    if (settings) {
                        setDisplaySettings(settings);
                    } else {
                        // Fallback to defaults if no settings in DB
                        setDisplaySettings({
                            showFeaturedMap: true,
                            showRdapData: true,
                            showProviderCards: true
                        });
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch IP Info display settings:', err);
                // Fallback on error
                setDisplaySettings({
                    showFeaturedMap: true,
                    showRdapData: true,
                    showProviderCards: true
                });
            } finally {
                setSettingsLoaded(true);
            }
        };
        fetchSettings();
    }, []);

    const toggleProvider = (provider: string) => {
        setExpandedProvider(expandedProvider === provider ? null : provider);
    };

    const [copied, setCopied] = useState(false);

    const captureOptions = {
        pixelRatio: 2,
        cacheBust: true,
        filter: (node: HTMLElement) => !node.classList?.contains('screenshot-hide')
    };

    const handleScreenshot = async () => {
        if (screenshotRef.current) {
            try {
                const dataUrl = await toPng(screenshotRef.current, captureOptions);
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `${data.ip}-info-report.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (err) {
                console.error('Screenshot failed:', err);
            }
        }
    };

    const handleCopyToClipboard = async () => {
        if (screenshotRef.current) {
            try {
                const blob = await toBlob(screenshotRef.current, captureOptions);
                if (blob) {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }
            } catch (err) {
                console.error('Copy to clipboard failed:', err);
            }
        }
    };

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

    if (providerConfigs.length === 0) {
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
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Screenshot area: Target IP + Domain Registration */}
            <div ref={screenshotRef} className="space-y-4 bg-slate-50 dark:bg-slate-900 rounded-xl p-1 relative group/screenshot">
                {/* Hover-reveal floating action buttons */}
                <div className="screenshot-hide absolute top-3 right-3 z-10 flex items-center gap-1 opacity-0 group-hover/screenshot:opacity-100 transition-all duration-300">
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
                {/* Unified Summary Header Bar - Premium UI/UX */}
                <Card className="p-4 border-slate-200 dark:border-border bg-white/50 dark:bg-card shadow-sm">
                    <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                        {/* Focus: IP & Hostname */}
                        <div className="flex items-center gap-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-border pb-4 lg:pb-0 lg:pr-8 w-full lg:w-auto">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex-1 lg:flex-none min-w-[140px]">
                                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">Target IP</div>
                                <div className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 leading-none">
                                    {data.ip}
                                    <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-slate-100 dark:bg-white/5 text-slate-500 rounded-md font-bold">
                                        {providerConfigs.length}
                                    </Badge>
                                </div>
                                {data.hostname && (
                                    <div className="text-xs font-mono text-slate-400 line-clamp-1 mt-1">{data.hostname}</div>
                                )}
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
                </Card>

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

                    return (
                        <Card className="overflow-hidden border-slate-200 dark:border-white/5 shadow-md">
                            <div className="flex flex-col md:flex-row h-[350px]">
                                {/* Map Side */}
                                <div className="flex-1 relative min-h-[200px] md:min-h-0">
                                    <MapWrapper
                                        lat={featuredLat}
                                        lng={featuredLng}
                                        city={providers.ipinfo?.city || providers.ipapi?.city || "Unknown Location"}
                                        country={providers.ipinfo?.country_name || providers.ipapi?.country || ""}
                                    />
                                    <div className="absolute top-4 left-4 z-[10] flex gap-2">
                                        <Badge className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 backdrop-blur shadow-sm border-slate-200/50 dark:border-white/10 py-1.5 px-3">
                                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                                            {featuredLat.toFixed(4)}, {featuredLng.toFixed(4)}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Location Details Side */}
                                <div className="w-full md:w-[300px] bg-slate-50/50 dark:bg-slate-900/50 p-6 flex flex-col justify-between border-l border-slate-200 dark:border-white/5">
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-4">Location Context</div>
                                        <div className="space-y-5">
                                            <div>
                                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                                    {providers.ipinfo?.city || providers.ipapi?.city || "Unknown"}
                                                </div>
                                                <div className="text-sm text-slate-500 font-medium">
                                                    {providers.ipinfo?.region || providers.ipapi?.regionName || ""}, {providers.ipinfo?.country_name || providers.ipapi?.country || ""}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-center text-indigo-500">
                                                        <Globe className="h-4 w-4" />
                                                    </div>
                                                    <div className="text-xs">
                                                        <div className="text-slate-400 font-medium uppercase tracking-wider">Source</div>
                                                        <div className="font-bold text-slate-700 dark:text-slate-300">{sourceName} Precision</div>
                                                    </div>
                                                </div>

                                                {providers.ipinfo?.timezone && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-center text-amber-500">
                                                            <Calendar className="h-4 w-4" />
                                                        </div>
                                                        <div className="text-xs">
                                                            <div className="text-slate-400 font-medium uppercase tracking-wider">Local Time</div>
                                                            <div className="font-bold text-slate-700 dark:text-slate-300">{providers.ipinfo.timezone}</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-white/5">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Internal Tags</div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="text-[10px] bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
                                                {providers.ipinfo?.postal || providers.ipapi?.zip || "No Zip"}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
                                                {providers.ipinfo?.continent_code || "Global"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })()}

                {/* RDAP / WHOIS Data Section - Moved to top per user request */}
                {displaySettings.showRdapData && data.rdapRawData && (() => {
                    const rdap = parseRdapData(data.rdapRawData);
                    return (
                        <Card className="border-slate-200 dark:border-white/5 overflow-hidden transition-all duration-300">
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
                                                <span className="font-medium">{rdap.registrationDate ? new Date(rdap.registrationDate).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Expires:</span>
                                                <span className="font-medium text-amber-600 dark:text-amber-400">{rdap.expirationDate ? new Date(rdap.expirationDate).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                            {rdap.transferDate && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Transfer:</span>
                                                    <span className="font-medium text-blue-500">{new Date(rdap.transferDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Last Update:</span>
                                                <span className="font-medium text-slate-500">{rdap.lastChangedDate ? new Date(rdap.lastChangedDate).toLocaleDateString() : 'N/A'}</span>
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
                                            {rdap.nameservers && rdap.nameservers.length > 0 ? rdap.nameservers.map((ns, i) => (
                                                <div key={i} className="text-sm font-mono text-slate-500 dark:text-slate-400">{ns}</div>
                                            )) : <span className="text-sm">N/A</span>}
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
            {/* End of screenshot area */}

            {/* Provider Cards */}
            {displaySettings.showProviderCards && (
                <div className="grid gap-4">
                    {providerConfigs.map((config) => {
                        const isExpanded = expandedProvider === config.key;
                        let lat = 0, lng = 0;

                        // Extract coordinates based on provider
                        if (config.key === 'maxmind' && providers.maxmind) {
                            lat = providers.maxmind.latitude;
                            lng = providers.maxmind.longitude;
                        } else if (config.key === 'maxmind_local' && providers.maxmind_local) {
                            lat = providers.maxmind_local.latitude;
                            lng = providers.maxmind_local.longitude;
                        } else if (config.key === 'ipinfo' && providers.ipinfo?.loc) {
                            [lat, lng] = providers.ipinfo.loc.split(',').map(parseFloat);
                        } else if (config.key === 'ipapi' && providers.ipapi) {
                            lat = providers.ipapi.lat;
                            lng = providers.ipapi.lon;
                        } else if (config.key === 'ip2location' && providers.ip2location) {
                            lat = providers.ip2location.latitude;
                            lng = providers.ip2location.longitude;
                        } else if (config.key === 'ipgeolocation' && providers.ipgeolocation) {
                            lat = parseFloat(providers.ipgeolocation.latitude);
                            lng = parseFloat(providers.ipgeolocation.longitude);
                        }

                        // Fallback to country coordinates if still 0
                        if (lat === 0 || lng === 0) {
                            const countryData = config.data as any;
                            const countryCode =
                                countryData.countryCode ||
                                countryData.country_code ||
                                countryData.country_code2 ||
                                countryData.cntry_code ||
                                (config.key === 'ipinfo' ? countryData.country : null);

                            const coords = getCountryCoords(countryCode);
                            if (coords) {
                                [lat, lng] = coords;
                            }
                        }

                        return (
                            <Card
                                key={config.key}
                                className="overflow-hidden border-slate-200 dark:border-white/5 transition-all duration-300"
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
                                            // Robust field mapping for city and country across all providers
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
                                        className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
                                            }`}
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
