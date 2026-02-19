
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSiteSetting, saveSiteSetting } from '@/lib/site-settings';
import { memoryCache } from '@/lib/cache';

/**
 * Handle GET request for site settings (Admin only)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'adsense';

    // Publicly accessible keys (non-sensitive UI configs)
    const publicKeys = ['ip_info_display', 'adsense', 'feature_flags', 'share_results', 'system_config'];
    const isPublic = publicKeys.includes(key);

    if (!isPublic) {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    // 1. Caching for public keys to prevent redundant DB calls (30s TTL)
    // We ignore the 't' parameter from frontend to ensure cache hits
    const cacheKey = `settings:${key}`;
    const forceRefresh = searchParams.get('refresh') === 'true';

    if (isPublic && !forceRefresh) {
        const cached = memoryCache.get(cacheKey);
        if (cached) {
            return NextResponse.json(cached, {
                headers: { 'X-Cache': 'HIT' }
            });
        }
    }

    // 2. Deduplicate concurrent requests
    try {
        const value = await memoryCache.deduplicate(cacheKey, async () => {
            const data = await getSiteSetting(key);
            if (isPublic) {
                memoryCache.set(cacheKey, data, 30);
            }
            return data;
        });

        return NextResponse.json(value, {
            headers: { 'X-Cache': 'MISS' }
        });
    } catch (error) {
        console.error(`Failed to fetch ${key} settings:`, error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

/**
 * Handle POST request to update site settings (Admin only)
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'adsense';

    try {
        const newValue = await request.json();

        const result = await saveSiteSetting(key, newValue);
        if (result.error) throw new Error(result.error);

        // Invalidate cache on update
        memoryCache.delete(`settings:${key}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Failed to update ${key} settings:`, error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
