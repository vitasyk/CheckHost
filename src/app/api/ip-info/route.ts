import { NextRequest, NextResponse } from 'next/server';
import { IpInfoResponse } from '@/types/ip-info';
import { getMockIpInfo } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    let host = searchParams.get('host');

    // Detect client IP with priority order for proxies/CDN
    const clientIp =
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('cf-connecting-ip') || // Cloudflare
        null;

    // If no host provided, return just the detected IP (for Reverse MTR)
    if (!host) {
        let ip = clientIp || '0.0.0.0';
        let isFallback = false;

        // If IP is private or loopback, use a public fallback for demonstration/development
        if (ip === '0.0.0.0' || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            ip = '1.1.1.1'; // Fallback to Cloudflare DNS for a clean demo
            isFallback = true;
        }

        return NextResponse.json({
            ip,
            isFallback,
            hostname: isFallback ? 'cloudflare-dns.com' : null,
            providers: {}
        });
    }

    // Use detected clientIp if host is localhost
    if (host === '::1' || host === '127.0.0.1') {
        host = clientIp || '1.1.1.1'; // Fallback to Cloudflare DNS for demo
    }

    // Mock delay to simulate real API aggregation
    // await new Promise(resolve => setTimeout(resolve, 800)); 

    const mockData = await getMockIpInfo(host);

    return NextResponse.json(mockData);
}
