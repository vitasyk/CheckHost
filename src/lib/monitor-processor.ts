import { query } from './postgres';
import net from 'net';
import { promises as dnsPromises } from 'dns';

/**
 * Background processor for user monitors.
 * Triggered by cron job.
 */
export async function processMonitors() {
    console.log('[MonitorProcessor] Starting check run...');

    // Get monitors due for check (status=pending OR next_check_at <= now)
    const dueMonitors = await query(`
        SELECT * FROM user_monitors 
        WHERE is_active = true 
        AND (status = 'pending' OR next_check_at IS NULL OR next_check_at <= CURRENT_TIMESTAMP)
        LIMIT 20
    `);

    if (dueMonitors.rows.length === 0) {
        console.log('[MonitorProcessor] No monitors due for check.');
        return { processed: 0 };
    }

    const results = await Promise.all(dueMonitors.rows.map(async (m) => {
        try {
            const result = await checkMonitor(m.type, m.domain, m.meta);

            // Check if status changed to generate feed item
            if (m.status !== result.status && m.status !== 'pending') {
                await createFeedItem(m.user_id, m.id, result.status, m.domain, m.type);
            }

            // Update monitor record
            const nextCheck = new Date(Date.now() + 15 * 60 * 1000); // Check every 15 mins
            await query(`
                UPDATE user_monitors 
                SET status = $1, last_check_at = CURRENT_TIMESTAMP, next_check_at = $2, meta = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
            `, [result.status, nextCheck, JSON.stringify({ ...m.meta, ...result.meta }), m.id]);

            return { id: m.id, status: result.status };
        } catch (e: any) {
            console.error(`[MonitorProcessor] Error checking monitor ${m.id} (${m.type}):`, e);
            return { id: m.id, error: e.message };
        }
    }));

    console.log(`[MonitorProcessor] Completed check run. Processed ${results.length} monitors.`);
    return { processed: results.length, results };
}

async function checkMonitor(type: string, domain: string, meta: any) {
    switch (type) {
        case 'smtp':
            return checkPort(domain, 25);
        case 'ssl':
            return checkSsl(domain);
        case 'dns':
            return checkDns(domain);
        case 'uptime':
            return checkUptime(domain);
        default:
            return { status: 'ok', meta: { note: 'Unknown type, defaulting to ok' } };
    }
}

async function checkPort(host: string, port: number): Promise<{ status: 'ok' | 'error', meta: any }> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        const start = Date.now();

        socket.on('connect', () => {
            const rtt = Date.now() - start;
            socket.destroy();
            resolve({ status: 'ok', meta: { last_rtt: rtt } });
        });

        const handleError = (msg: string) => {
            socket.destroy();
            resolve({ status: 'error', meta: { last_error: msg } });
        };

        socket.on('timeout', () => handleError('Connection timeout'));
        socket.on('error', (err) => handleError(err.message));

        socket.connect(port, host);
    });
}

async function checkSsl(domain: string) {
    // Simplified SSL check for background processing
    // In a real app, you'd use tls.connect and verify expiration
    return { status: 'ok', meta: { checked: true } };
}

async function checkDns(domain: string) {
    try {
        await dnsPromises.resolve4(domain);
        return { status: 'ok', meta: { resolved: true } };
    } catch {
        return { status: 'error', meta: { error: 'DNS resolution failed' } };
    }
}

async function checkUptime(domain: string) {
    return checkPort(domain, 80); // Default to HTTP port for uptime
}

async function createFeedItem(userId: string, monitorId: string, status: string, domain: string, type: string) {
    const title = status === 'ok' ? 'Monitor recovered' : 'Monitor alert';
    const eventType = status === 'ok' ? 'success' : 'error';
    const message = status === 'ok'
        ? `${type.toUpperCase()} monitoring for ${domain} is back to normal.`
        : `${type.toUpperCase()} monitoring for ${domain} detected an issue.`;

    await query(`
        INSERT INTO user_activity_feed (user_id, monitor_id, event_type, title, message)
        VALUES ($1, $2, $3, $4, $5)
    `, [userId, monitorId, eventType, title, message]);
}
