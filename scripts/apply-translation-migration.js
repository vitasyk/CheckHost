const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({
        connectionString,
        ssl: connectionString?.includes('supabase.co') ? { rejectUnauthorized: false } : undefined
    });

    try {
        console.log('Connecting to database...');

        // Add columns
        await pool.query("ALTER TABLE posts ADD COLUMN IF NOT EXISTS translation_group UUID");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_posts_translation_group ON posts(translation_group)");

        await pool.query("ALTER TABLE docs_articles ADD COLUMN IF NOT EXISTS translation_group UUID");
        await pool.query("CREATE INDEX IF NOT EXISTS idx_docs_articles_translation_group ON docs_articles(translation_group)");

        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        await pool.end();
    }
}

applyMigration();
