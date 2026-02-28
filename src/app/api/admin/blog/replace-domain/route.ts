import { NextResponse } from 'next/server';
import pool, { isPostgresConfigured } from '@/lib/postgres';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const NEW_DOMAIN = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
    : 'checknode.io';

// All old domains that should be replaced
const OLD_DOMAINS = [
    'check-host.top',
    'checkhost.net',
];

function replaceAllDomains(text: string): string {
    let result = text;
    for (const old of OLD_DOMAINS) {
        result = result.replaceAll(`https://${old}`, `https://${NEW_DOMAIN}`);
        result = result.replaceAll(`http://${old}`, `https://${NEW_DOMAIN}`);
        // Also plain domain mentions without protocol
        result = result.replaceAll(`www.${old}`, NEW_DOMAIN);
    }
    return result;
}

function hasOldDomain(text: string): boolean {
    return OLD_DOMAINS.some(d => text?.includes(d));
}

export async function POST() {
    if (!isPostgresConfigured && !isSupabaseConfigured) {
        return NextResponse.json({ error: 'No database configured' }, { status: 500 });
    }

    let updated = 0;

    // PostgreSQL — chain REPLACE for each old domain
    if (isPostgresConfigured) {
        try {
            // Build chained SQL REPLACE expressions
            let contentExpr = 'content';
            let excerptExpr = 'excerpt';
            const params: string[] = [];
            let paramIdx = 1;

            for (const old of OLD_DOMAINS) {
                contentExpr = `REPLACE(${contentExpr}, $${paramIdx}, $${paramIdx + 1})`;
                excerptExpr = `REPLACE(${excerptExpr}, $${paramIdx}, $${paramIdx + 1})`;
                params.push(`https://${old}`, `https://${NEW_DOMAIN}`);
                paramIdx += 2;

                // Also handle http://
                contentExpr = `REPLACE(${contentExpr}, $${paramIdx}, $${paramIdx + 1})`;
                excerptExpr = `REPLACE(${excerptExpr}, $${paramIdx}, $${paramIdx + 1})`;
                params.push(`http://${old}`, `https://${NEW_DOMAIN}`);
                paramIdx += 2;
            }

            const whereConditions = OLD_DOMAINS.map(d => `content LIKE $${paramIdx++}`);
            OLD_DOMAINS.forEach(d => params.push(`%${d}%`));

            const sql = `UPDATE posts
                         SET content = ${contentExpr},
                             excerpt = ${excerptExpr}
                         WHERE ${whereConditions.join(' OR ')}`;

            const result = await pool.query(sql, params);
            updated += result.rowCount ?? 0;
        } catch (e: any) {
            console.error('[ReplaceDomain] Postgres error:', e.message);
        }
    }

    // Supabase — fetch and replace in JS (more flexible)
    if (isSupabaseConfigured) {
        try {
            // Fetch posts that might contain old domains
            const orConditions = OLD_DOMAINS.map(d => `content.ilike.%${d}%`).join(',');
            const { data: posts } = await supabase
                .from('posts')
                .select('id, content, excerpt')
                .or(orConditions);

            if (posts && posts.length > 0) {
                for (const post of posts) {
                    if (!hasOldDomain(post.content || '') && !hasOldDomain(post.excerpt || '')) continue;
                    const newContent = replaceAllDomains(post.content || '');
                    const newExcerpt = replaceAllDomains(post.excerpt || '');
                    await supabase
                        .from('posts')
                        .update({ content: newContent, excerpt: newExcerpt })
                        .eq('id', post.id);
                    updated++;
                }
            }
        } catch (e: any) {
            console.error('[ReplaceDomain] Supabase error:', e.message);
        }
    }

    return NextResponse.json({
        success: true,
        updatedPosts: updated,
        replacedDomains: OLD_DOMAINS,
        newDomain: NEW_DOMAIN,
    });
}
