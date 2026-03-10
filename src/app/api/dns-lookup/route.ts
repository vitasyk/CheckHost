
import { NextResponse } from 'next/server';
import dns from 'dns';
import { getMockIpInfo } from '@/lib/mock-data';
import { memoryCache } from '@/lib/cache';
import { logSeoPage } from '@/lib/seo-logger';
import { extractHost, isIPv6, getRealIp } from '@/lib/utils';
import { apiLogger } from '@/lib/api-logger';
import { headers } from 'next/headers';

// Create multiple independent resolvers for parallel probing
const googleResolver = new dns.promises.Resolver();
googleResolver.setServers(['8.8.8.8', '8.8.4.4']);

const cloudflareResolver = new dns.promises.Resolver();
cloudflareResolver.setServers(['1.1.1.1', '1.0.0.1']);

const quad9Resolver = new dns.promises.Resolver();
quad9Resolver.setServers(['9.9.9.9', '149.112.112.112']);

const resolvers = [googleResolver, cloudflareResolver, quad9Resolver];

/**
 * Races multiple DNS providers to get the fastest successful response.
 * Uses Promise.any to ensure we return the first SUCCESSFUL result.
 */
async function fastResolve<T>(method: keyof dns.promises.Resolver, domain: string): Promise<T | null> {
    const timeoutMs = 3000; // Reduced for better performance

    // Create an abort controller for the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const promises = resolvers.map(async (r) => {
            // @ts-expect-error - dynamic method access
            return await r[method](domain);
        });

        // Add a timeout promise that rejects
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('DNS Timeout')), timeoutMs)
        );

        // Return the first successful one
        const result = await Promise.any([...promises, timeoutPromise]);
        return result as T;
    } catch {
        // All resolvers failed or timeout reached
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function safeResolve<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
        return await fn();
    } catch {
        return null;
    }
}

