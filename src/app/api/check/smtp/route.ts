import { NextResponse } from 'next/server';
import dns, { promises as dnsPromises } from 'dns';
import net from 'net';
import tls from 'tls';
import axios from 'axios';
import { apiLogger } from '@/lib/api-logger';
import { headers } from 'next/headers';
import { SocksClient } from 'socks';
import { getRealIp } from '@/lib/utils';
import { SmtpAggregatedResult, SmtpAuditResult } from '@/types/checkhost';

export const maxDuration = 60; // Allow enough time for deep DNS checks and SMTP handshakes
export const dynamic = 'force-dynamic';

// In-memory cache: key is "host:port"
const smtpCache = new Map<string, { data: SmtpAggregatedResult; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute

// Use reliable public DNS to prevent local network ECONNREFUSED issues
try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
    console.warn("Could not set custom DNS servers:", e);
}

async function resolveMx(domain: string): Promise<{ priority: number; exchange: string }[]> {
    try {
        const records = await dnsPromises.resolveMx(domain);
        return records.sort((a, b) => a.priority - b.priority);
    } catch {
        return [];
    }
}

async function resolveTxt(domain: string): Promise<string[]> {
    try {
        const records = await dnsPromises.resolveTxt(domain);
        return records.map(chunks => chunks.join(''));
    } catch {
        return [];
    }
}

async function resolveA(domain: string): Promise<string | null> {
    try {
        const records = await dnsPromises.resolve4(domain);
        return records[0] || null;
    } catch {
        return null;
    }
}

async function resolvePtr(ip: string): Promise<string | null> {
    try {
        const records = await dnsPromises.reverse(ip);
        return records[0] || null;
    } catch {
        return null;
    }
}

const RBL_SERVERS = [
    'sbl.spamhaus.org',
    'xbl.spamhaus.org',
    'zen.spamhaus.org',
    'bl.spamcop.net'
];

async function checkRbl(ip: string): Promise<Record<string, 'CLEAR' | 'LISTED' | 'ERROR'>> {
    const results: Record<string, 'CLEAR' | 'LISTED' | 'ERROR'> = {};
    const reversedIp = ip.split('.').reverse().join('.');

    await Promise.all(
        RBL_SERVERS.map(async (rbl) => {
            try {
                // If it resolves to any A record, we must check if it's an error code.
                // Spamhaus returns 127.255.255.x when blocking public DNS (like 8.8.8.8).
                const addresses = await dnsPromises.resolve4(`${reversedIp}.${rbl}`);

                if (addresses.some(ip => ip.startsWith('127.255.'))) {
                    // This is an error code indicating the DNS resolver is blocked by the RBL
                    results[rbl] = 'ERROR';
                } else {
                    // Normal list responses are typically 127.0.0.x
                    results[rbl] = 'LISTED';
                }
            } catch (err: any) {
                if (err.code === 'ENOTFOUND') {
                    results[rbl] = 'CLEAR';
                } else {
                    results[rbl] = 'ERROR';
                }
            }
        })
    );
    return results;
}

// Minimal ASN lookup via DNS (e.g. using cymru) or fallback to ipinfo if you want to reuse existing logic.
async function getIpInfo(ip: string) {
    try {
        // Here we just make an HTTP call to our own ip-info endpoint or a public API
        // But for speed, let's use the local API Route if available, or just fetch external
        const res = await fetch(`https://ipinfo.io/${ip}/json`);
        if (res.ok) {
            const data = await res.json();
            return { asn: data.org || null }; // 'org' often contains ASN e.g. "AS15169 Google LLC"
        }
    } catch { }
    return { asn: null };
}

// Proxy configuration from environment
const PROXY_HOST = process.env.SMTP_PROXY_HOST;
const PROXY_PORT = process.env.SMTP_PROXY_PORT ? parseInt(process.env.SMTP_PROXY_PORT) : undefined;
const PROXY_USER = process.env.SMTP_PROXY_USER;
const PROXY_PASS = process.env.SMTP_PROXY_PASS;

