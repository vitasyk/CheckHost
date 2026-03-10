import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const globalForPg = globalThis as unknown as {
    pgPool: Pool | undefined;
    pgPoolConnectionString: string | undefined;
};

function createPool() {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        // No verbose logging
    }

    const newPool = new Pool({
        connectionString,
        max: isDev ? 10 : 20, // Lower max connections in dev
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: connectionString?.includes('supabase.co') ? { rejectUnauthorized: false } : undefined
    });

    newPool.on('error', (err) => {
        console.error('[Postgres] Unexpected error on idle client:', err);
    });

    return newPool;
}

// Ensure we only have one pool even with HMR in development
// We normalize the connection string to avoid re-creating pool on minor string differences
const normalizedConnString = connectionString?.trim();

if (!globalForPg.pgPool || globalForPg.pgPoolConnectionString !== normalizedConnString) {
    if (globalForPg.pgPool) {
        globalForPg.pgPool.end().catch(err => console.error('[Postgres] Error ending old pool:', err));
    }
    globalForPg.pgPool = createPool();
    globalForPg.pgPoolConnectionString = normalizedConnString;
}

const pool = globalForPg.pgPool;

export default pool;

// Helper to check if Postgres is configured (and not just a placeholder)
export const isPostgresConfigured = !!connectionString &&
    !connectionString.includes('@host') &&
    !connectionString.includes('your-password');

// Helper to run queries with basic error wrapping
export const query = (text: string, params?: any[]) => {
    try {
        return pool.query(text, params);
    } catch (err) {
        console.error('PostgreSQL query error:', err);
        throw err;
    }
};
