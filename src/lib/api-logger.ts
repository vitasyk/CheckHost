import pool from './postgres';

const isDbConfigured = !!process.env.DATABASE_URL;

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
     * Log a user check event
     */
    async logCheck(data: CheckLog) {
        if (!isDbConfigured) return null;
        try {
            const result = await pool.query(
                `INSERT INTO check_logs (check_type, target_host, user_ip, user_country_code, nodes_count, status, error_message)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [data.check_type, data.target_host, data.user_ip, data.user_country_code, data.nodes_count, data.status || 'success', data.error_message]
            );

            return result.rows[0].id;
        } catch (error) {
            console.error('Failed to log check:', error);
            return null;
        }
    },

    /**
     * Log an API request/response metric
     */
    async logApiUsage(data: ApiUsageLog) {
        if (!isDbConfigured) return;
        try {
            await pool.query(
                `INSERT INTO api_usage_logs (api_endpoint, check_id, response_time_ms, status_code)
                 VALUES ($1, $2, $3, $4)`,
                [data.api_endpoint, data.check_id, data.response_time_ms, data.status_code]
            );
        } catch (error) {
            console.error('Failed to log API usage:', error);
        }
    },

    /**
     * Update check log status
     */
    async updateCheckStatus(id: string, status: string, errorMessage?: string) {
        if (!isDbConfigured) return;
        try {
            await pool.query(
                `UPDATE check_logs SET status = $1, error_message = $2 WHERE id = $3`,
                [status, errorMessage, id]
            );
        } catch (error) {
            console.error('Failed to update check status:', error);
        }
    }
};
