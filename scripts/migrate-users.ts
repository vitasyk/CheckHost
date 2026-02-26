import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Завантажуємо .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('Creating users table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                image TEXT,
                role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
                plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP WITH TIME ZONE
            );
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        `);

        console.log('✅ Migration successful: Table "users" and index created or already exist.');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
