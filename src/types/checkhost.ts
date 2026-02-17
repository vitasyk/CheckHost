// CheckHost API types
export type CheckType = 'info' | 'ping' | 'http' | 'tcp' | 'dns' | 'udp' | 'mtr' | 'dns-all' | 'ssl';

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
