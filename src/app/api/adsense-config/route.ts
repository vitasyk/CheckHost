import { NextResponse } from 'next/server';
import { getSiteSetting } from '@/lib/site-settings';

/**
 * Public endpoint to fetch AdSense configuration for the frontend
 * Uses site-settings utility for robust fallback support
 */
export async function GET() {
    try {
        const adsenseConfig = await getSiteSetting('adsense');

        const defaultSlots = {
            homepage_hero: { id: '', enabled: false },
            results_bottom: { id: '', enabled: false },
            blog_content: { id: '', enabled: false },
            blog_top: { id: '', enabled: false },
            blog_bottom: { id: '', enabled: false },
            share_content: { id: '', enabled: false },
            error_page_content: { id: '', enabled: false }
        };

        if (!adsenseConfig) {
            console.log('[AdSense] No configuration found, returning defaults');
            return NextResponse.json({
                client_id: "",
                enabled: false,
                slots: defaultSlots
            });
        }

        // Merge with defaults to ensure new slots exist
        return NextResponse.json({
            ...adsenseConfig,
            slots: { ...defaultSlots, ...(adsenseConfig.slots || {}) },
            placements: adsenseConfig.placements || []
        });
    } catch (error) {
        console.error('[System] Config Error:', error);
        return NextResponse.json({
            client_id: "",
            enabled: false,
            slots: {}
        });
    }
}
