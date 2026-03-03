import { NextRequest, NextResponse } from 'next/server';
import { getMockIpInfo } from '@/lib/mock-data';
import { fetchAsnInfo, fetchRdapInfo } from '@/lib/ipinfo-api';
import { parseRdapData } from '@/lib/rdap-parser';
import { memoryCache } from '@/lib/cache';
import { logSeoPage } from '@/lib/seo-logger';
import { getRealIp } from '@/lib/utils';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const hostRaw = searchParams.get('host');
    let host = hostRaw ? hostRaw.trim().toLowerCase() : null;

    // Detect client IP with priority order for proxies/CDN
    const clientIp = getRealIp(request.headers);

    // If no host provided, return just the detected IP (for Reverse MTR)
    if (!host) {
        let ip = clientIp || '0.0.0.0';
        let isFallback = false;

        // If IP is private or loopback, use a public fallback for demonstration/development
        if (ip === '0.0.0.0' || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            ip = '1.1.1.1'; // Fallback to Cloudflare DNS for a clean demo
            isFallback = true;
        }

        const cacheKey = `ip-info:visitor:${ip}`;
        const cachedData = await memoryCache.get(cacheKey);
        if (cachedData) {
            return NextResponse.json({ ...(cachedData as any), isFallback }, {
                headers: { 'X-Cache': 'HIT' }
            });
        }

        const data = await getMockIpInfo(ip);

        // Final log for IPv6 results
        if (ip.includes(':')) {
            console.log(`[IPv6 Result] Found country: ${data.providers.ipinfo?.country || data.providers.ipapi?.country || 'Unknown'}`);
        }

        const visitorData = { ...data, isFallback };
        await memoryCache.set(cacheKey, visitorData, 3600);

        return NextResponse.json(visitorData, {
            headers: { 'X-Cache': 'MISS' }
        });
    }

    // Use detected clientIp if host is localhost
    if (host === '::1' || host === '127.0.0.1') {
        host = clientIp || '1.1.1.1'; // Fallback to Cloudflare DNS for demo
    }

    // Normalized cache key (ignoring technical params like 't')
    const cacheKey = `ip-info:${host}`;
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Check cache (TTL 1 hour), skip if forceRefresh is true
    if (!forceRefresh) {
        const cachedData = await memoryCache.get(cacheKey);
        if (cachedData) {
            return NextResponse.json(cachedData, {
                headers: { 'X-Cache': 'HIT' }
            });
        }
    }

    // 2. Deduplicate concurrent requests
    try {
        const responseData = await memoryCache.deduplicate(cacheKey, async () => {

            // Check if it's an AS Number query (e.g., AS13335 or AS 13335)
            const isASN = /^AS\s*\d+$/i.test(host!);

            if (isASN) {
                // Fetch ASN details and RDAP info in parallel
                const [rdapData] = await Promise.all([
                    fetchRdapInfo(host!).catch(() => null)
                ]);
                let [asnData] = await Promise.all([
                    fetchAsnInfo(host!)
                ]);

                if (!asnData || asnData.error) {
                    // Ultimate fallback: Extract basic info from RDAP if available
                    if (rdapData) {
                        const parsed = parseRdapData(rdapData);
                        if (parsed.name || parsed.organization) {
                            asnData = {
                                asn: host!.toUpperCase(),
                                name: parsed.name || parsed.organization || '',
                                domain: '',
                                route: '',
                                type: parsed.networkType || '',
                                allocated: parsed.registrationDate || '',
                                registry: '',
                                country: parsed.country || ''
                            };
                        }
                    }

                    if (!asnData || asnData.error) {
                        return {
                            host,
                            status: 'failed',
                            isASN: true,
                            error: `ASN Lookup failed: Could not retrieve information for ${host!}.`,
                            providers: {},
                            rdapRawData: rdapData,
                            timestamp: Date.now()
                        };
                    }
                }

                // Format the ASN specific response
                const successAsnData = {
                    ip: '',
                    host,
                    status: 'success',
                    isASN: true,
                    asnDetails: {
                        asn: asnData.asn,
                        name: asnData.name || '',
                        domain: asnData.domain || '',
                        route: asnData.route || '',
                        type: asnData.type || '',
                        allocated: asnData.allocated || '',
                        registry: asnData.registry || '',
                        country: asnData.country || ''
                    },
                    providers: {},
                    rdapRawData: rdapData
                };

                await memoryCache.set(cacheKey, successAsnData, 3600);
                logSeoPage(host!, 'ip-info').catch(console.error);
                return successAsnData;
            }

            const data = await getMockIpInfo(host!);

            // If IP is null (resolution failed for a domain), mark as failed but keep RDAP data
            if (!data.ip) {
                return {
                    host,
                    status: 'failed',
                    error: `DNS Resolution failed: The host "${host}" could not be resolved to an IP address.`,
                    rdapRawData: data.rdapRawData || null,
                    nameservers: data.nameservers || [],
                    providers: data.providers || {},
                    timestamp: Date.now()
                };
            }

            // Cache successful response (TTL 3600s = 1h)
            const successData = { ...data, status: 'success' };
            await memoryCache.set(cacheKey, successData, 3600);

            // Log successful check for Programmatic SEO
            logSeoPage(host!, 'ip-info').catch(console.error);

            return successData;
        });

        return NextResponse.json(responseData, {
            headers: { 'X-Cache': 'MISS' }
        });
    } catch (error: any) {
        console.error('IP Info error:', error);
        return NextResponse.json({
            error: 'Failed to fetch IP info',
            detail: error.message
        }, { status: 500 });
    }
}
