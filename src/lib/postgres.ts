import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

function createPool() {
    if (process.env.NODE_ENV === 'development') {
        console.log('[Postgres] Initializing new connection pool...');
    }

    const newPool = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: connectionString?.includes('supabase.co') ? { rejectUnauthorized: false } : undefined
    });

    newPool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client', err);
    });

    return newPool;
}

const globalForPg = globalThis as unknown as {
    pgPool: Pool | undefined;
    pgPoolConnectionString: string | undefined;
};

if (!globalForPg.pgPool || globalForPg.pgPoolConnectionString !== connectionString) {
    if (globalForPg.pgPool) {
        console.log('[Postgres] Connection string changed, ending old pool...');
        globalForPg.pgPool.end().catch(err => console.error('[Postgres] Error ending old pool:', err));
    }
    globalForPg.pgPool = createPool();
    globalForPg.pgPoolConnectionString = connectionString;
}

const pool = globalForPg.pgPool;

export default pool;

// Helper to check if Postgres is configured (and not just a placeholder)
export const isPostgresConfigured = !!connectionString &&
    !connectionString.includes('@host') &&
    !connectionString.includes('your-password') &&
    connectionString !== 'postgresql://postgres:postgres@localhost:5432/postgres';

// Helper to run queries with basic error wrapping
export const query = (text: string, params?: any[]) => {
    try {
        return pool.query(text, params);
    } catch (err) {
        console.error('PostgreSQL query error:', err);
        throw err;
    }
};
