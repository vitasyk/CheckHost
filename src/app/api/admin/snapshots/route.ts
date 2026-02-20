import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import pool, { isPostgresConfigured } from '@/lib/postgres';

/**
 * Handle DELETE request to clear snapshots (Admin only)
 */
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    if (!all) {
        return NextResponse.json({ error: 'Missing required parameter: all=true' }, { status: 400 });
    }

    try {
        if (isPostgresConfigured) {
            await pool.query('TRUNCATE TABLE result_snapshots');
        } else if (isSupabaseConfigured) {
            // Supabase doesn't support TRUNCATE via REST API easily, 
            // so we delete all rows. For large tables, a stored procedure would be better.
            const { error } = await supabase
                .from('result_snapshots')
                .delete()
                .neq('id', 'placeholder-non-existent-id'); // Delete all rows
            if (error) throw error;
        } else {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'All snapshots cleared' });
    } catch (error: any) {
        console.error('Error clearing snapshots:', error);
        return NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
    }
}
