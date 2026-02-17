import { NextResponse } from 'next/server';
import { getSiteSetting } from '@/lib/site-settings';

/**
 * Public endpoint to fetch AdSense configuration for the frontend
 * Uses site-settings utility for robust fallback support
 */
export async function GET() {
    try {
        const adsenseConfig = await getSiteSetting('adsense');

        if (!adsenseConfig) {
            console.log('[AdSense] No configuration found, returning defaults');
            return NextResponse.json({
                client_id: "",
                enabled: false,
                slots: {}
            });
        }

        return NextResponse.json(adsenseConfig);
    } catch (error) {
        console.error('[AdSense] API Error:', error);
        return NextResponse.json({
            client_id: "",
            enabled: false,
            slots: {}
        });
    }
}