interface DnsRecord {
    type: string;
    value: string;
    ttl?: number;
    priority?: number;
    auxiliary?: string;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'domain parameter is required' }, { status: 400 });
    }

    // Clean domain
    const cleanDomain = extractHost(domain);

    // Normalized cache key
    const cacheKey = `dns-lookup:${cleanDomain}`;
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Check cache (TTL 10 minutes), skip if forceRefresh is true
    if (!forceRefresh) {
        const cachedData = await memoryCache.get(cacheKey);
        if (cachedData) {
            return NextResponse.json(cachedData, {
                headers: { 'X-Cache': 'HIT' }
            });
        }
    }

    // 2. Deduplicate concurrent requests
    const startTimestamp = Date.now();
    try {
        const responseData = await memoryCache.deduplicate(cacheKey, async () => {
            // Detect if input is already an IP address (IPv4 or IPv6)
            const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
            const isIP = ipRegex.test(cleanDomain) || isIPv6(cleanDomain);

            const records: DnsRecord[] = [];

            if (isIP) {
                // For IP inputs, primarily do reverse DNS (PTR)
                const ptr = await fastResolve<string[]>('reverse', cleanDomain);
                if (ptr) {
                    ptr.forEach(p => records.push({ type: 'PTR', value: p }));
                }

                const data = {
                    domain: cleanDomain,
                    ip: cleanDomain,
                    records,
                    timestamp: Date.now(),
                    status: 'success' as const,
                    error: undefined
                };

                return data;
            }

            // Common DKIM selectors to probe
            const dkimSelectors = ['default', 'google', 'k1', 'mail', 'sign', 'dkim', 'cloudflare', 'mandrill', 'postmark', 'sendgrid'];

            // Run all primary DNS lookups in parallel
            const [a, aaaa, mx, ns, cname, txt, soa, dmarc, ...dkimResults] = await Promise.all([
                fastResolve<string[]>('resolve4', cleanDomain),
                fastResolve<string[]>('resolve6', cleanDomain),
                fastResolve<dns.MxRecord[]>('resolveMx', cleanDomain),
                fastResolve<string[]>('resolveNs', cleanDomain),
                fastResolve<string[]>('resolveCname', cleanDomain),
                fastResolve<string[][]>('resolveTxt', cleanDomain),
                fastResolve<dns.SoaRecord>('resolveSoa', cleanDomain),
                // Service records
                fastResolve<string[][]>('resolveTxt', `_dmarc.${cleanDomain}`),
                // DKIM selectors
                ...dkimSelectors.map(selector => fastResolve<string[][]>('resolveTxt', `${selector}._domainkey.${cleanDomain}`)),
                // Common subdomains
                fastResolve<string[]>('resolve4', `mail.${cleanDomain}`),
                fastResolve<dns.MxRecord[]>('resolveMx', `mail.${cleanDomain}`),
                fastResolve<string[]>('resolve4', `www.${cleanDomain}`),
                fastResolve<string[]>('resolveCname', `www.${cleanDomain}`),
            ]);

            // Splitting results
            const mail_a = dkimResults[dkimSelectors.length] as string[] | null;
            const mail_mx = dkimResults[dkimSelectors.length + 1] as dns.MxRecord[] | null;
            const www_a = dkimResults[dkimSelectors.length + 2] as string[] | null;
            const www_cname = dkimResults[dkimSelectors.length + 3] as string[] | null;

            // A records
            if (a) {
                (a as string[]).forEach(ip => records.push({ type: 'A', value: ip }));
            }

            // AAAA records
            if (aaaa) {
                (aaaa as string[]).forEach(ip => records.push({ type: 'AAAA', value: ip }));
            }

            // CNAME records
            if (cname) {
                (cname as string[]).forEach(cn => records.push({ type: 'CNAME', value: cn }));
            }

            // MX records
            if (mx) {
                const mxRecs = mx as dns.MxRecord[];
                mxRecs.sort((a, b) => a.priority - b.priority);
                mxRecs.forEach(r => records.push({
                    type: 'MX',
                    value: r.exchange,
                    priority: r.priority,
                }));
            }

            // NS records
            if (ns && (ns as string[]).length > 0) {
                (ns as string[]).forEach(n => records.push({ type: 'NS', value: n }));
            } else if (soa) {
                const soaRec = soa as dns.SoaRecord;
                if (soaRec.nsname) {
                    records.push({
                        type: 'NS',
                        value: soaRec.nsname,
                        auxiliary: 'from SOA (fallback)'
                    });
                }
            }

            // SOA record
            if (soa) {
                const soaRec = soa as dns.SoaRecord;
                records.push({
                    type: 'SOA',
                    value: soaRec.hostmaster,
                    auxiliary: `mname=${soaRec.nsname}; serial=${soaRec.serial}; refresh=${soaRec.refresh}; retry=${soaRec.retry}; expire=${soaRec.expire}; minttl=${soaRec.minttl}`,
                });
            }

            // TXT records
            if (txt) {
                (txt as string[][]).forEach(chunks => {
                    const value = chunks.join('');
                    records.push({ type: 'TXT', value });
                });
            }

            // DMARC & DKIM Service Records
            if (dmarc) {
                (dmarc as string[][]).forEach(chunks => records.push({ type: 'TXT', value: chunks.join(''), auxiliary: '_dmarc.@' }));
            }

            // DKIM records with various selectors
            dkimSelectors.forEach((selector, index) => {
                const dkimResult = dkimResults[index] as string[][] | null;
                if (dkimResult) {
                    dkimResult.forEach(chunks => {
                        records.push({
                            type: 'TXT',
                            value: chunks.join(''),
                            auxiliary: `${selector}._domainkey.@`
                        });
                    });
                }
            });

            // Subdomain records
            if (mail_a) (mail_a as string[]).forEach(ip => records.push({ type: 'A', value: ip, auxiliary: 'mail.@' }));
            if (mail_mx) (mail_mx as dns.MxRecord[]).forEach(r => records.push({ type: 'MX', value: r.exchange, priority: r.priority, auxiliary: 'mail.@' }));
            if (www_a) (www_a as string[]).forEach(ip => records.push({ type: 'A', value: ip, auxiliary: 'www.@' }));
            if (www_cname) (www_cname as string[]).forEach(cn => records.push({ type: 'CNAME', value: cn, auxiliary: 'www.@' }));

            // Secondary parallel block for dependent lookups
            const primaryIP = (a && (a as string[]).length > 0) ? (a as string[])[0] : ((aaaa && (aaaa as string[]).length > 0) ? (aaaa as string[])[0] : null);
            const secondaryPromises: Promise<any>[] = [];

            if (primaryIP) {
                secondaryPromises.push(fastResolve<string[]>('reverse', primaryIP).then(ptrResults => {
                    if (ptrResults) ptrResults.forEach(p => records.push({ type: 'PTR', value: p, auxiliary: `for ${primaryIP}` }));
                }));
            }

            if (mx && (mx as dns.MxRecord[]).length > 0) {
                (mx as dns.MxRecord[]).forEach((mxRecord) => {
                    secondaryPromises.push(fastResolve<string[]>('resolve4', mxRecord.exchange).then(mailA => {
                        if (mailA) mailA.forEach(ip => records.push({ type: 'A', value: ip, auxiliary: `mail server (${mxRecord.exchange})` }));
                    }));
                });
            }

            let ipMetadata = null;
            if (primaryIP) {
                secondaryPromises.push(safeResolve(() => getMockIpInfo(primaryIP)).then(meta => { ipMetadata = meta; }));
            }

            await Promise.all(secondaryPromises);

            const data = {
                domain: cleanDomain,
                ip: primaryIP,
                ipInfo: ipMetadata,
                records,
                timestamp: Date.now(),
                status: records.length > 0 ? 'success' : 'failed',
                error: records.length === 0 ? `DNS Resolution failed: No records found for "${cleanDomain}".` : undefined
            };

            return data;
        });

        // 3. Post-probing operations (Caching & Telemetry)
        // These are intentionally kept outside the deduplicate lock to avoid hanging other concurrent requests

        // Background set in cache (no await)
        memoryCache.set(cacheKey, responseData, 600).catch(console.error);

        // Background logging & SEO page track
        const logPromise = (async () => {
            try {
                const headerList = await headers();
                const userIp = getRealIp(headerList) || '127.0.0.1';

                const checkId = await apiLogger.logCheck({
                    check_type: 'dns-lookup',
                    target_host: cleanDomain,
                    user_ip: userIp,
                    status: responseData.status
                });

                await apiLogger.logApiUsage({
                    api_endpoint: '/dns-lookup',
                    check_id: checkId || undefined,
                    response_time_ms: Date.now() - startTimestamp,
                    status_code: 200
                });

                if (responseData.status === 'success') {
                    logSeoPage(cleanDomain, 'dns').catch(console.error);
                }
            } catch (err) {
                console.error('[DNS Background Log Error]', err);
            }
        })();

        // We don't await logPromise to respond as fast as possible
        return NextResponse.json(responseData, {
            headers: { 'X-Cache': 'MISS' }
        });
    } catch (_error: any) {
        console.error('DNS Lookup error:', _error);

        if (_error.code === 'ENOTFOUND' || _error.message === 'DNS Timeout') {
            return NextResponse.json({
                domain: cleanDomain,
                records: [],
                status: 'failed',
                error: `DNS Resolution failed: The domain "${cleanDomain}" could not be resolved.`
            });
        }

        return NextResponse.json({ error: 'DNS Lookup failed', detail: _error.message }, { status: 500 });
    }
}
