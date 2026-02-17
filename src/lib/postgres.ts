import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    // Recommended for serverless/Next.js to avoid connection leaks
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

export default pool;

// Helper to run queries
export const query = (text: string, params?: any[]) => pool.query(text, params);
