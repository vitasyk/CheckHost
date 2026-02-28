-- Migration to link translations across different locales
-- This allows finding the corresponding version of an article when switching languages

-- Add translation_group to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS translation_group UUID;
CREATE INDEX IF NOT EXISTS idx_posts_translation_group ON posts(translation_group);

-- Add translation_group to docs_articles
ALTER TABLE docs_articles ADD COLUMN IF NOT EXISTS translation_group UUID;
CREATE INDEX IF NOT EXISTS idx_docs_articles_translation_group ON docs_articles(translation_group);
