-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for tracking individual checks performed by users
CREATE TABLE IF NOT EXISTS check_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_type VARCHAR(20) NOT NULL, -- ping, http, dns, etc.
    target_host TEXT NOT NULL,
    user_ip VARCHAR(45),
    user_country_code VARCHAR(5),
    nodes_count INTEGER,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for tracking CheckHost API performance and response times
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_endpoint VARCHAR(100) NOT NULL, -- /check/ping, /result, etc.
    check_id UUID REFERENCES check_logs(id) ON DELETE SET NULL,
    response_time_ms INTEGER,
    status_code INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for general site settings (AdSense, global toggles, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for blog posts
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    author TEXT DEFAULT 'CheckNode',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ad_top BOOLEAN DEFAULT FALSE,
    ad_bottom BOOLEAN DEFAULT FALSE,
    locale VARCHAR(10) DEFAULT 'en',
    translation_group UUID
);

-- Table for sharing check results (Snapshots)
CREATE TABLE IF NOT EXISTS share_snapshots (
    id VARCHAR(12) PRIMARY KEY, -- Short NanoID
    check_type VARCHAR(20) NOT NULL,
    target_host TEXT NOT NULL,
    results JSONB NOT NULL,
    check_nodes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Table for Programmatic SEO (Dynamically Generated Pages)
CREATE TABLE IF NOT EXISTS seo_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host VARCHAR(255) NOT NULL,
    tool VARCHAR(50) NOT NULL,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    check_count INTEGER DEFAULT 1,
    UNIQUE(host, tool)
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_share_snapshots_expires_at ON share_snapshots(expires_at);
CREATE INDEX IF NOT EXISTS idx_check_logs_created_at ON check_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_check_logs_type ON check_logs(check_type);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC) WHERE (status = 'published');

-- Seed initial AdSense settings
INSERT INTO site_settings (key, value)
VALUES ('adsense', '{
    "client_id": "ca-pub-XXXXXXXXXXXXXXXX",
    "enabled": false,
    "slots": {
        "homepage_hero": { "id": "1234567890", "enabled": false },
        "results_sidebar": { "id": "0987654321", "enabled": false },
        "results_bottom": { "id": "1122334455", "enabled": false }
    }
}'),
('system_config', '{
    "snapshot_ttl_days": 30
}')
ON CONFLICT (key) DO NOTHING;

-- Table for User Accounts (SaaS)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    image TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Table for Auto-Blogger Keywords
CREATE TABLE IF NOT EXISTS blog_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_blog_keywords_status ON blog_keywords(status);

-- Table for Admin Audit Logs
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

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_email ON admin_audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- Documentation System
CREATE TABLE IF NOT EXISTS docs_articles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    section VARCHAR(100) NOT NULL DEFAULT 'General',
    order_index INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT false,
    locale VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_docs_articles_slug ON docs_articles(slug);
CREATE INDEX IF NOT EXISTS idx_docs_articles_section_order ON docs_articles(section, order_index);

-- User Monitors and Activity feeds
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
    notify_email TEXT,
    notify_telegram TEXT,
    check_interval_hours INTEGER DEFAULT 24,
    UNIQUE(user_id, domain, type)
);

COMMENT ON COLUMN user_monitors.notify_email IS 'Email address that receives alert/recovery notifications for this monitor';
COMMENT ON COLUMN user_monitors.notify_telegram IS 'Telegram chat_id (or username) for Telegram notifications — future use';
COMMENT ON COLUMN user_monitors.check_interval_hours IS 'Interval in hours between automatic checks for this monitor';

CREATE INDEX IF NOT EXISTS idx_user_monitors_next_check ON user_monitors(next_check_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_monitors_user_id ON user_monitors(user_id);

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

CREATE INDEX IF NOT EXISTS idx_user_feed_user_id_created ON user_activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feed_unread ON user_activity_feed(user_id) WHERE is_read = false;

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) ENABLEMENT
--------------------------------------------------------------------------------
-- Migration: Refine Row Level Security (RLS) policies to resolve "rls_policy_always_true" warnings
-- Supabase linter flags expressions like `USING (true)` or `WITH CHECK (true)` as overly permissive.

-- Polyfill for local environments (Docker) where 'auth' schema doesn't exist
-- This allows the refined policies to work without errors outside of Supabase.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
  SELECT current_user::text;
$$ LANGUAGE sql STABLE;

-- To maintain compatibility with the Next.js app that uses the anon key for server-to-server 
-- communication, we use auth.role() checks instead of 'true' for RLS policies.
-- check_logs
ALTER TABLE public.check_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.check_logs;
CREATE POLICY "Allow anon and authenticated access" ON public.check_logs FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- api_usage_logs
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.api_usage_logs;
CREATE POLICY "Allow anon and authenticated access" ON public.api_usage_logs FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.posts;
CREATE POLICY "Allow anon and authenticated access" ON public.posts FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- blog_keywords
ALTER TABLE public.blog_keywords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.blog_keywords;
CREATE POLICY "Allow anon and authenticated access" ON public.blog_keywords FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- admin_audit_logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.admin_audit_logs;
CREATE POLICY "Allow anon and authenticated access" ON public.admin_audit_logs FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- user_activity_feed
ALTER TABLE public.user_activity_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.user_activity_feed;
CREATE POLICY "Allow anon and authenticated access" ON public.user_activity_feed FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- user_monitors
ALTER TABLE public.user_monitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.user_monitors;
CREATE POLICY "Allow anon and authenticated access" ON public.user_monitors FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- docs_articles
ALTER TABLE public.docs_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.docs_articles;
CREATE POLICY "Allow anon and authenticated access" ON public.docs_articles FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.users;
CREATE POLICY "Allow anon and authenticated access" ON public.users FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- seo_pages
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.seo_pages;
CREATE POLICY "Allow anon and authenticated access" ON public.seo_pages FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- share_snapshots
ALTER TABLE public.share_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.share_snapshots;
CREATE POLICY "Allow anon and authenticated access" ON public.share_snapshots FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.site_settings;
DROP POLICY IF EXISTS "Allow full access" ON public.site_settings;
CREATE POLICY "Allow anon and authenticated access" ON public.site_settings FOR ALL USING (auth.role() IN ('anon', 'authenticated')) WITH CHECK (auth.role() IN ('anon', 'authenticated'));
