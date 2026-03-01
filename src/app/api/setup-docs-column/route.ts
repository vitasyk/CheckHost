
import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET() {
    try {
        await query(`
            ALTER TABLE docs_articles 
            ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en';
        `);
        return NextResponse.json({ success: true, message: 'Column added successfully' });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
