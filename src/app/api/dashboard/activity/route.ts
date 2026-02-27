import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import pool, { isPostgresConfigured } from '@/lib/postgres';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const typeInfo = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const targetHost = searchParams.get('target_host') || '';
    const userIp = searchParams.get('user_ip') || '';
    const dateStr = searchParams.get('date') || '';

    // Sorting
    const sortParam = searchParams.get('sort') || 'created_at';
    const orderParam = searchParams.get('order') || 'desc';

    // Validate sort fields to prevent SQL injection
    const allowedSortFields = ['created_at', 'check_type', 'target_host', 'user_ip', 'status'];
    const sortColumn = allowedSortFields.includes(sortParam) ? sortParam : 'created_at';
    const sortOrder = orderParam.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const isAscending = sortOrder === 'ASC';

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    try {
        let logs: any[] = [];
        let total = 0;

        // Generate date boundaries if date string provided
        let startOfDay, endOfDay;
        if (dateStr) {
            startOfDay = new Date(dateStr);
            startOfDay.setUTCHours(0, 0, 0, 0);
            endOfDay = new Date(dateStr);
            endOfDay.setUTCHours(23, 59, 59, 999);
        }

        if (isSupabaseConfigured) {
            let querySbLogs = supabase.from('check_logs').select('*', { count: 'exact' });

            // Apply Filters
            if (typeInfo) querySbLogs = querySbLogs.eq('check_type', typeInfo);
            if (status) querySbLogs = querySbLogs.eq('status', status);
            if (targetHost) querySbLogs = querySbLogs.ilike('target_host', `%${targetHost}%`);
            if (userIp) querySbLogs = querySbLogs.ilike('user_ip', `%${userIp}%`);
            if (dateStr && startOfDay && endOfDay) {
                querySbLogs = querySbLogs.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
            }

            querySbLogs = querySbLogs.order(sortColumn, { ascending: isAscending }).range(offset, offset + limit - 1);

            const { data, count, error } = await querySbLogs;

            if (error) throw error;

            logs = data || [];
            total = count || 0;

            return NextResponse.json({
                data: logs,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        }

        if (isPostgresConfigured) {
            const conditions: string[] = [];
            const params: any[] = [];
            let paramIndex = 1;

            if (typeInfo) {
                conditions.push(`check_type = $${paramIndex++}`);
                params.push(typeInfo);
            }
            if (status) {
                conditions.push(`status = $${paramIndex++}`);
                params.push(status);
            }
            if (targetHost) {
                conditions.push(`target_host ILIKE $${paramIndex++}`);
                params.push(`%${targetHost}%`);
            }
            if (userIp) {
                conditions.push(`user_ip ILIKE $${paramIndex++}`);
                params.push(`%${userIp}%`);
            }
            if (dateStr && startOfDay && endOfDay) {
                conditions.push(`created_at >= $${paramIndex++} AND created_at <= $${paramIndex++}`);
                params.push(startOfDay.toISOString(), endOfDay.toISOString());
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            // Count total matching records
            const countQuery = `SELECT COUNT(*) FROM check_logs ${whereClause}`;
            const countRes = await pool.query(countQuery, params);
            total = parseInt(countRes.rows[0].count, 10);

            // Fetch records for the current page
            const logsQuery = `
                SELECT * FROM check_logs 
                ${whereClause} 
                ORDER BY ${sortColumn} ${sortOrder} 
                LIMIT $${paramIndex++} OFFSET $${paramIndex}
            `;
            const logsParams = [...params, limit, offset];
            const logsRes = await pool.query(logsQuery, logsParams);
            logs = logsRes.rows;

            return NextResponse.json({
                data: logs,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        }

        return NextResponse.json({ error: 'No database configured' }, { status: 500 });

    } catch (error) {
        console.error('Failed to fetch activity logs:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
