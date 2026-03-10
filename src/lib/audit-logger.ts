import pool, { isPostgresConfigured } from './postgres';
import { supabase, isSupabaseConfigured } from './supabase';

export interface AuditLogParams {
    adminEmail: string;
    action: 'UPDATE_SETTING' | 'DELETE_POST' | 'CREATE_POST' | 'UPDATE_POST' | 'BLOCK_USER' | 'UNBLOCK_USER' | 'ADD_USER' | 'LOGIN_FAILURE' | 'CLEAR_SNAPSHOTS' | 'DB_SYNC' | 'BULK_DELETE_POSTS';
    entityType: 'setting' | 'post' | 'user' | 'system' | 'database';
    entityId?: string;
    details?: any;
    ipAddress?: string;
}

/**
 * Logs an administrative action for audit purposes.
 */
export async function logAdminAction({
    adminEmail,
    action,
    entityType,
    entityId,
    details,
    ipAddress
}: AuditLogParams) {
    try {
        if (isPostgresConfigured) {
            await pool.query(
                `INSERT INTO admin_audit_logs 
                (admin_email, action, entity_type, entity_id, details, ip_address) 
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [adminEmail, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress]
            );
        } else if (isSupabaseConfigured) {
            const { error } = await supabase
                .from('admin_audit_logs')
                .insert({
                    admin_email: adminEmail,
                    action,
                    entity_type: entityType,
                    entity_id: entityId,
                    details,
                    ip_address: ipAddress
                });
            if (error) throw error;
        }

        if (process.env.NODE_ENV === 'development') {
            // Audit logging
        }
    } catch (error) {
        console.error('[AuditLog] Failed to log admin action:', error);
    }
}
