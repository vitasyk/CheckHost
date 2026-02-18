'use client';

import { useState, useMemo, Fragment } from 'react';
import type { ResultsResponse, Node, MtrHop } from '@/types/checkhost';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Clock, Search, Grip, List as ListIcon, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { DnsRecordsTable } from './DnsRecordsTable';
import { DnsDashboard } from './DnsDashboard';
import { MtrDashboard } from './MtrDashboard';

interface ResultsDisplayProps {
    results: ResultsResponse;
    checkType: string;
    nodes?: Record<string, Node>;
    activeNodes?: Record<string, any>;
    onPingIp?: (ip: string) => void;
    dnsType?: string;
    targetHost?: string;
    isLoading?: boolean;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function ResultsDisplay({ results, checkType, nodes = {}, activeNodes = {}, onPingIp, dnsType, targetHost, isLoading, onRefresh, isRefreshing }: ResultsDisplayProps) {
    const [groupBy, setGroupBy] = useState<'none' | 'region'>('none');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (nodeId: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    };

    // Helper to get country flag
    const getFlag = (countryCode: string) => {
        if (!countryCode) return '🌐';
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    };

    const getRegionByCountry = (code: string): string => {
        const upperCode = code.toUpperCase();
        const europe = ['UA', 'DE', 'FR', 'GB', 'NL', 'PL', 'IT', 'ES', 'PT', 'CZ', 'BG', 'RO', 'MD', 'RU', 'FI', 'SE', 'CH', 'AT', 'HU', 'LT', 'RS', 'TR', 'CY', 'SI', 'DK', 'NO', 'IE', 'BE', 'GR', 'EE', 'LV', 'SK', 'HR', 'BA', 'MK', 'AL'];
        const americas = ['US', 'CA', 'BR', 'MX', 'AR', 'CL', 'CO', 'PE'];
        const asia = ['IN', 'JP', 'KR', 'SG', 'HK', 'ID', 'TH', 'VN', 'KZ', 'IR', 'IL', 'AE', 'CN', 'TW', 'MY', 'PH', 'PK', 'SA'];

        if (europe.includes(upperCode)) return 'Europe';
        if (americas.includes(upperCode)) return 'Americas';
        if (asia.includes(upperCode)) return 'Asia / Pacific';
        return 'Other';
    };

    const getLocationInfo = (nodeId: string) => {
        // Try to find in dynamic nodes list first
        const node = nodes[nodeId] || Object.values(nodes).find(n => n.id === nodeId);

        if (node) {
            return {
                country: node.country,
                city: node.city,
                flag: getFlag(node.countryCode),
                region: getRegionByCountry(node.countryCode)
            };
        }

        // Check activeNodes metadata if available (API returns basic location info there too)
        if (activeNodes[nodeId]) {
            const data = activeNodes[nodeId] as string[];
            if (Array.isArray(data) && data.length >= 3) {
                const countryCode = data[0].toUpperCase();
                return {
                    country: data[1],
                    city: data[2],
                    flag: getFlag(countryCode),
                    region: getRegionByCountry(countryCode)
                };
            }
        }

        // Fallback parsing from ID (e.g. "us1.node.check-host.net")
        const parts = nodeId.split('.');
        const code = parts[0].substring(0, 2).toUpperCase();

        return {
            country: code,
            city: 'Unknown Location',
            flag: getFlag(code),
            region: getRegionByCountry(code)
        };
    };

    // Memoize entries to prevent unnecessary recalculations and flickering
    const entries = useMemo(() => {
        const nodeIds = Object.keys(activeNodes).length > 0 ? Object.keys(activeNodes) : Object.keys(results);
        return nodeIds.map(id => [id, results[id] || null] as [string, any | null]);
    }, [results, activeNodes]);

    // Memoize filtered results
    const filteredEntries = useMemo(() => {
        return entries.filter(([nodeId]) => {
            const loc = getLocationInfo(nodeId);
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                loc.country.toLowerCase().includes(query) ||
                loc.city.toLowerCase().includes(query) ||
                nodeId.toLowerCase().includes(query)
            );
        });
    }, [entries, searchQuery, nodes, activeNodes]);

