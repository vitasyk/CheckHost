import pool, { isPostgresConfigured } from './postgres';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Logs a successful user query to the seo_pages database table
 * to generate programmatic SEO URLs automatically.
 */
export async function logSeoPage(host: string, tool: string) {
    if (!host || !tool) return;

    // Quick sanitization
    const cleanHost = host.trim().toLowerCase();

    try {
        if (isPostgresConfigured) {
            await pool.query(`
                INSERT INTO seo_pages (host, tool, last_checked, check_count)
                VALUES ($1, $2, NOW(), 1)
                ON CONFLICT (host, tool) 
                DO UPDATE SET 
                    last_checked = NOW(),
                    check_count = seo_pages.check_count + 1
            `, [cleanHost, tool]);
        } else if (isSupabaseConfigured) {
            // First try to fetch to check existence
            const { data } = await supabase
                .from('seo_pages')
                .select('id, check_count')
                .eq('host', cleanHost)
                .eq('tool', tool)
                .single();

            if (data) {
                await supabase
                    .from('seo_pages')
                    .update({
                        last_checked: new Date().toISOString(),
                        check_count: data.check_count + 1
                    })
                    .eq('id', data.id);
            } else {
                await supabase
                    .from('seo_pages')
                    .insert({
                        host: cleanHost,
                        tool,
                        last_checked: new Date().toISOString(),
                        check_count: 1
                    });
            }
        }
    } catch (err) {
        // Silently fail so we don't break the user's check experience
        console.error('[SEO Logger] Error logging SEO page:', err);
    }
}
