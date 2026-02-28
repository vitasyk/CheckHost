-- Migration to add user-specific monitors and activity feeds

-- 1. Create enum for monitor status and types if not exist
DO $$ BEGIN
    CREATE TYPE monitor_type AS ENUM ('ssl', 'dns', 'blacklist', 'uptime');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE monitor_status AS ENUM ('ok', 'warning', 'error', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feed_event_type AS ENUM ('info', 'warning', 'success', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the table for domains/services users want to monitor
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

-- Index for faster cron job queries
CREATE INDEX IF NOT EXISTS idx_user_monitors_next_check ON user_monitors(next_check_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_monitors_user_id ON user_monitors(user_id);

-- 3. Create the Activity Feed table explicitly for the user dashboard
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

-- Index to fetch user's feed quickly
CREATE INDEX IF NOT EXISTS idx_user_feed_user_id_created ON user_activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feed_unread ON user_activity_feed(user_id) WHERE is_read = false;
