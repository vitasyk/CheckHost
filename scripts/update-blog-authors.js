const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function updateAuthors() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({
        connectionString,
        ssl: connectionString?.includes('supabase.co') ? { rejectUnauthorized: false } : undefined
    });

    try {
        console.log('Connecting to database...');
        const res = await pool.query(
            "UPDATE posts SET author = 'CheckNode' WHERE author = 'Admin' OR author = 'CheckHost Bot' OR author IS NULL"
        );
        console.log(`Success! Updated ${res.rowCount} posts.`);
    } catch (err) {
        console.error('Error updating authors:', err);
    } finally {
        await pool.end();
    }
}

updateAuthors();
