const pool = require('./src/lib/postgres').default;

async function migrate() {
    console.log("Adding locale column to docs_articles...");
    try {
        await pool.query(`
            ALTER TABLE docs_articles 
            ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en';
        `);
        console.log("Migration successful.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    }
    process.exit(0);
}

migrate();
