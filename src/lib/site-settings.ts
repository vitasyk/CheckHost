import pool from './postgres';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'site-settings.json');

/**
 * Check if Database is properly configured
 */
const isDbConfigured = () => {
    return !!process.env.DATABASE_URL;
};

/**
 * Get site settings from either PostgreSQL or local file
 */
export async function getSiteSetting(key: string) {
    if (isDbConfigured()) {
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
 * Save site settings to either PostgreSQL or local file
 */
export async function saveSiteSetting(key: string, value: any) {
    if (isDbConfigured()) {
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
