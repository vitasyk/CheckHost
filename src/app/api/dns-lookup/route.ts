
import { NextResponse } from 'next/server';
import dns from 'dns';
import { getMockIpInfo } from '@/lib/mock-data';
import { memoryCache } from '@/lib/cache';

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
    const timeoutMs = 2500;

    // Create an abort controller for the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const promises = resolvers.map(async (r) => {
            try {
                // @ts-ignore - dynamic method access
                return await r[method](domain);
            } catch (e) {
                // If one fails, wait for others
                throw e;
            }
        });

        // Add a timeout promise that rejects
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('DNS Timeout')), timeoutMs)
        );

        // Return the first successful one
        const result = await Promise.any([...promises, timeoutPromise]);
        return result as T;
    } catch (error) {
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
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();

    // Normalized cache key
    const cacheKey = `dns-lookup:${cleanDomain}`;
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Check cache (TTL 10 minutes), skip if forceRefresh is true
    if (!forceRefresh) {
        const cachedData = memoryCache.get(cacheKey);
        if (cachedData) {
            return NextResponse.json(cachedData, {
                headers: { 'X-Cache': 'HIT' }
            });
        }
    }

    // 2. Deduplicate concurrent requests
    try {
        const responseData = await memoryCache.deduplicate(cacheKey, async () => {
            // Detect if input is already an IP address
            const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
            const isIP = ipRegex.test(cleanDomain);

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
                };

                memoryCache.set(cacheKey, data, 600);
                return data;
            }

            // Run all DNS lookups in parallel
            const [a, aaaa, mx, ns, cname, txt, soa, dmarc, dkim_mail, dkim_sign, mail_a, mail_mx, www_a, www_cname] = await Promise.all([
                fastResolve<string[]>('resolve4', cleanDomain),
                fastResolve<string[]>('resolve6', cleanDomain),
                fastResolve<dns.MxRecord[]>('resolveMx', cleanDomain),
                fastResolve<string[]>('resolveNs', cleanDomain),
                fastResolve<string[]>('resolveCname', cleanDomain),
                fastResolve<string[][]>('resolveTxt', cleanDomain),
                fastResolve<dns.SoaRecord>('resolveSoa', cleanDomain),
                // Service records
                fastResolve<string[][]>('resolveTxt', `_dmarc.${cleanDomain}`),
                fastResolve<string[][]>('resolveTxt', `mail._domainkey.${cleanDomain}`),
                fastResolve<string[][]>('resolveTxt', `sign._domainkey.${cleanDomain}`),
                // Common subdomains
                fastResolve<string[]>('resolve4', `mail.${cleanDomain}`),
                fastResolve<dns.MxRecord[]>('resolveMx', `mail.${cleanDomain}`),
                fastResolve<string[]>('resolve4', `www.${cleanDomain}`),
                fastResolve<string[]>('resolveCname', `www.${cleanDomain}`),
            ]);

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
            if (ns) {
                (ns as string[]).forEach(n => records.push({ type: 'NS', value: n }));
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
            if (dkim_mail) {
                (dkim_mail as string[][]).forEach(chunks => records.push({ type: 'TXT', value: chunks.join(''), auxiliary: 'mail._domainkey.@' }));
            }
            if (dkim_sign) {
                (dkim_sign as string[][]).forEach(chunks => records.push({ type: 'TXT', value: chunks.join(''), auxiliary: 'sign._domainkey.@' }));
            }

            // Subdomain records
            if (mail_a) {
                (mail_a as string[]).forEach(ip => records.push({ type: 'A', value: ip, auxiliary: 'mail.@' }));
            }
            if (mail_mx) {
                (mail_mx as dns.MxRecord[]).forEach(r => records.push({ type: 'MX', value: r.exchange, priority: r.priority, auxiliary: 'mail.@' }));
            }
            if (www_a) {
                (www_a as string[]).forEach(ip => records.push({ type: 'A', value: ip, auxiliary: 'www.@' }));
            }
            if (www_cname) {
                (www_cname as string[]).forEach(cn => records.push({ type: 'CNAME', value: cn, auxiliary: 'www.@' }));
            }

            // PTR records for the primary A record
            const primaryIP = (a && (a as string[]).length > 0) ? (a as string[])[0] : ((aaaa && (aaaa as string[]).length > 0) ? (aaaa as string[])[0] : null);
            if (primaryIP) {
                const ptrResults = await fastResolve<string[]>('reverse', primaryIP);
                if (ptrResults) {
                    ptrResults.forEach(p => records.push({ type: 'PTR', value: p, auxiliary: `for ${primaryIP}` }));
                }
            }

            // Enhance with IP info (ISP, Location)
            let ipMetadata = null;
            if (primaryIP) {
                ipMetadata = await safeResolve(() => getMockIpInfo(primaryIP));
            }

            // Also try to resolve mail A record (like quer.monster does) for primary MX records
            if (mx && (mx as dns.MxRecord[]).length > 0) {
                for (const mxRecord of (mx as dns.MxRecord[])) {
                    const mailA = await fastResolve<string[]>('resolve4', mxRecord.exchange);
                    if (mailA) {
                        mailA.forEach(ip => records.push({
                            type: 'A',
                            value: ip,
                            auxiliary: `mail server (${mxRecord.exchange})`,
                        }));
                    }
                }
            }

            const data = {
                domain: cleanDomain,
                ip: primaryIP,
                ipInfo: ipMetadata,
                records,
                timestamp: Date.now(),
            };

            // Cache successful response (TTL 600s = 10m)
            memoryCache.set(cacheKey, data, 600);
            return data;
        });

        return NextResponse.json(responseData, {
            headers: { 'X-Cache': 'MISS' }
        });
    } catch (error) {
        console.error('DNS Lookup error:', error);
        return NextResponse.json({ error: 'DNS Lookup failed' }, { status: 500 });
    }
}
