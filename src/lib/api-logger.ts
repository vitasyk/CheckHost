import { supabase } from './supabase';

const isSupabaseConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key';

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
        if (!isSupabaseConfigured) return null;
        try {
            const { data: result, error } = await supabase
                .from('check_logs')
                .insert([data])
                .select()
                .single();

            if (error) throw error;
            return result.id;
        } catch (error) {
            console.error('Failed to log check:', error);
            return null;
        }
    },

    /**
     * Log an API request/response metric
     */
    async logApiUsage(data: ApiUsageLog) {
        if (!isSupabaseConfigured) return;
        try {
            const { error } = await supabase
                .from('api_usage_logs')
                .insert([data]);

            if (error) throw error;
        } catch (error) {
            console.error('Failed to log API usage:', error);
        }
    },

    /**
     * Update check log status (e.g., if a long-running check fails later)
     */
    async updateCheckStatus(id: string, status: string, errorMessage?: string) {
        if (!isSupabaseConfigured) return;
        try {
            await supabase
                .from('check_logs')
                .update({ status, error_message: errorMessage })
                .eq('id', id);
        } catch (error) {
            console.error('Failed to update check status:', error);
        }
    }
};
