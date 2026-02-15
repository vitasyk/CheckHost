import { Metadata } from 'next';
import { getMockIpInfo } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Globe, Server, Network, Info } from 'lucide-react';
import MapWrapper from '@/components/ip-info/MapWrapper';

export const metadata: Metadata = {
    title: 'IP Information - CheckHost Clone',
    description: 'Detailed IP address geolocation and network information',
};



export default async function IpInfoPage({ searchParams }: { searchParams: Promise<{ host?: string }> }) {
    const { host: rawHost } = await searchParams;
    const host = rawHost || '8.8.8.8';
    const data = await getMockIpInfo(host);
    const { providers } = data;
    const primary = providers.maxmind || providers.ipinfo;

    if (!primary) return <div>No data found</div>;

    return (
        <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
            {/* Header / Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="h-6 w-6 text-indigo-500" />
                        IP Info Analysis
                    </h1>
                    <p className="text-muted-foreground">Detailed geolocation and network intelligence</p>
                </div>

                {/* Simple form for now - fully controlled client component would be better for UX but this works for SSR */}
                <form action="/ip-info" method="GET" className="flex gap-2 w-full md:w-auto">
                    <input
                        name="host"
                        defaultValue={host}
                        placeholder="Enter IP or Domain"
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 md:w-[300px]"
                    />
                    <button type="submit" className="h-10 px-4 py-2 bg-indigo-600 text-white rounded-md font-medium text-sm hover:bg-indigo-700 transition-colors">
                        Check
                    </button>
                </form>
            </div>

            {/* Top Section: Summary & Map */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Summary Card */}
                <Card className="p-6 space-y-6 md:col-span-1 border-slate-200 dark:border-white/5 shadow-sm">
                    <div>
                        <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Target Address</div>
                        <div className="text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all">
                            {data.ip}
                        </div>
                        {data.hostname && (
                            <div className="text-sm font-mono text-slate-500 mt-1">{data.hostname}</div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                    {primary.city || 'Unknown City'}, {primary.region || 'Unknown Region'}
                                </div>
                                <div className="text-sm text-slate-500">
                                    {(primary as any).country_name || (primary as any).countryName || primary.country}
                                    {(primary as any).continent ? ` • ${(primary as any).continent}` : ''}
                                    {primary.postal ? ` (${primary.postal})` : ''}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Server className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                    {(primary as any).as_name || primary.org || 'Unknown Org'}
                                </div>
                                <div className="text-sm text-slate-500">
                                    ASN: {(primary as any).asn || (primary as any).as?.split(' ')[0] || 'N/A'}
                                    {(primary as any).as_domain ? ` • ${(primary as any).as_domain}` : ''}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Network className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                    {providers.ip2location?.net_speed || 'Standard'} Connection
                                </div>
                                <div className="text-sm text-slate-500">
                                    Type: {providers.dbip?.connectionType || 'Unknown'}
                                    {(primary as any).anycast ? ' • Anycast' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Right: Interactive Map */}
                <Card className="p-1 md:col-span-2 border-slate-200 dark:border-white/5 shadow-sm h-[350px] relative z-0">
                    <MapWrapper
                        lat={providers.maxmind?.latitude || (providers.ipapi?.lat) || (providers.ipinfo?.loc && providers.ipinfo.loc !== '0,0' ? parseFloat(providers.ipinfo.loc.split(',')[0]) : 0)}
                        lng={providers.maxmind?.longitude || (providers.ipapi?.lon) || (providers.ipinfo?.loc && providers.ipinfo.loc !== '0,0' ? parseFloat(providers.ipinfo.loc.split(',')[1]) : 0)}
                        city={primary.city || 'Unknown City'}
                        country={primary.country || 'Unknown Country'}
                    />
                </Card>
            </div>

            {/* Detailed Comparisons */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Info className="h-5 w-5 text-indigo-500" />
                    Provider Comparison
                </h3>

                <Card className="border-slate-200 dark:border-white/5 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                                <TableHead className="w-[180px]">Provider</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>ISP / Organization</TableHead>
                                <TableHead>Unique Data</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* MaxMind */}
                            {providers.maxmind && (
                                <TableRow>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800">MaxMind</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {providers.maxmind.city}, {providers.maxmind.region}
                                        <div className="text-xs text-muted-foreground">{providers.maxmind.country}</div>
                                    </TableCell>
                                    <TableCell>{providers.maxmind.org}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        Accuracy: {providers.maxmind.accuracyRadius}km | ASN: {providers.maxmind.asn}
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* IPInfo */}
                            {providers.ipinfo && (
                                <TableRow>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50">IPInfo.io</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {providers.ipinfo.city}, {providers.ipinfo.region}
                                        <div className="text-xs text-muted-foreground">{providers.ipinfo.country}</div>
                                    </TableCell>
                                    <TableCell>{providers.ipinfo.org}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        Anycast: {providers.ipinfo.anycast ? 'Yes' : 'No'} | Timezone: {providers.ipinfo.timezone}
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* DB-IP */}
                            {providers.dbip && (
                                <TableRow>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/50">DB-IP</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {providers.dbip.city}, {providers.dbip.stateProv}
                                        <div className="text-xs text-muted-foreground">{providers.dbip.countryName}</div>
                                    </TableCell>
                                    <TableCell>{providers.dbip.isp}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        Connection: {providers.dbip.connectionType}
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* IP2Location */}
                            {providers.ip2location && (
                                <TableRow>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50">IP2Location</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {providers.ip2location.city_name}, {providers.ip2location.region_name}
                                        <div className="text-xs text-muted-foreground">{providers.ip2location.country_name}</div>
                                    </TableCell>
                                    <TableCell>{providers.ip2location.isp}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        Net Speed: {providers.ip2location.net_speed} | Usage: {providers.ip2location.usage_type}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}
