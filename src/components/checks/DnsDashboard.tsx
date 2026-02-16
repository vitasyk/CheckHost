import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Globe, Mail, Server, Key, Clock, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DnsRecord {
    type: string;
    value: string;
    ttl?: number;
    priority?: number;
    auxiliary?: string;
}

interface DnsLookupResult {
    domain: string;
    ip: string | null;
    records: DnsRecord[];
    timestamp: number;
}

interface DnsDashboardProps {
    result: any;
    nodeCity?: string;
}

export function DnsDashboard({ result, nodeCity }: DnsDashboardProps) {
    const [copied, setCopied] = useState(false);

    // Extract the DNS lookup result
    const data: DnsLookupResult | null = (() => {
        if (!result) return null;
        // Direct DNS lookup format: { domain, ip, records, timestamp }
        if (result.records && Array.isArray(result.records)) return result;
        return null;
    })();

    if (!data || !data.records || data.records.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No DNS data available
            </div>
        );
    }

    const records = data.records;

    const handleCopy = () => {
        if (!data) return;

        let text = `DNS Records for ${data.domain}${data.ip ? ` (${data.ip})` : ''}\n`;
        text += `Generated: ${new Date(data.timestamp).toLocaleString()}\n\n`;

        const sections: Record<string, DnsRecord[]> = {
            'Resolution': records.filter(r => ['A', 'AAAA', 'CNAME'].includes(r.type)),
            'Email': records.filter(r => ['MX'].includes(r.type) || (r.type === 'TXT' && (r.value.includes('v=spf1') || r.value.includes('v=DMARC1') || r.value.includes('v=DKIM1')))),
            'Authority': records.filter(r => ['NS', 'SOA'].includes(r.type)),
            'Verification & Other': records.filter(r => r.type === 'PTR' || (r.type === 'TXT' && !r.value.includes('v=spf1') && !r.value.includes('v=DMARC1') && !r.value.includes('v=DKIM1'))),
        };

        Object.entries(sections).forEach(([name, items]) => {
            if (items.length > 0) {
                text += `[${name}]\n`;
                items.forEach(r => {
                    const prefix = r.auxiliary && r.auxiliary.includes('@') ? `${r.auxiliary} : ` : '';
                    const prio = r.priority !== undefined ? ` (pri:${r.priority})` : '';
                    const ttl = r.ttl !== undefined ? ` [${r.ttl}s]` : '';
                    text += `${r.type}: ${prefix}${r.value}${prio}${ttl}\n`;
                });
                text += '\n';
            }
        });

        navigator.clipboard.writeText(text.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Group records by category
    const aRecords = records.filter(r => r.type === 'A');
    const aaaaRecords = records.filter(r => r.type === 'AAAA');
    const cnameRecords = records.filter(r => r.type === 'CNAME');
    const mxRecords = records.filter(r => r.type === 'MX');
    const nsRecords = records.filter(r => r.type === 'NS');
    const soaRecords = records.filter(r => r.type === 'SOA');

    // Split TXT records into categories
    const spfRecords = records.filter(r => r.type === 'TXT' && r.value.includes('v=spf1'));
    const dmarcRecords = records.filter(r => r.type === 'TXT' && (r.value.includes('v=DMARC1') || r.auxiliary === '_dmarc.@'));
    const dkimRecords = records.filter(r => r.type === 'TXT' && (r.value.includes('v=DKIM1') || r.auxiliary?.includes('_domainkey')));

    const otherTxtRecords = records.filter(r =>
        r.type === 'TXT' &&
        !spfRecords.includes(r) &&
        !dmarcRecords.includes(r) &&
        !dkimRecords.includes(r)
    );
    const ptrRecords = records.filter(r => r.type === 'PTR');

    const hasResolution = aRecords.length > 0 || aaaaRecords.length > 0 || cnameRecords.length > 0;
    const hasEmail = mxRecords.length > 0 || spfRecords.length > 0 || dmarcRecords.length > 0 || dkimRecords.length > 0;
    const hasAuthority = nsRecords.length > 0 || soaRecords.length > 0;
    const hasVerification = otherTxtRecords.length > 0 || ptrRecords.length > 0;

    // Count by type for stats
    const typeCounts: Record<string, number> = {};
    records.forEach(r => {
        typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });

    // Section component
    const Section = ({ icon, title, subtitle, children, variant = 'default' }: {
        icon: React.ReactNode;
        title: string;
        subtitle?: string;
        children: React.ReactNode;
        variant?: 'default' | 'email' | 'authority' | 'verification';
    }) => {
        const borderColors = {
            default: 'border-l-indigo-500',
            email: 'border-l-amber-500',
            authority: 'border-l-emerald-500',
            verification: 'border-l-purple-500',
        };

        return (
            <div className={cn("border-l-[3px] pl-5 py-1", borderColors[variant])}>
                <div className="flex items-center gap-2.5 mb-3">
                    <div className="text-muted-foreground">{icon}</div>
                    <div>
                        <h4 className="text-sm font-bold tracking-tight">{title}</h4>
                        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                <div className="space-y-1.5">
                    {children}
                </div>
            </div>
        );
    };

    // Record row component
    const RecordRow = ({ record }: { record: DnsRecord }) => {
        const isSubdomainRecord = record.auxiliary && record.auxiliary.includes('@');

        return (
            <div className="flex items-start gap-3 py-2 px-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors">
                <Badge variant="outline" className="font-bold text-[10px] min-w-[50px] justify-center shrink-0 mt-0.5 border-slate-300 dark:border-slate-600">
                    {record.type}
                </Badge>
                <div className="flex-1 min-w-0">
                    {isSubdomainRecord && (
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mr-2 shrink-0">
                            {record.auxiliary} :
                        </span>
                    )}
                    <span className="font-mono text-xs break-all text-slate-700 dark:text-slate-200 leading-relaxed">
                        {record.value}
                    </span>
                    {(record.auxiliary && !isSubdomainRecord) && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">{record.auxiliary}</div>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {record.priority !== undefined && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px] h-5 px-1.5">
                            pri:{record.priority}
                        </Badge>
                    )}
                    {record.ttl !== undefined && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className="font-mono">{record.ttl}s</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // SPF visual parser
    const SpfRow = ({ record }: { record: DnsRecord }) => {
        const parts = record.value.split(' ').filter(Boolean);
        return (
            <div className="py-2 px-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-bold text-[10px] min-w-[50px] justify-center border-slate-300 dark:border-slate-600">
                        SPF
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">Sender Policy Framework</span>
                </div>
                <div className="flex flex-wrap gap-1.5 ml-[62px]">
                    {parts.map((part, i) => {
                        let color = 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
                        if (part.startsWith('include:')) color = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
                        else if (part.startsWith('ip4:') || part.startsWith('ip6:')) color = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
                        else if (part === '~all' || part === '-all') color = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
                        else if (part === 'mx' || part === 'a') color = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
                        else if (part === 'v=spf1') color = 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';

                        return (
                            <span key={i} className={cn("px-2 py-0.5 rounded-md text-[11px] font-mono font-medium", color)}>
                                {part}
                            </span>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            {/* Summary Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 px-6 py-5 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvZz48L3N2Zz4=')] opacity-50" />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
                            <Globe className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg tracking-tight">
                                {data.domain ? `DNS Records — ${data.domain}` : 'DNS Records'}
                            </h3>
                            <div className="flex items-center gap-3 mt-0.5">
                                {data.ip && <span className="text-white/80 text-sm font-mono">{data.ip}</span>}
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopy}
                        className="bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm border-white/10 transition-all active:scale-95"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Quick stats */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {Object.entries(typeCounts).map(([type, count]) => (
                        <div key={type} className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs">
                            <span className="font-bold">{count}</span> <span className="text-white/70">{type}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sections */}
            <div className="p-6 space-y-8">
                {/* Resolution Section */}
                {hasResolution && (
                    <Section
                        icon={<Globe className="h-4 w-4" />}
                        title="Resolution"
                        subtitle="IP addresses this domain resolves to"
                        variant="default"
                    >
                        {aRecords.map((r, i) => <RecordRow key={`a-${i}`} record={r} />)}
                        {aaaaRecords.map((r, i) => <RecordRow key={`aaaa-${i}`} record={r} />)}
                        {cnameRecords.map((r, i) => <RecordRow key={`cname-${i}`} record={r} />)}
                    </Section>
                )}

                {/* Email Section */}
                {hasEmail && (
                    <Section
                        icon={<Mail className="h-4 w-4" />}
                        title="Email Configuration"
                        subtitle="Mail servers and email security policies"
                        variant="email"
                    >
                        {mxRecords.map((r, i) => <RecordRow key={`mx-${i}`} record={r} />)}
                        {spfRecords.map((r, i) => <SpfRow key={`spf-${i}`} record={r} />)}
                        {dmarcRecords.map((r, i) => <RecordRow key={`dmarc-${i}`} record={r} />)}
                        {dkimRecords.map((r, i) => <RecordRow key={`dkim-${i}`} record={r} />)}
                    </Section>
                )}

                {/* Authority Section */}
                {hasAuthority && (
                    <Section
                        icon={<Server className="h-4 w-4" />}
                        title="Authority"
                        subtitle="Nameservers and SOA records"
                        variant="authority"
                    >
                        {nsRecords.map((r, i) => <RecordRow key={`ns-${i}`} record={r} />)}
                        {soaRecords.map((r, i) => <RecordRow key={`soa-${i}`} record={r} />)}
                    </Section>
                )}

                {/* Verification & Other TXT */}
                {hasVerification && (
                    <Section
                        icon={<Key className="h-4 w-4" />}
                        title="Verification & Other"
                        subtitle="Domain verification tokens and other records"
                        variant="verification"
                    >
                        {ptrRecords.map((r, i) => <RecordRow key={`ptr-${i}`} record={r} />)}
                        {otherTxtRecords.map((r, i) => <RecordRow key={`txt-${i}`} record={r} />)}
                    </Section>
                )}

                {/* Empty state */}
                {!hasResolution && !hasEmail && !hasAuthority && !hasVerification && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No DNS records found for this domain.
                    </div>
                )}
            </div>
        </div>
    );
}
