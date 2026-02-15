import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * Handle GET request for AdSense settings (Admin only)
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'adsense')
            .single();

        if (error) throw error;
        return NextResponse.json(data.value);
    } catch (error) {
        console.error('Failed to fetch AdSense settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

/**
 * Handle POST request to update AdSense settings (Admin only)
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const newValue = await request.json();

        const { error } = await supabase
            .from('site_settings')
            .upsert({
                key: 'adsense',
                value: newValue,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update AdSense settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
