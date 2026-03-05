import { query } from './postgres';
import net from 'net';
import tls from 'tls';
import { promises as dnsPromises } from 'dns';
import { sendMonitorAlert, sendMonitorRecovery } from './email';

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

            // Check if status changed to generate feed item + send email
            const statusChanged = m.status !== result.status && m.status !== 'pending';
            if (statusChanged) {
                await createFeedItem(m.user_id, m.id, result.status, m.domain, m.type);

                // Send email notification if configured
                if (m.notify_email) {
                    if (result.status === 'error') {
                        await sendMonitorAlert(
                            m.notify_email,
                            m.domain,
                            m.type,
                            result.meta
                        );
                    } else if (result.status === 'ok') {
                        await sendMonitorRecovery(m.notify_email, m.domain, m.type, result.meta);
                    }
                }
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

async function checkSsl(domain: string): Promise<{ status: 'ok' | 'error', meta: any }> {
    return new Promise((resolve) => {
        const socket = tls.connect(
            { host: domain, port: 443, servername: domain, rejectUnauthorized: false },
            () => {
                const cert = socket.getPeerCertificate();
                socket.destroy();

                if (!cert || !cert.valid_to) {
                    return resolve({ status: 'error', meta: { last_error: 'Could not retrieve SSL certificate' } });
                }

                const expiryDate = new Date(cert.valid_to);
                const daysLeft = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const issuer = cert.issuer?.O || cert.issuer?.CN || 'Unknown';
                const subject = cert.subject?.CN || domain;

                if (daysLeft < 0) {
                    return resolve({
                        status: 'error',
                        meta: {
                            last_error: `Certificate expired ${Math.abs(daysLeft)} days ago`,
                            ssl_expiry: expiryDate.toISOString(),
                            ssl_days_left: daysLeft,
                            ssl_issuer: issuer,
                            ssl_subject: subject,
                        }
                    });
                }

                // Warn if expiring soon (less than 14 days)
                if (daysLeft < 14) {
                    return resolve({
                        status: 'error',
                        meta: {
                            last_error: `Certificate expires in ${daysLeft} days`,
                            ssl_expiry: expiryDate.toISOString(),
                            ssl_days_left: daysLeft,
                            ssl_issuer: issuer,
                            ssl_subject: subject,
                        }
                    });
                }

                return resolve({
                    status: 'ok',
                    meta: {
                        ssl_expiry: expiryDate.toISOString(),
                        ssl_days_left: daysLeft,
                        ssl_issuer: issuer,
                        ssl_subject: subject,
                    }
                });
            }
        );

        socket.setTimeout(8000);
        socket.on('timeout', () => {
            socket.destroy();
            resolve({ status: 'error', meta: { last_error: 'SSL connection timeout' } });
        });
        socket.on('error', (err) => {
            socket.destroy();
            resolve({ status: 'error', meta: { last_error: err.message } });
        });
    });
}

async function checkDns(domain: string) {
    try {
        const [ipv4, mx] = await Promise.allSettled([
            dnsPromises.resolve4(domain),
            dnsPromises.resolveMx(domain),
        ]);

        const ips = ipv4.status === 'fulfilled' ? ipv4.value : [];
        const mxRecords = mx.status === 'fulfilled'
            ? mx.value.sort((a, b) => a.priority - b.priority).slice(0, 3).map(r => r.exchange)
            : [];

        if (ips.length === 0 && mxRecords.length === 0) {
            return { status: 'error' as const, meta: { last_error: 'DNS resolution failed — no A or MX records found' } };
        }

        return {
            status: 'ok' as const,
            meta: {
                dns_ips: ips,
                dns_mx: mxRecords,
            }
        };
    } catch (e: any) {
        return { status: 'error' as const, meta: { last_error: `DNS resolution failed: ${e.message}` } };
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
