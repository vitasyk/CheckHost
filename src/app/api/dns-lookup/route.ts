
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
 * Uses a hard timeout to ensure we never block for more than timeoutMs.
 */
async function fastResolve<T>(method: keyof dns.promises.Resolver, domain: string): Promise<T | null> {
    const timeoutMs = 3000; // Hard limit

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // 1. Create a promise that resolves to null after timeoutMs
        const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), timeoutMs)
        );

        // 2. Create the actual resolution promise
        const resolutionPromise = (async () => {
            try {
                const promises = resolvers.map(async (r) => {
                    // @ts-expect-error - dynamic method access
                    return await r[method](domain);
                });
                // Promise.any returns the first successful resolution
                return await Promise.any(promises);
            } catch {
                // All failed
                return null;
            }
        })();

        // Race them: first one to Finish (resolve or timeout) wins
        return await Promise.race([resolutionPromise, timeoutPromise]) as T | null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
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

    const cleanDomain = extractHost(domain);
    const cacheKey = `dns-lookup:${cleanDomain}`;
    const forceRefresh = searchParams.get('refresh') === 'true';

    if (!forceRefresh) {
        const cachedData = await memoryCache.get(cacheKey);
        if (cachedData) {
            return NextResponse.json(cachedData, {
                headers: { 'X-Cache': 'HIT' }
            });
        }
    }

    const startTimestamp = Date.now();
    let primaryDuration = 0;
    let secondaryDuration = 0;

    try {
        const responseData = await memoryCache.deduplicate(cacheKey, async () => {
            const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
            const isIP = ipRegex.test(cleanDomain) || isIPv6(cleanDomain);

            const records: DnsRecord[] = [];

            if (isIP) {
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

            const dkimSelectors = ['default', 'google', 'k1', 'mail', 'sign', 'dkim', 'cloudflare', 'mandrill', 'postmark', 'sendgrid'];
            const p1Start = Date.now();

            // Helper to trim trailing dot from DNS results
            const trimDot = (val: string) => val ? (val.endsWith('.') ? val.slice(0, -1) : val) : val;

            const isSubdomain = cleanDomain.split('.').length > 2;
            const subName = cleanDomain.split('.')[0];
            const baseDomain = cleanDomain.split('.').slice(1).join('.');

            // Run all primary DNS lookups in parallel
            const [a, aaaa, mx, ns, cname, txt, soa, dmarc, ...dkimResults] = await Promise.all([
                fastResolve<string[]>('resolve4', cleanDomain),
                fastResolve<string[]>('resolve6', cleanDomain),
                fastResolve<dns.MxRecord[]>('resolveMx', cleanDomain),
                fastResolve<string[]>('resolveNs', cleanDomain),
                fastResolve<string[]>('resolveCname', cleanDomain).then(async (res) => {
                    // Fallback to resolveAny if resolveCname fails, as some DNS servers
                    // respond with A records only for specialized CNAME queries but include CNAME in ANY
                    if (!res || res.length === 0) {
                        const anyResults = await fastResolve<dns.AnyRecord[]>('resolveAny', cleanDomain);
                        if (anyResults) {
                            const cnamesFromAny = anyResults
                                .filter((r): r is dns.AnyCnameRecord => r.type === 'CNAME')
                                .map(r => r.value);
                            if (cnamesFromAny.length > 0) return cnamesFromAny;
                        }
                    }
                    return res;
                }),
                fastResolve<string[][]>('resolveTxt', cleanDomain),
                fastResolve<dns.SoaRecord>('resolveSoa', cleanDomain),
                fastResolve<string[][]>('resolveTxt', `_dmarc.${cleanDomain}`),
                ...dkimSelectors.map(selector => fastResolve<string[][]>('resolveTxt', `${selector}._domainkey.${cleanDomain}`)),
                // If it's a subdomain like mail.domain.com, we don't want mail.mail.domain.com
                isSubdomain ? Promise.resolve(null) : fastResolve<string[]>('resolve4', `mail.${cleanDomain}`),
                isSubdomain ? Promise.resolve(null) : fastResolve<dns.MxRecord[]>('resolveMx', `mail.${cleanDomain}`),
                isSubdomain ? Promise.resolve(null) : fastResolve<string[]>('resolve4', `www.${cleanDomain}`),
                isSubdomain ? Promise.resolve(null) : fastResolve<string[]>('resolveCname', `www.${cleanDomain}`),
            ]);

            primaryDuration = Date.now() - p1Start;

            const mail_a = dkimResults[dkimSelectors.length] as string[] | null;
            const mail_mx = dkimResults[dkimSelectors.length + 1] as dns.MxRecord[] | null;
            const www_a = dkimResults[dkimSelectors.length + 2] as string[] | null;
            const www_cname = dkimResults[dkimSelectors.length + 3] as string[] | null;

            if (a) (a as string[]).forEach(ip => records.push({ type: 'A', value: ip }));
            if (aaaa) (aaaa as string[]).forEach(ip => records.push({ type: 'AAAA', value: ip }));
            if (cname) (cname as string[]).forEach(cn => records.push({ type: 'CNAME', value: trimDot(cn) }));

            if (mx) {
                const mxRecs = mx as dns.MxRecord[];
                mxRecs.sort((a, b) => a.priority - b.priority);
                mxRecs.forEach(r => records.push({ type: 'MX', value: trimDot(r.exchange), priority: r.priority }));
            }

            if (ns && (ns as string[]).length > 0) {
                (ns as string[]).forEach(n => records.push({ type: 'NS', value: trimDot(n) }));
            } else if (soa) {
                const soaRec = soa as dns.SoaRecord;
                if (soaRec.nsname) records.push({ type: 'NS', value: trimDot(soaRec.nsname), auxiliary: 'from SOA (fallback)' });
            }

            if (soa) {
                const soaRec = soa as dns.SoaRecord;
                records.push({
                    type: 'SOA',
                    value: trimDot(soaRec.hostmaster),
                    auxiliary: `mname=${trimDot(soaRec.nsname)}; serial=${soaRec.serial}; refresh=${soaRec.refresh}; retry=${soaRec.retry}; expire=${soaRec.expire}; minttl=${soaRec.minttl}`,
                });
            }

            if (txt) {
                (txt as string[][]).forEach(chunks => records.push({ type: 'TXT', value: chunks.join('') }));
            }

            if (dmarc) {
                (dmarc as string[][]).forEach(chunks => records.push({ type: 'TXT', value: chunks.join(''), auxiliary: '_dmarc.@' }));
            }

            dkimSelectors.forEach((selector, index) => {
                const dkimResult = dkimResults[index] as string[][] | null;
                if (dkimResult) {
                    dkimResult.forEach(chunks => {
                        records.push({ type: 'TXT', value: chunks.join(''), auxiliary: `${selector}._domainkey.@` });
                    });
                }
            });

            if (mail_a) (mail_a as string[]).forEach(ip => records.push({ type: 'A', value: ip, auxiliary: 'mail.@' }));
            if (mail_mx) (mail_mx as dns.MxRecord[]).forEach(r => records.push({ type: 'MX', value: trimDot(r.exchange), priority: r.priority, auxiliary: 'mail.@' }));
            if (www_a) (www_a as string[]).forEach(ip => records.push({ type: 'A', value: ip, auxiliary: 'www.@' }));
            if (www_cname) (www_cname as string[]).forEach(cn => records.push({ type: 'CNAME', value: trimDot(cn), auxiliary: 'www.@' }));

            const primaryIP = (a && (a as string[]).length > 0) ? (a as string[])[0] : ((aaaa && (aaaa as string[]).length > 0) ? (aaaa as string[])[0] : null);
            const secondaryPromises: Promise<any>[] = [];
            const p2Start = Date.now();

            if (primaryIP) {
                secondaryPromises.push(fastResolve<string[]>('reverse', primaryIP).then(ptrResults => {
                    if (ptrResults) ptrResults.forEach(p => records.push({ type: 'PTR', value: trimDot(p), auxiliary: `for ${primaryIP}` }));
                }));
            }

            if (mx && (mx as dns.MxRecord[]).length > 0) {
                (mx as dns.MxRecord[]).forEach((mxRecord) => {
                    secondaryPromises.push(fastResolve<string[]>('resolve4', mxRecord.exchange).then(mailA => {
                        if (mailA) mailA.forEach(ip => records.push({ type: 'A', value: ip, auxiliary: `mail server (${trimDot(mxRecord.exchange)})` }));
                    }));
                });
            }

            let ipMetadata = null;
            if (primaryIP) {
                secondaryPromises.push(safeResolve(() => getMockIpInfo(primaryIP)).then(meta => { ipMetadata = meta; }));
            }

            await Promise.all(secondaryPromises);
            secondaryDuration = Date.now() - p2Start;

            return {
                domain: cleanDomain,
                ip: primaryIP,
                ipInfo: ipMetadata,
                records,
                timestamp: Date.now(),
                status: records.length > 0 ? 'success' as const : 'failed' as const,
                error: records.length === 0 ? `DNS Resolution failed: No records found for "${cleanDomain}".` : undefined
            };
        });

        // Background set in cache (no await)
        memoryCache.set(cacheKey, responseData, 600).catch(console.error);

        // Background logging
        (async () => {
            try {
                const headerList = await headers();
                const userIp = getRealIp(headerList) || '127.0.0.1';

                const checkId = await apiLogger.logCheck({
                    check_type: 'dns-lookup',
                    target_host: cleanDomain,
                    user_ip: userIp,
                    status: responseData.status,
                    error_message: responseData.error
                });

                await apiLogger.logApiUsage({
                    api_endpoint: '/dns-lookup',
                    check_id: checkId || undefined,
                    response_time_ms: Date.now() - startTimestamp,
                    status_code: 200
                });

                // Production diagnostic logging (only if slow)
                const totalTime = Date.now() - startTimestamp;
                if (totalTime > 5000) {
                    apiLogger.info(`Slow DNS lookup for ${cleanDomain}: Total ${totalTime}ms, P1: ${primaryDuration}ms, P2: ${secondaryDuration}ms`);
                }

                if (responseData.status === 'success') {
                    logSeoPage(cleanDomain, 'dns').catch(console.error);
                }
            } catch (err) {
                console.error('[DNS Background Log Error]', err);
            }
        })();

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