    // Memoize grouped results
    const groupedEntries = useMemo(() => {
        return groupBy === 'region'
            ? filteredEntries.reduce((acc, entry) => {
                const region = getLocationInfo(entry[0]).region;
                if (!acc[region]) acc[region] = [];
                acc[region].push(entry);
                return acc;
            }, {} as Record<string, typeof entries>)
            : { 'All Locations': filteredEntries };
    }, [filteredEntries, groupBy, nodes, activeNodes]);

    const getStatus = (result: any): 'success' | 'error' | 'loading' => {
        // Special handling for MTR to allow immediate "PROBING/RESOLVING" states
        if (checkType === 'mtr') {
            if (result === null) return 'success';
            if (Array.isArray(result)) {
                if (result.length > 1 && result[0] === null && typeof result[1] === 'object' && result[1] !== null) {
                    return 'error';
                }
                return 'success';
            }
        }

        if (result === null) return 'loading';

        // Check if it's an empty array (often happens during initial ping/http setup)
        if (Array.isArray(result) && result.length === 0) return 'loading';

        // Extract firstResult safely
        const firstResult = Array.isArray(result) && result.length > 0 ? result[0] : result;

        if (firstResult === null) return 'loading';

        if (Array.isArray(result) && result.length > 0) {
            // CheckHost API returns strings for some errors
            if (typeof firstResult === 'string') {
                if (firstResult.toUpperCase().includes('ERROR')) return 'error';
                return 'success';
            }

            // Ping results - last check to avoid catching MTR partials
            if (Array.isArray(firstResult) && checkType === 'ping') {
                return 'success';
            }
        }

        // HTTP/TCP/UDP results
        if (typeof firstResult === 'object' && firstResult !== null) {
            // If it's an array (Ping style results) but checkType isn't ping, handle as success
            if (Array.isArray(firstResult)) return 'success';

            // If it has error property
            if ('error' in firstResult && (firstResult as any).error) return 'error';

            // For DNS, if it has any record type it's a success
            if (checkType === 'dns') {
                const dnsKeys = ['A', 'AAAA', 'MX', 'CNAME', 'NS', 'TXT', 'PTR'];
                const hasRecord = dnsKeys.some(key => (key as any) in firstResult);
                return hasRecord ? 'success' : 'error';
            }
            return 'success';
        }

        // Handle error cases in result object itself
        if (result && typeof result === 'object' && 'error' in result) return 'error';

        return 'error';
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

        // Deep traversal to find the hops list.
        const extractHops = (data: any, depth = 0): any[] | null => {
            if (!Array.isArray(data) || data.length === 0) return null;
            if (depth > 5) return null; // Prevent stack overflow on circular structures

            for (const item of data) {
                if (Array.isArray(item)) {
                    if (item.length > 0) {
                        const first = item[0];
                        // If the first item is an object (or null!) and NOT an array, it's a probe!
                        // This handles cases where the first probe is a timeout (null)
                        const isProbe = (v: any) => v === null || (typeof v === 'object' && !Array.isArray(v));

                        if (isProbe(first)) {
                            return data; // Found the list of hops (each hop is an array of probes)
                        }

                        // Recurse deeper
                        const deeper = extractHops(item, depth + 1);
                        if (deeper) return deeper;
                    } else if (data.length > 1) {
                        // Found array of empty arrays (placeholders) which might be a hops list of empty hops
                        // But usually we want to keep looking for actual data
                        continue;
                    }
                }
            }
            return null;
        };

        let rawHops = extractHops(rawResult);

        // Ultimate fallback: if we have a deep array but extractHops failed (e.g. all nulls), 
        // try to interpret the top level as hops if reasonable.
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

            // Process probes (handling potential nesting like [[{host:...}]])
            hopProbes.forEach((p: any) => {
                if (Array.isArray(p)) p.forEach(processProbe);
                else processProbe(p);
            });

            // Even if we found nothing (all nulls), we should return a "Loss 100%" row rather than null,
            // so the user sees line items for every hop.
            // Only return null if the hop structure itself was empty/invalid
            if (totalSent === 0 && lastHost === '???') {
                // Try to return a skeleton if possible, or null
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


    const formatTTL = (seconds: any): string => {
        if (seconds === null || seconds === undefined) return '-';
        const sec = parseInt(seconds);
        if (isNaN(sec)) return '-';

        if (sec < 60) return `${sec}s`;
        if (sec < 3600) {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${m}m ${s}s`;
        }
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;

        let res = `${h}h`;
        if (m > 0) res += ` ${m}m`;
        if (s > 0) res += ` ${s}s`;
        return res;
    };

    const getMtrSummary = (result: any) => {
        if (!result) {
            return {
                count: 0,
                loss: 0,
                avgText: '-'
            };
        }
        const hops = processMtrData(result);
        if (hops.length === 0) {
            return {
                count: 0,
                loss: 0,
                avgText: '-'
            };
        }

        const lastHop = hops[hops.length - 1];
        return {
            count: hops.length,
            loss: lastHop?.loss || 0,
            avgText: lastHop ? `${lastHop.avg.toFixed(1)}ms` : '-'
        };
    };

    const renderMtrResult = (result: any, nodeId: string) => {
        const location = getLocationInfo(nodeId);
        return (
            <MtrDashboard
                result={result}
                nodeCity={location.city}
                onPingIp={onPingIp}
                targetHost={targetHost}
            />
        );
    };

    const renderResult = (result: any) => {
        if (result === null) return '';

        if (Array.isArray(result) && result.length > 0) {
            const firstResult = result[0];

            if (firstResult === null) return '';

            // Handle string results
            if (typeof firstResult === 'string') return firstResult;

            // Ping results
            if (Array.isArray(firstResult)) {
                const okResults = firstResult.filter((r: any) => Array.isArray(r) && r[0] === 'OK');
                if (okResults.length > 0) {
                    const avgTime = okResults.reduce((sum: number, r: any) => sum + r[1], 0) / okResults.length;
                    return (
                        <span>
                            <span className="font-semibold text-green-600 dark:text-green-400">{okResults.length}/4 OK</span>
                            <span className="text-muted-foreground ml-2">avg {avgTime.toFixed(1)}ms</span>
                        </span>
                    );
                }
                return <span className="text-destructive">All packets lost</span>;
            }

            // HTTP results
            if (typeof firstResult === 'object' && firstResult !== null && 'statusCode' in firstResult) {
                const code = parseInt(firstResult.statusCode || '0');
                const isOk = code >= 200 && code < 300;
                return (
                    <span className={cn("font-medium", isOk ? "text-green-600 dark:text-green-400" : "text-amber-600")}>
                        {firstResult.statusCode} {firstResult.statusText || ''}
                    </span>
                );
            }

            // TCP/UDP results
            if (typeof firstResult === 'object' && firstResult !== null && 'address' in firstResult) {
                if (firstResult.error) return <span className="text-destructive">Error: {firstResult.error}</span>;
                return (
                    <span>
                        Connected to <span className="font-mono">{firstResult.address}</span>
                    </span>
                );
            }

            // DNS-All results (Advanced Table)
            if (checkType === 'dns-all' && typeof firstResult === 'object' && firstResult !== null) {
                return <DnsRecordsTable result={firstResult} />;
            }

            // Standard DNS results (Simple List)
            if (checkType === 'dns' && typeof firstResult === 'object' && firstResult !== null) {
                const records: string[] = [];
                // Prioritize common records
                if (firstResult.A) firstResult.A.forEach((r: any) => records.push(`A: ${r}`));
                if (firstResult.AAAA) firstResult.AAAA.forEach((r: any) => records.push(`AAAA: ${r}`));
                if (firstResult.MX) firstResult.MX.forEach((r: any) => records.push(`MX: ${Array.isArray(r) ? r[1] : r}`));
                if (firstResult.CNAME) firstResult.CNAME.forEach((r: any) => records.push(`CNAME: ${r}`));
                if (firstResult.NS) firstResult.NS.forEach((r: any) => records.push(`NS: ${r}`));
                if (firstResult.TXT) firstResult.TXT.forEach((r: any) => records.push(`TXT: ${r}`));
                if (firstResult.PTR) firstResult.PTR.forEach((r: any) => records.push(`PTR: ${r}`));

                if (records.length === 0) return <span className="text-muted-foreground italic">No records</span>;

                return (
                    <div className="flex flex-col gap-1 text-xs">
                        {records.map((r, i) => (
                            <div key={i} className="font-mono text-slate-600 dark:text-slate-300">
                                {r}
                            </div>
                        ))}
                    </div>
                );
            }
        }

        return <span className="text-destructive">Error</span>;
    };

    const getTTL = (result: any): string => {
        if (result === null) return '-';
        if (Array.isArray(result) && result.length > 0) {
            const firstResult = result[0];

            if (firstResult === null) return '-';

            // Ping
            if (Array.isArray(firstResult)) {
                const okResults = firstResult.filter((r: any) => Array.isArray(r) && r[0] === 'OK');
                if (okResults.length > 0) {
                    const avgTime = okResults.reduce((sum: number, r: any) => sum + r[1], 0) / okResults.length;
                    return `${avgTime.toFixed(0)}ms`;
                }
            }
            // HTTP time
            if (typeof firstResult === 'object' && firstResult !== null && 'time' in firstResult) {
                return `${(firstResult.time).toFixed(3)}s`;
            }
            // DNS results
            if (typeof firstResult === 'object' && firstResult !== null && 'TTL' in firstResult) {
                return formatTTL(firstResult.TTL);
            }
        }

        return '-';
    };

    const getStatusIcon = (status: 'success' | 'error' | 'loading') => {
        switch (status) {
            case 'success':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'loading':
                return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
        }
    };

    const getPingStats = (result: any) => {
        if (!result || !Array.isArray(result) || result.length === 0) return null;

        const firstResult = result[0];

        if (!Array.isArray(firstResult)) return null;

        // CheckHost Ping results: [ [["OK", time, ip], ["OK", time], ...] ]
        // firstResult is the array of packets

        let packets: any[] = [];
        let ip = '-';

        // Valid packets must be arrays with at least 2 elements [status, time]
        // We interpret "OK" status as success
        packets = firstResult.filter((r: any) =>
            Array.isArray(r) &&
            r.length >= 2 &&
            (String(r[0]).toUpperCase().includes('OK')) &&
            // Ensure time is valid number
            !isNaN(parseFloat(r[1])) && parseFloat(r[1]) > 0
        );

        // Find IP using Regex from any packet that has it within firstResult
        const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
        const packetWithIp = firstResult.find((r: any) =>
            Array.isArray(r) &&
            r.length >= 3 &&
            typeof r[2] === 'string' &&
            ipRegex.test(r[2])
        );

        if (packetWithIp) {
            const match = packetWithIp[2].match(ipRegex);
            if (match) ip = match[0];
        }

        const sent = firstResult.length; // Usually 4
        const received = packets.length;

        if (received === 0) {
            return { sent, received, min: null, avg: null, max: null, ip };
        }

        // r[1] is time in seconds
        const times = packets.map((r: any) => {
            const t = parseFloat(r[1]);
            return isNaN(t) ? 0 : t * 1000;
        });

        const min = Math.min(...times).toFixed(1);
        const max = Math.max(...times).toFixed(1);
        const avg = (times.reduce((a: number, b: number) => a + b, 0) / times.length).toFixed(1);

        return { sent, received, min, avg, max, ip };
    };

    const successCount = entries.filter(([_, result]) => result !== null).length;
    const totalCount = entries.length;

    return (
        <div className="space-y-4 mt-8">
            {/* Controls Header (hidden for dns-all single-block view) */}
            {checkType !== 'dns-all' && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Results</h3>
                            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                                {successCount} / {totalCount}
                            </Badge>
                        </div>

                        <div className="h-4 w-px bg-border" />

                        <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as 'none' | 'region')}>
                            <TabsList className="h-10 p-1 bg-slate-200/40 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-white/5">
                                <TabsTrigger
                                    value="none"
                                    className="h-8 px-4 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200"
                                >
                                    <ListIcon className="h-3.5 w-3.5 mr-2" />
                                    <span className="font-semibold text-xs">List</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="region"
                                    className="h-8 px-4 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all duration-200"
                                >
                                    <Grip className="h-3.5 w-3.5 mr-2" />
                                    <span className="font-semibold text-xs">Region</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter locations..."
                                className="pl-8 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Special Display for DNS Info (Single Block) */}
            {checkType === 'dns-all' ? (
                <div className="space-y-4">
                    {entries.length > 0 && entries[0][1] ? (
                        <DnsDashboard
                            result={entries[0][1]}
                            nodeCity={entries[0][0] ? getLocationInfo(entries[0][0]).city : undefined}
                            filterType={dnsType}
                            onRefresh={onRefresh}
                            isRefreshing={isRefreshing}
                        />
                    ) : (
                        <div className="text-center p-12 text-muted-foreground">
                            {entries.length > 0 ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                    <span>Fetching records...</span>
                                </div>
                            ) : (
                                <span>Waiting for results...</span>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedEntries).map(([groupName, groupEntries]) => (
                        groupEntries.length > 0 && (
                            <div key={groupName} className="space-y-3">
                                {groupBy === 'region' && (
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-muted-foreground uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-blue-500" />
                                        {groupName} <span className="text-[10px] opacity-70 font-medium">({groupEntries.length})</span>
                                    </h4>
                                )}

                                <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-white/5">
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead className="w-[250px]">Location</TableHead>
                                                {checkType === 'ping' && (
                                                    <Fragment>
                                                        <TableHead>Result</TableHead>
                                                        <TableHead>RTT (min/avg/max)</TableHead>
                                                        <TableHead className="text-right">IP Address</TableHead>
                                                    </Fragment>
                                                )}
                                                {checkType === 'mtr' && (
                                                    <Fragment>
                                                        <TableHead>Hops</TableHead>
                                                        <TableHead>Avg Latency</TableHead>
                                                        <TableHead className="text-right">Loss</TableHead>
                                                        <TableHead className="w-10"></TableHead>
                                                    </Fragment>
                                                )}
                                                {checkType !== 'ping' && checkType !== 'mtr' && (
                                                    <Fragment>
                                                        <TableHead>Result</TableHead>
                                                        <TableHead className="text-right w-[140px]">
                                                            {checkType === 'dns' ? 'TTL' : 'Time'}
                                                        </TableHead>
                                                    </Fragment>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {groupEntries.map(([nodeId, result]) => {
                                                const status = getStatus(result);
                                                const location = getLocationInfo(nodeId);
                                                const isLoading = status === 'loading';

                                                if (checkType === 'ping') {
                                                    const stats = getPingStats(result);
                                                    return (
                                                        <TableRow key={nodeId} className="h-[34px] hover:bg-blue-50/50 dark:hover:bg-blue-900/10 even:bg-slate-100/70 dark:even:bg-white/[0.05] transition-colors border-b border-slate-100/50 dark:border-white/5 last:border-0 group">
                                                            <TableCell className="w-[50px] text-center">
                                                                <div className="flex items-center justify-center h-5">
                                                                    {isLoading ? (
                                                                        <div className="relative flex h-3 w-3">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                                                        </div>
                                                                    ) : getStatusIcon(status)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-lg leading-none">{location.flag}</span>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium text-sm">{location.country}, {location.city}</span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center h-5">
                                                                    {isLoading ? (
                                                                        <div className="h-1.5 w-24 bg-primary/20 rounded-full overflow-hidden">
                                                                            <div className="h-full bg-primary/50 animate-progress"></div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-sm font-medium">
                                                                            {stats ? `${stats.received} / ${stats.sent}` : '0 / 4'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                                                    {stats && stats.min !== null ? (
                                                                        <span>
                                                                            {stats.min} / {stats.avg} / {stats.max} ms
                                                                        </span>
                                                                    ) : '-'}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                                                                {stats?.ip ? (
                                                                    stats.ip.includes(':') ? (
                                                                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">{stats.ip}</span>
                                                                    ) : stats.ip
                                                                ) : '-'}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }

                                                // Non-ping results
                                                // const resultText = getResultText(result); // Old text-only way
                                                const ttl = getTTL(result);

                                                return (
                                                    <Fragment key={nodeId}>
                                                        <TableRow key={nodeId} className="h-[34px] hover:bg-blue-50/50 dark:hover:bg-blue-900/10 even:bg-slate-100/70 dark:even:bg-white/[0.05] transition-colors border-b border-slate-100/50 dark:border-white/5 last:border-0 group cursor-pointer" onClick={() => checkType === 'mtr' && toggleRow(nodeId)}>
                                                            <TableCell className="w-[50px] text-center">
                                                                <div className="flex items-center justify-center h-5">
                                                                    {isLoading ? (
                                                                        <div className="relative flex h-3 w-3">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                                                        </div>
                                                                    ) : getStatusIcon(status)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-lg leading-none">{location.flag}</span>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium text-sm">{location.country}, {location.city}</span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-mono text-sm">
                                                                {isLoading ? (
                                                                    <span className="text-muted-foreground animate-pulse">Checking...</span>
                                                                ) : checkType === 'mtr' ? (
                                                                    result === null || processMtrData(result).length === 0 ? (
                                                                        <span className="text-[10px] font-bold text-indigo-500/60 animate-pulse tracking-tight">
                                                                            {targetHost && /^[0-9.]+$/.test(targetHost) ? 'PROBING...' : 'RESOLVING...'}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-sm font-medium">{getMtrSummary(result)?.count} hops</span>
                                                                    )
                                                                ) : (
                                                                    renderResult(result)
                                                                )}
                                                            </TableCell>
                                                            {checkType === 'mtr' ? (
                                                                <Fragment>
                                                                    <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                                                        {getMtrSummary(result)?.avgText}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Badge variant={getMtrSummary(result)?.loss ? "error" : "outline"} className="h-5 px-1.5 text-[10px]">
                                                                            {getMtrSummary(result) ? `${getMtrSummary(result)!.loss.toFixed(1)}%` : '0.0%'}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="p-0 text-center">
                                                                        {expandedRows.has(nodeId) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                                    </TableCell>
                                                                </Fragment>
                                                            ) : (
                                                                <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                                                                    {ttl}
                                                                </TableCell>
                                                            )}
                                                        </TableRow>
                                                        {checkType === 'mtr' && expandedRows.has(nodeId) && (
                                                            <TableRow className="bg-slate-50/30 dark:bg-white/[0.01] hover:bg-slate-50/30 dark:hover:bg-white/[0.01]">
                                                                <TableCell colSpan={6} className="p-0">
                                                                    {renderMtrResult(result, nodeId)}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )
                    ))}

                    {filteredEntries.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                    <span className="text-sm font-bold uppercase tracking-widest text-indigo-500/60">Connecting to global network...</span>
                                </div>
                            ) : (
                                `No locations found matching "${searchQuery}"`
                            )}
                        </div>
                    )}
                </div>
            )}

            <style jsx global>{`
                @keyframes progress {
                    0% { width: 0%; transform: translateX(-100%); }
                    50% { width: 50%; transform: translateX(0%); }
                    100% { width: 100%; transform: translateX(100%); }
                }
                .animate-progress {
                    animation: progress 1.5s infinite linear;
                }
            `}</style>
        </div >
    );
}
