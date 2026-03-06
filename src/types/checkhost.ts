// CheckHost API types
export type CheckType = 'info' | 'ping' | 'http' | 'tcp' | 'dns' | 'udp' | 'mtr' | 'dns-all' | 'ssl' | 'smtp';

export interface MtrHop {
    host: string;
    ip: string;
    loss: number;
    sent: number;
    last: number;
    avg: number;
    best: number;
    worst: number;
    stdev: number;
}

export interface RawMtrHopProbe {
    host?: string;
    query_times: (string | null)[];
}

export type RawMtrHop = RawMtrHopProbe[];
export type RawMtrResult = [RawMtrHop[]];

export type MtrResult = MtrHop[] | RawMtrResult;

export interface Node {
    id: string;
    country: string;
    countryCode: string;
    city: string;
    ip: string;
    asn: string;
}

export interface CheckOptions {
    maxNodes?: number;
    nodes?: string[];
    dnsType?: string;
}

export interface CheckResponse {
    ok: number;
    request_id: string;
    permanent_link: string;
    nodes: Record<string, [string, string, string, string, string]>;
    error?: string;
    msg?: string;
}

export interface PingResult {
    status: 'OK' | 'TIMEOUT' | 'MALFORMED';
    time?: number;
    ip?: string;
}

export interface HttpResult {
    success: number;
    time: number;
    statusText: string;
    statusCode: string | null;
    ip: string | null;
}

export interface TcpResult {
    time?: number;
    address?: string;
    error?: string;
}

export interface DnsResult {
    A?: string[];
    AAAA?: string[];
    MX?: string[][];
    NS?: string[];
    CNAME?: string[];
    TXT?: string[];
    PTR?: string[];
    TTL: number | null;
}

export type CheckResult = PingResult[] | HttpResult[] | TcpResult[] | DnsResult[] | MtrResult;

export interface ResultsResponse {
    [nodeId: string]: CheckResult | null;
}

export interface ExtendedResultsResponse {
    command: string;
    created: number;
    host: string;
    results: ResultsResponse;
}

// SMTP Backend Aggregation Types
export interface SmtpAuditResult {
    spf: { record: string | null; status: 'pass' | 'fail' | 'none'; error?: string };
    dmarc: { record: string | null; status: 'pass' | 'fail' | 'none' };
    ptr: { record: string | null; status: 'pass' | 'fail' | 'none' };
    mx: { priority: number; exchange: string }[];
    rbl: Record<string, 'CLEAR' | 'LISTED' | 'ERROR' | 'BLOCKED' | string>;
}

export interface SmtpAggregatedResult {
    ok: boolean;
    error?: string;
    resolvedHost: string;
    ip: string | null;
    asn: string | null;
    port: number;
    banner: string | null;
    starttls: boolean;
    audit: SmtpAuditResult;
    log: string;
    globalTcpId?: string;       // Request ID for Check-Host TCP check
    globalTcpNodeCount?: number; // Number of global probe nodes used
}
