import { supabase, isSupabaseConfigured } from './supabase';
import pool, { isPostgresConfigured } from './postgres';
import { getSiteSetting } from './site-settings';

// Cache for logging settings to avoid DB spam (60s TTL)
let cachedVerboseMode: boolean | null = null;
let lastCheckTime = 0;

async function isVerbose(): Promise<boolean> {
    const now = Date.now();
    if (cachedVerboseMode !== null && (now - lastCheckTime < 60000)) {
        return cachedVerboseMode;
    }

    try {
        const config = await getSiteSetting('system_config');
        cachedVerboseMode = config?.verboseLogging === true;
        lastCheckTime = now;
        return cachedVerboseMode;
    } catch (e) {
        return false;
    }
}

export interface CheckLog {
    check_type: string;
    target_host: string;
    user_ip?: string;
    user_country_code?: string;
    nodes_count?: number;
    status?: string;
    error_message?: string;
}

export interface ApiUsageLog {
    api_endpoint: string;
    check_id?: string;
    response_time_ms: number;
    status_code: number;
}

export const apiLogger = {
    /**
     * Log a message to terminal ONLY if verbose logging is enabled
     */
    async info(message: string, ...args: any[]) {
        if (await isVerbose()) {
            console.log(`[SYSTEM] ${message}`, ...args);
        }
    },

    /**
     * Log an error to terminal (always logged, but prefixed)
     */
    async error(message: string, ...args: any[]) {
        console.error(`[ERROR] ${message}`, ...args);
    },

    /**
     * Log a user check event
     */
    async logCheck(data: CheckLog) {
        if (isSupabaseConfigured) {
            try {
                const { data: result, error } = await supabase
                    .from('check_logs')
                    .insert([data])
                    .select()
                    .single();

                if (error) throw error;
                return result.id;
            } catch (error) {
                console.error('Failed to log check to Supabase:', error);
            }
        }

        if (isPostgresConfigured) {
            try {
                const result = await pool.query(
                    `INSERT INTO check_logs (check_type, target_host, user_ip, user_country_code, nodes_count, status, error_message)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     RETURNING id`,
                    [data.check_type, data.target_host, data.user_ip, data.user_country_code, data.nodes_count, data.status || 'success', data.error_message]
                );

                return result.rows[0].id;
            } catch (error) {
                console.error('Failed to log check to PostgreSQL:', error);
            }
        }

        return null;
    },

    /**
     * Log an API request/response metric
     */
    async logApiUsage(data: ApiUsageLog) {
        if (isSupabaseConfigured) {
            try {
                const { error } = await supabase
                    .from('api_usage_logs')
                    .insert([data]);

                if (error) throw error;
                return;
            } catch (error) {
                console.error('Failed to log API usage to Supabase:', error);
            }
        }

        if (isPostgresConfigured) {
            try {
                await pool.query(
                    `INSERT INTO api_usage_logs (api_endpoint, check_id, response_time_ms, status_code)
                     VALUES ($1, $2, $3, $4)`,
                    [data.api_endpoint, data.check_id, data.response_time_ms, data.status_code]
                );
            } catch (error) {
                console.error('Failed to log API usage to PostgreSQL:', error);
            }
        }
    },

    /**
     * Update check log status
     */
    async updateCheckStatus(id: string, status: string, errorMessage?: string) {
        if (isSupabaseConfigured) {
            try {
                await supabase
                    .from('check_logs')
                    .update({ status, error_message: errorMessage })
                    .eq('id', id);
                return;
            } catch (error) {
                console.error('Failed to update check status in Supabase:', error);
            }
        }

        if (isPostgresConfigured) {
            try {
                await pool.query(
                    `UPDATE check_logs SET status = $1, error_message = $2 WHERE id = $3`,
                    [status, errorMessage, id]
                );
            } catch (error) {
                console.error('Failed to update check status in PostgreSQL:', error);
            }
        }
    }
};
