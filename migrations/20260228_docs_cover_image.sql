-- Migration: Add cover_image to docs_articles
ALTER TABLE docs_articles ADD COLUMN IF NOT EXISTS cover_image TEXT;
