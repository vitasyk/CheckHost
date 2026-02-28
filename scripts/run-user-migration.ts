import { config } from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '20260228_user_monitors.sql'), 'utf8');
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration successful.');
    await pool.end();
}

run().catch(console.error);
