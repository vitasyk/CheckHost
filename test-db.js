const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        const res = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
        console.log("Tables:", res.rows.map(r => r.table_name));

        const checkUsers = await pool.query('SELECT * FROM users LIMIT 1');
        console.log("Users:", checkUsers.rows);
    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        pool.end();
    }
}

test();