async function performSmtpHandshake(originalHost: string, targetHost: string, port: number, connectIp?: string | null): Promise<{ log: string; banner: string | null; starttls: boolean }> {
    return new Promise(async (resolve) => {
        let log = `CONNECTING ${originalHost} -> ${targetHost}:${port}\n`;
        if (originalHost === targetHost) {
            log = `CONNECTING ${targetHost}:${port}\n`;
        }
        let banner: string | null = null;
        let starttls = false;
        const FINAL_TIMEOUT = 10000;

        let socket: any;

        try {
            if (PROXY_HOST && PROXY_PORT) {
                log += `USING PROXY: ${PROXY_HOST}:${PROXY_PORT}\n`;
                const info = await SocksClient.createConnection({
                    proxy: {
                        host: PROXY_HOST,
                        port: PROXY_PORT,
                        type: 5,
                        userId: PROXY_USER,
                        password: PROXY_PASS
                    },
                    command: 'connect',
                    destination: {
                        host: connectIp || targetHost,
                        port: port
                    },
                    timeout: FINAL_TIMEOUT
                });
                socket = info.socket;
            } else {
                socket = new net.Socket();
                socket.connect(port, connectIp || targetHost);
            }

            // Handle port 465 (Implicit TLS)
            if (port === 465) {
                log += `ESTABLISHING SSL CONNECTION (Port 465)\n`;
                socket = tls.connect({
                    socket: socket,
                    host: targetHost,
                    servername: targetHost,
                    rejectUnauthorized: false
                });
            }
        } catch (err: any) {
            log += `ERROR: Connection failed: ${err.message}\n`;
            return resolve({ log, banner, starttls });
        }

        socket.setTimeout(FINAL_TIMEOUT);

        socket.on('timeout', () => {
            log += `ERROR: Connection timed out after ${FINAL_TIMEOUT / 1000}s\n`;
            socket.destroy();
            resolve({ log, banner, starttls });
        });

        socket.on('error', (err: any) => {
            log += `ERROR: ${err.message}\n`;
            resolve({ log, banner, starttls });
        });

        socket.on('data', (data: Buffer) => {
            const response = data.toString();
            const lines = response.split('\n').map(l => l.trim()).filter(l => l);

            for (const line of lines) {
                log += `S: ${line}\n`;
                if (!banner && line.startsWith('220 ')) {
                    banner = line.substring(4);
                }
                if (line.includes('STARTTLS')) {
                    starttls = true;
                }
            }

            // Simple state machine
            if (response.startsWith('220 ')) {
                const ehlo = `EHLO checknode.io\r\n`;
                log += `C: ${ehlo}`;
                socket.write(ehlo);
            } else if (response.includes('250 ') && !log.includes('QUIT')) {
                const quit = `QUIT\r\n`;
                log += `C: ${quit}`;
                socket.write(quit);
            }
        });

        socket.on('close', () => {
            resolve({ log, banner, starttls });
        });
    });
}

async function probePort(host: string, port: number, timeout = 3000): Promise<boolean> {
    return new Promise(async (resolve) => {
        let baseSocket: net.Socket | null = null;
        try {
            if (PROXY_HOST && PROXY_PORT) {
                const info = await SocksClient.createConnection({
                    proxy: {
                        host: PROXY_HOST,
                        port: PROXY_PORT,
                        type: 5,
                        userId: PROXY_USER,
                        password: PROXY_PASS
                    },
                    command: 'connect',
                    destination: { host, port },
                    timeout: timeout
                });
                baseSocket = info.socket;
            } else {
                baseSocket = new net.Socket();
                baseSocket.connect(port, host);
                baseSocket.setTimeout(timeout);
                await new Promise((res, rej) => {
                    baseSocket!.on('connect', res);
                    baseSocket!.on('error', rej);
                    baseSocket!.on('timeout', () => rej(new Error('timeout')));
                });
            }

            if (port === 465) {
                const tlsSocket = tls.connect({
                    socket: baseSocket,
                    host,
                    servername: host,
                    rejectUnauthorized: false
                });
                tlsSocket.setTimeout(timeout);
                tlsSocket.on('secureConnect', () => {
                    tlsSocket.destroy();
                    resolve(true);
                });
                tlsSocket.on('error', () => {
                    tlsSocket.destroy();
                    resolve(false);
                });
                tlsSocket.on('timeout', () => {
                    tlsSocket.destroy();
                    resolve(false);
                });
            } else {
                baseSocket.destroy();
                resolve(true);
            }
        } catch {
            if (baseSocket) baseSocket.destroy();
            resolve(false);
        }
    });
}

function parseSpf(records: string[]) {
    const spfRecord = records.find(r => r.startsWith('v=spf1'));
    if (!spfRecord) return { record: null, status: 'none' as const };
    const isPass = spfRecord.includes('-all') || spfRecord.includes('~all');
    return { record: spfRecord, status: isPass ? 'pass' as const : 'fail' as const };
}

