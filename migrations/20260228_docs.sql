-- Migration: Documentation System
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

-- Index for faster lookup by slug
CREATE INDEX IF NOT EXISTS idx_docs_articles_slug ON docs_articles(slug);
-- Index for ordering within sections
CREATE INDEX IF NOT EXISTS idx_docs_articles_section_order ON docs_articles(section, order_index);
