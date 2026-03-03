import { NextResponse } from 'next/server';
import { getSiteSetting, saveSiteSetting } from '@/lib/site-settings';
import { processMonitors } from '@/lib/monitor-processor';

/**
 * GET /api/cron/tick?secret=XXX
 *
 * Lightweight orchestrator. Hit every 15 minutes by external cron.
 * Reads blog_cron_config from DB, checks if any jobs are due,
 * and triggers the appropriate sub-routes internally.
 *
 * External cron setup:
 *   Vercel cron.json: { "crons": [{ "path": "/api/cron/tick", "schedule": "every 15 minutes" }] }
 *   crontab: wildcard/15 * * * * curl "https://your-domain.com/api/cron/tick?secret=$SECRET"
 *   GitHub Actions: on: { schedule: [{ cron: "0,15,30,45 * * * *" }] }
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secretParam = searchParams.get('secret');
    const authHeader = request.headers.get('Authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret) {
        if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    } else if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 403 });
    }

    const config: any = await getSiteSetting('blog_cron_config') || {};
    const now = Date.now();
    const origin = new URL(request.url).origin;
    const secret = expectedSecret ? `?secret=${expectedSecret}` : '';

    const actions: string[] = [];

    // ── Generation Job ──────────────────────────
    if (config.generateEnabled) {
        const nextRun = config.generateNextRun ? new Date(config.generateNextRun).getTime() : 0;

        if (now >= nextRun) {
            console.log('[Cron/tick] Triggering generation job...');
            try {
                const res = await fetch(`${origin}/api/cron/generate-blog-post${secret}`);
                const data = await res.json();
                actions.push(`generate:${data.success ? 'ok' : (data.message || data.error || 'failed')}`);
            } catch (e: any) {
                actions.push(`generate:error:${e.message}`);
            }

            // Schedule next run
            const intervalMs = (config.generateIntervalHours || 24) * 60 * 60 * 1000;
            await saveSiteSetting('blog_cron_config', {
                ...config,
                generateLastRun: new Date().toISOString(),
                generateNextRun: new Date(now + intervalMs).toISOString(),
            });
        } else {
            actions.push(`generate:skip:next=${new Date(nextRun).toISOString()}`);
        }
    }

    // Re-read config in case generate updated it
    const freshConfig: any = await getSiteSetting('blog_cron_config') || config;

    // ── Publish Job ──────────────────────────────
    if (freshConfig.publishEnabled) {
        const nextRun = freshConfig.publishNextRun ? new Date(freshConfig.publishNextRun).getTime() : 0;

        if (now >= nextRun) {
            const max = freshConfig.publishMaxPerRun || 1;
            console.log(`[Cron/tick] Triggering publish job (max=${max})...`);
            try {
                const res = await fetch(`${origin}/api/cron/publish-blog-posts${secret}&max=${max}`);
                const data = await res.json();
                actions.push(`publish:${data.published ?? 0}posts`);
            } catch (e: any) {
                actions.push(`publish:error:${e.message}`);
            }

            // Schedule next run
            const intervalMs = (freshConfig.publishIntervalHours || 24) * 60 * 60 * 1000;
            await saveSiteSetting('blog_cron_config', {
                ...freshConfig,
                publishLastRun: new Date().toISOString(),
                publishNextRun: new Date(now + intervalMs).toISOString(),
            });
        } else {
            actions.push(`publish:skip:next=${new Date(nextRun).toISOString()}`);
        }
    }

    // ── Monitor Job ──────────────────────────────
    console.log('[Cron/tick] Triggering monitor job...');
    try {
        const monitorRes = await processMonitors();
        actions.push(`monitors:${monitorRes.processed}checked`);
    } catch (e: any) {
        actions.push(`monitors:error:${e.message}`);
    }

    return NextResponse.json({
        ok: true,
        timestamp: new Date().toISOString(),
        actions,
    });
}
