import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Public endpoint to fetch AdSense configuration for the frontend
 * Cached for performance
 */
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'adsense')
            .single();

        if (error) throw error;
        return NextResponse.json(data.value);
    } catch (error) {
        // Fallback or empty config if DB is not ready
        return NextResponse.json({
            client_id: "",
            enabled: false,
            slots: {}
        });
    }
}
