import { supabase, isSupabaseConfigured } from './supabase';
import pool, { isPostgresConfigured } from './postgres';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'site-settings.json');

function getLocalConfig() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const content = fs.readFileSync(SETTINGS_FILE, 'utf8');
            return JSON.parse(content);
        }
    } catch (e) {
        console.error('[Settings] Error reading local config:', e);
    }
    return {};
}

/**
 * Get site settings from either Supabase, PostgreSQL or local file
 */
export async function getSiteSetting(key: string) {
    const localConfig = getLocalConfig();
    const systemConfig = localConfig['system_config'] || {};

    // Check Kill-Switches (default to enabled if not set)
    const pgEnabled = systemConfig.db_postgres_enabled !== false;
    const sbEnabled = systemConfig.db_supabase_enabled !== false;

    if (isSupabaseConfigured && sbEnabled) {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', key)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) return data.value;
        } catch (error: any) {
            console.error(`[Settings] Supabase error for ${key}:`, error?.message || JSON.stringify(error) || error);
        }
    }

    if (isPostgresConfigured && pgEnabled) {
        try {
            const result = await pool.query(
                'SELECT value FROM site_settings WHERE key = $1',
                [key]
            );

            if (result.rows.length > 0) {
                return result.rows[0].value;
            }
        } catch (error: any) {
            console.error(`[Settings] PostgreSQL error for ${key}:`, error?.message || error);
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
    const localConfig = getLocalConfig();
    const systemConfig = localConfig['system_config'] || {};

    const pgEnabled = systemConfig.db_postgres_enabled !== false;
    const sbEnabled = systemConfig.db_supabase_enabled !== false;

    // Always save to local file FIRST if it's a connectivity setting
    // to ensure we don't lock ourselves out
    if (key === 'system_config') {
        try {
            const allSettings = { ...localConfig, [key]: value };
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(allSettings, null, 2), 'utf8');
        } catch {
            console.error('[Settings] Critical: Failed to save connectivity settings locally');
        }
    }

    if (isSupabaseConfigured && sbEnabled) {
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

    if (isPostgresConfigured && pgEnabled) {
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
