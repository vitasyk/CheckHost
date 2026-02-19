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
