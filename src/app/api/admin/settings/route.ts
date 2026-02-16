import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSiteSetting, saveSiteSetting } from '@/lib/site-settings';

/**
 * Handle GET request for site settings (Admin only)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'adsense';

    // Publicly accessible keys (non-sensitive UI configs)
    const publicKeys = ['ip_info_display', 'adsense', 'feature_flags'];
    const isPublic = publicKeys.includes(key);

    if (!isPublic) {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const value = await getSiteSetting(key);
        return NextResponse.json(value);
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Failed to update ${key} settings:`, error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
