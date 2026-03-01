import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/postgres';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Migration] Starting FULL Docker DB migration...');

        // 1. Types
        await pool.query(`
            DO $$ BEGIN
                CREATE TYPE monitor_type AS ENUM ('ssl', 'dns', 'blacklist', 'uptime');
            EXCEPTION WHEN duplicate_object THEN null; END $$;

            DO $$ BEGIN
                CREATE TYPE monitor_status AS ENUM ('ok', 'warning', 'error', 'pending');
            EXCEPTION WHEN duplicate_object THEN null; END $$;

            DO $$ BEGIN
                CREATE TYPE feed_event_type AS ENUM ('info', 'warning', 'success', 'error');
            EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);

        // 2. Tables & Rename
        await pool.query(`
            -- Rename snapshots table if exists
            DO $$ BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'result_snapshots') THEN
                    ALTER TABLE result_snapshots RENAME TO share_snapshots;
                    ALTER INDEX IF EXISTS idx_result_snapshots_expires_at RENAME TO idx_share_snapshots_expires_at;
                END IF;
            END $$;

            -- Admin Logs
            CREATE TABLE IF NOT EXISTS admin_audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                admin_email VARCHAR(255) NOT NULL,
                action VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id VARCHAR(255),
                details JSONB,
                ip_address VARCHAR(45),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Docs
            CREATE TABLE IF NOT EXISTS docs_articles (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                section VARCHAR(100) NOT NULL DEFAULT 'General',
                order_index INTEGER DEFAULT 0,
                published BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Snapshots (if not already renamed)
            CREATE TABLE IF NOT EXISTS share_snapshots (
                id VARCHAR(12) PRIMARY KEY,
                check_type VARCHAR(20) NOT NULL,
                target_host TEXT NOT NULL,
                results JSONB NOT NULL,
                check_nodes JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP WITH TIME ZONE,
                metadata JSONB
            );

            -- Monitors
            CREATE TABLE IF NOT EXISTS user_monitors (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                domain VARCHAR(255) NOT NULL,
                type monitor_type NOT NULL,
                status monitor_status DEFAULT 'pending',
                last_check_at TIMESTAMP WITH TIME ZONE,
                next_check_at TIMESTAMP WITH TIME ZONE,
                meta JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                UNIQUE(user_id, domain, type)
            );

            -- Feed
            CREATE TABLE IF NOT EXISTS user_activity_feed (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                monitor_id UUID REFERENCES user_monitors(id) ON DELETE SET NULL,
                event_type feed_event_type NOT NULL DEFAULT 'info',
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                meta JSONB DEFAULT '{}'::jsonb
            );

            -- Add columns to posts if missing
            DO $$ BEGIN
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'locale') THEN
                    ALTER TABLE posts ADD COLUMN locale VARCHAR(10) DEFAULT 'en';
                END IF;
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'translation_group') THEN
                    ALTER TABLE posts ADD COLUMN translation_group UUID;
                END IF;
            END $$;
        `);

        // 3. Indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_email ON admin_audit_logs(admin_email);
            CREATE INDEX IF NOT EXISTS idx_docs_articles_slug ON docs_articles(slug);
            CREATE INDEX IF NOT EXISTS idx_share_snapshots_expires_at ON share_snapshots(expires_at);
            CREATE INDEX IF NOT EXISTS idx_user_monitors_user_id ON user_monitors(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_feed_user_id_created ON user_activity_feed(user_id, created_at DESC);
        `);

        console.log('[Migration] FULL migration completed successfully.');

        return NextResponse.json({
            success: true,
            message: 'Docker DB successfully migrated with all tables and columns.'
        });
    } catch (error: any) {
        console.error('[Migration] Migration failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
