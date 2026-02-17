import { supabase, isSupabaseConfigured } from './supabase';
import pool, { isPostgresConfigured } from './postgres';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'site-settings.json');

/**
 * Get site settings from either Supabase, PostgreSQL or local file
 */
export async function getSiteSetting(key: string) {
    if (isSupabaseConfigured) {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', key)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) return data.value;
        } catch (error) {
            console.error(`[Settings] Supabase error for ${key}:`, error);
        }
    }

    if (isPostgresConfigured) {
        try {
            const result = await pool.query(
                'SELECT value FROM site_settings WHERE key = $1',
                [key]
            );

            if (result.rows.length > 0) {
                return result.rows[0].value;
            }
        } catch (error) {
            console.error(`[Settings] PostgreSQL error for ${key}:`, error);
        }
    }

    // Fallback to local file
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const content = fs.readFileSync(SETTINGS_FILE, 'utf8');
            const allSettings = JSON.parse(content);
            return allSettings[key] || null;
        }
    } catch (error) {
        console.error(`[Settings] Local file error for ${key}:`, error);
    }

    return null;
}

/**
 * Save site settings to either Supabase, PostgreSQL or local file
 */
export async function saveSiteSetting(key: string, value: any) {
    if (isSupabaseConfigured) {
        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    key,
                    value,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'key'
                });

            if (!error) return { success: true };
            console.error(`[Settings] Supabase save error for ${key}:`, error);
        } catch (error) {
            console.error(`[Settings] Supabase save exception for ${key}:`, error);
        }
    }

    if (isPostgresConfigured) {
        try {
            await pool.query(
                `INSERT INTO site_settings (key, value, updated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
                [key, value]
            );
            return { success: true };
        } catch (error) {
            console.error(`[Settings] PostgreSQL save error for ${key}:`, error);
        }
    }

    // Fallback to local file
    try {
        let allSettings: Record<string, any> = {};
        if (fs.existsSync(SETTINGS_FILE)) {
            const content = fs.readFileSync(SETTINGS_FILE, 'utf8');
            allSettings = JSON.parse(content);
        }

        allSettings[key] = value;
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(allSettings, null, 2), 'utf8');
        return { success: true };
    } catch (error) {
        console.error(`[Settings] Local file save error for ${key}:`, error);
        return { error: 'Failed to save settings locally' };
    }
}
