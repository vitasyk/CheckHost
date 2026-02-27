
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSiteSetting, saveSiteSetting } from '@/lib/site-settings';
import { memoryCache } from '@/lib/cache';
import { logAdminAction } from '@/lib/audit-logger';

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
        const cached = await memoryCache.get(cacheKey);
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
                await memoryCache.set(cacheKey, data, 30);
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

        // Security check for admin_access
        if (key === 'admin_access' && newValue.credentials?.password) {
            const bcrypt = await import('bcryptjs');
            const oldAccess = await getSiteSetting('admin_access');

            // If the password changed or is a plaintext string matching the old one (not likely but safe)
            // Basically if it doesn't look like a bcrypt hash (length 60 starting with $2a$ etc.)
            const isHashed = newValue.credentials.password.startsWith('$2') && newValue.credentials.password.length === 60;

            if (!isHashed && (!oldAccess?.credentials?.password || newValue.credentials.password !== oldAccess.credentials.password)) {
                const salt = await bcrypt.genSalt(10);
                newValue.credentials.password = await bcrypt.hash(newValue.credentials.password, salt);
            } else if (!isHashed && oldAccess?.credentials?.password && newValue.credentials.password === oldAccess.credentials.password) {
                // If they saved the exact same plaintext password again, we still hash it
                const salt = await bcrypt.genSalt(10);
                newValue.credentials.password = await bcrypt.hash(newValue.credentials.password, salt);
            }
        }

        const result = await saveSiteSetting(key, newValue);
        if (result.error) throw new Error(result.error);

        // Audit Logging
        await logAdminAction({
            adminEmail: session.user?.email || 'unknown',
            action: 'UPDATE_SETTING',
            entityType: 'setting',
            entityId: key,
            details: { key },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        });

        // Invalidate cache on update
        await memoryCache.delete(`settings:${key}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Failed to update ${key} settings:`, error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