function parseDmarc(records: string[]) {
    const dmarcRecord = records.find(r => r.startsWith('v=DMARC1'));
    if (!dmarcRecord) return { record: null, status: 'none' as const };
    const isPass = dmarcRecord.includes('p=reject') || dmarcRecord.includes('p=quarantine');
    return { record: dmarcRecord, status: isPass ? 'pass' as const : 'fail' as const };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const hostParamRaw = searchParams.get('host');
    const hostParam = hostParamRaw ? hostParamRaw.trim().toLowerCase() : null;
    const portParam = parseInt(searchParams.get('port') || '25');
    const isRefresh = searchParams.get('refresh') === 'true';
    const isCacheOnly = searchParams.get('cacheOnly') === 'true';

    if (!hostParam) {
        return NextResponse.json({ error: 'Host is required' }, { status: 400 });
    }

    const cacheKey = `${hostParam}:${portParam}`;

    // cacheOnly mode: return cached data or 404 (used by permanent links)
    if (isCacheOnly) {
        const cached = smtpCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
            return NextResponse.json(cached.data);
        }
        return NextResponse.json({ error: 'Not in cache' }, { status: 404 });
    }

    // Normal mode: return from cache unless refresh=true
    if (!isRefresh) {
        const cached = smtpCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
            return NextResponse.json(cached.data);
        }
    }

    let targetHost = hostParam;
    const mxRecords = await resolveMx(hostParam);

    // Smart target resolution based on port
    if (portParam === 25 && mxRecords.length > 0) {
        // Port 25: Always prefer MX records (Server-to-Server)
        targetHost = mxRecords[0].exchange;
    } else if (portParam === 465 || portParam === 587) {
        // Ports 465/587: Client-to-Server (Submission)
        // We probe candidate hosts in parallel to find the one that actually listens.
        const candidates = new Set<string>();
        candidates.add(hostParam);

        const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostParam);
        const hasPrefix = hostParam.startsWith('smtp.') || hostParam.startsWith('mail.');

        if (!isIp && !hasPrefix) {
            candidates.add(`smtp.${hostParam}`);
            candidates.add(`mail.${hostParam}`);
        }

        mxRecords.forEach(mx => candidates.add(mx.exchange));

        // Attempt parallel probing with a longer timeout for SOCKS5
        const probeTimeout = 10000;
        const results = await Promise.all(
            Array.from(candidates).map(async (candidate) => {
                const isUp = await probePort(candidate, portParam, probeTimeout);
                return isUp ? candidate : null;
            })
        );

        const winner = results.find(r => r !== null);
        if (winner) {
            targetHost = winner;
        } else {
            // Fallback: if smtp.host exists, try it even if probe failed (maybe probe was too slow)
            if (candidates.has(`smtp.${hostParam}`)) {
                targetHost = `smtp.${hostParam}`;
            } else if (mxRecords.length > 0) {
                targetHost = mxRecords[0].exchange;
            }
        }
    }

    const ip = await resolveA(targetHost);
    const headerList = await headers();
    const userIp = getRealIp(headerList) || '127.0.0.1';

    // Initiate Global TCP check via Check-Host API directly
    let globalTcpId: string | undefined;
    let globalTcpNodeCount: number | undefined;
    const smtpCheckStart = Date.now();
    try {
        await apiLogger.info(`Initiating global tcp check for smtp host: ${targetHost}:${portParam}`);
        const url = `https://check-host.net/check-tcp?host=${encodeURIComponent(targetHost + ':' + portParam)}`;

        const response = await axios.get(url, {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
            },
            timeout: 15000
        });

        const data = response.data;
        globalTcpId = data.request_id;
        // Count how many probe nodes were assigned for this check
        if (data.nodes && typeof data.nodes === 'object') {
            globalTcpNodeCount = Object.keys(data.nodes).length;
        }

    } catch (e: any) {
        if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
            // It's just a timeout initiating the secondary check, not critical for SMTP results
            // console.warn("Timeout initiating global checkhost TCP check (non-critical)");
        } else {
            console.error("Failed to initiate global checkhost check:", e.message || e);
        }
    }

    // Run deep audit checks and handshake concurrently
    const [ptr, rbl, info, handshake, rootTxt, dmarcTxt] = await Promise.all([
        ip ? resolvePtr(ip) : null,
        ip ? checkRbl(ip) : {},
        ip ? getIpInfo(ip) : { asn: null },
        performSmtpHandshake(hostParam, targetHost, portParam, ip),
        resolveTxt(hostParam),
        resolveTxt(`_dmarc.${hostParam}`)
    ]);

    const spf = parseSpf(rootTxt);
    const dmarc = parseDmarc(dmarcTxt);

    const audit: SmtpAuditResult = {
        spf,
        dmarc,
        ptr: {
            record: ptr,
            status: ptr ? (ptr.toLowerCase().includes(hostParam.toLowerCase()) ? 'pass' : 'fail') : 'none'
        },
        mx: mxRecords,
        rbl
    };

    const isOk = handshake.banner !== null || (globalTcpId !== undefined);

    const result: SmtpAggregatedResult = {
        ok: isOk,
        resolvedHost: targetHost,
        ip,
        asn: info.asn,
        port: portParam,
        banner: handshake.banner,
        starttls: handshake.starttls,
        audit,
        log: handshake.log,
        globalTcpId,
        globalTcpNodeCount
    };

    if (!isOk) {
        result.error = "Connection failed locally and globally.";
    }

    // Log the SMTP check properly for activity feed
    const smtpDuration = Date.now() - smtpCheckStart;
    const checkId = await apiLogger.logCheck({
        check_type: 'smtp',
        target_host: `${hostParam}:${portParam}`,
        user_ip: userIp,
        status: isOk ? 'success' : 'error',
        error_message: result.error
    });
    await apiLogger.logApiUsage({
        api_endpoint: `/check/smtp`,
        check_id: checkId || undefined,
        response_time_ms: smtpDuration,
        status_code: 200
    });

    // Store in cache
    smtpCache.set(cacheKey, { data: result, ts: Date.now() });

    return NextResponse.json(result);
}
