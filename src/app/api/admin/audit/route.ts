import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool, { isPostgresConfigured } from '@/lib/postgres';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

/**
 * Handle GET request for admin audit logs (Admin only)
 */
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'audit';

    try {
        if (type === 'blog') {
            const logPath = path.join(process.cwd(), 'debug-blog.log');
            if (fs.existsSync(logPath)) {
                const content = fs.readFileSync(logPath, 'utf8');
                return new NextResponse(content, {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            }
            return new NextResponse('Log file not found.', { status: 404 });
        }

        if (isPostgresConfigured) {
            const result = await pool.query(
                'SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 200'
            );
            return NextResponse.json(result.rows);
        }

        if (isSupabaseConfigured) {
            const { data, error } = await supabase
                .from('admin_audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) throw error;
            return NextResponse.json(data);
        }

        return NextResponse.json([]);
    } catch (error: any) {
        console.error('[AuditAPI] ERROR:', error.message, error.stack);
        return NextResponse.json({
            error: 'Failed to fetch logs',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
