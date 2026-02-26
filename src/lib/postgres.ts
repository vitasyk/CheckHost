import { Pool } from 'pg';

// Singleton logic for PostgreSQL Pool in Next.js
declare global {
    var pgPool: Pool | undefined;
    var pgPoolConnectionString: string | undefined;
}

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

// Check if we need to recreate the pool (connection string changed or first init)
if (!global.pgPool || global.pgPoolConnectionString !== connectionString) {
    if (global.pgPool) {
        console.log('[Postgres] Connection string changed, ending old pool...');
        global.pgPool.end().catch(err => console.error('[Postgres] Error ending old pool:', err));
    }
    global.pgPool = createPool();
    global.pgPoolConnectionString = connectionString;
}

const pool = global.pgPool;

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
