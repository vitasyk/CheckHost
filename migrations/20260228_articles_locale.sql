-- Migration to add locale column to posts and docs_articles

-- Add locale to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en';
CREATE INDEX IF NOT EXISTS idx_posts_locale_status ON posts(locale, status);

-- Add locale to docs_articles
ALTER TABLE docs_articles ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en';
CREATE INDEX IF NOT EXISTS idx_docs_articles_locale_published ON docs_articles(locale, published);
