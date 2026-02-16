import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DnsResult } from '@/types/checkhost';

interface DnsRecord {
    type: string;
    value: string;
    auxiliary?: string;
    ttl: string;
    priority?: number;
}

interface DnsRecordsTableProps {
    result: DnsResult;
    className?: string;
}

export function DnsRecordsTable({ result, className }: DnsRecordsTableProps) {
    // Parse the result into a flat list of records
    const records: DnsRecord[] = [];

    const formatTTL = (seconds: number | null): string => {
        if (seconds === null || seconds === undefined) return '-';
        const sec = typeof seconds === 'string' ? parseInt(seconds) : seconds;
        if (isNaN(sec)) return '-';
        return sec.toString();
    };

    const globalTTL = formatTTL(result.TTL);

    // New format: records array from /api/dns-lookup
    if ((result as any).records && Array.isArray((result as any).records)) {
        (result as any).records.forEach((r: any) => {
            records.push({
                type: r.type,
                value: r.value,
                priority: r.priority,
                auxiliary: r.auxiliary,
                ttl: r.ttl ? r.ttl.toString() : globalTTL
            });
        });
    } else {
        // Old format: grouped by type
        // Helper to add records
        const addRecords = (type: string, items?: any[]) => {
            if (!items || !Array.isArray(items)) return;

            items.forEach(item => {
                if (type === 'MX') {
                    // MX records are usually [priority, host]
                    if (Array.isArray(item) && item.length >= 2) {
                        records.push({
                            type,
                            value: item[1],
                            priority: parseInt(item[0]),
                            auxiliary: `priority:${item[0]}`,
                            ttl: globalTTL
                        });
                    }
                } else if (type === 'SOA') {
                    records.push({
                        type,
                        value: typeof item === 'string' ? item : JSON.stringify(item),
                        ttl: globalTTL
                    });
                } else {
                    records.push({
                        type,
                        value: typeof item === 'string' ? item : JSON.stringify(item),
                        ttl: globalTTL
                    });
                }
            });
        };

        if (result.A) addRecords('A', result.A);
        if (result.AAAA) addRecords('AAAA', result.AAAA);
        if (result.MX) addRecords('MX', result.MX);
        if (result.NS) addRecords('NS', result.NS);
        if (result.TXT) addRecords('TXT', result.TXT);
        if (result.CNAME) addRecords('CNAME', result.CNAME);
        if (result.PTR) addRecords('PTR', result.PTR);
    }

    // CheckHost sometimes puts SOA in a specific way or as part of TXT if raw? 
    // Usually it's a specific type query. If we query 'soa', the result might be in a different field
    // or just not parsed by the default DnsResult interface yet.
    // For now we use what we have in DnsResult.

    if (records.length === 0) {
        return <div className="text-sm text-muted-foreground italic p-2">No records found</div>;
    }

    return (
        <div className={cn("rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden", className)}>
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableHead className="w-[80px] text-xs font-bold uppercase">Type</TableHead>
                        <TableHead className="text-xs font-bold uppercase">Value</TableHead>
                        <TableHead className="w-[150px] text-xs font-bold uppercase hidden sm:table-cell">Auxiliary</TableHead>
                        <TableHead className="w-[80px] text-xs font-bold uppercase text-right">TTL</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((record, index) => (
                        <TableRow key={index} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                            <TableCell className="py-1 font-medium">
                                <Badge variant="outline" className="font-bold text-[10px] min-w-[40px] justify-center">
                                    {record.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-1 font-mono text-xs break-all">
                                {record.value}
                            </TableCell>
                            <TableCell className="py-1 text-xs text-muted-foreground hidden sm:table-cell">
                                {record.auxiliary || '-'}
                            </TableCell>
                            <TableCell className="py-1 text-xs text-right font-mono text-muted-foreground">
                                {record.ttl}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
