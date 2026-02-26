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
    author TEXT DEFAULT 'Admin',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ad_top BOOLEAN DEFAULT FALSE,
    ad_bottom BOOLEAN DEFAULT FALSE
);

-- Table for sharing check results (Snapshots)
CREATE TABLE IF NOT EXISTS result_snapshots (
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
CREATE INDEX IF NOT EXISTS idx_result_snapshots_expires_at ON result_snapshots(expires_at);
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
