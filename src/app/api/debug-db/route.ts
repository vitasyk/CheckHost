import { NextResponse } from 'next/server';
import pool from '@/lib/postgres';

export async function GET() {
    try {
        const dbInfo = await pool.query('SELECT current_database(), current_user, inet_server_addr(), inet_server_port()');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        return NextResponse.json({
            database_info: dbInfo.rows[0],
            tables: tables.rows.map(r => r.table_name),
            env_database_url_masked: process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':****@'),
            node_env: process.env.NODE_ENV
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
