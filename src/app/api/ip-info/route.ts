import { NextResponse } from 'next/server';
import { IpInfoResponse } from '@/types/ip-info';
import { getMockIpInfo } from '@/lib/mock-data';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    let host = searchParams.get('host');

    if (!host || host === '::1' || host === '127.0.0.1') {
        const forwarded = request.headers.get('x-forwarded-for');
        host = forwarded ? forwarded.split(',')[0] : null;
    }

    // Still no host or local? Use a default public IP for demo/local dev
    if (!host || host === '::1' || host === '127.0.0.1') {
        host = '1.1.1.1'; // Cloudflare DNS for a clean demo
    }

    // Mock delay to simulate real API aggregation
    // await new Promise(resolve => setTimeout(resolve, 800)); 

    const mockData = await getMockIpInfo(host);

    return NextResponse.json(mockData);
}
