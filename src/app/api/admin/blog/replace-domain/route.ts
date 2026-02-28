import { NextResponse } from 'next/server';
import pool, { isPostgresConfigured } from '@/lib/postgres';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

function replaceAllDomains(text: string, oldDomain: string, newDomain: string): string {
    let result = text;
    result = result.replaceAll(`https://${oldDomain}`, `https://${newDomain}`);
    result = result.replaceAll(`http://${oldDomain}`, `https://${newDomain}`);
    // Also plain domain mentions without protocol
    result = result.replaceAll(`www.${oldDomain}`, newDomain);
    result = result.replaceAll(oldDomain, newDomain); // Catch all remaining instances
    return result;
}

function hasOldDomain(text: string, oldDomain: string): boolean {
    return text?.includes(oldDomain);
}

export async function POST(req: Request) {
    if (!isPostgresConfigured && !isSupabaseConfigured) {
        return NextResponse.json({ error: 'No database configured' }, { status: 500 });
    }

    let oldDomain: string;
    let newDomain: string;

    try {
        const body = await req.json();
        oldDomain = body.oldDomain?.trim().toLowerCase();
        newDomain = body.newDomain?.trim().toLowerCase();

        if (!oldDomain || !newDomain) {
            return NextResponse.json({ error: 'oldDomain and newDomain are required' }, { status: 400 });
        }

        // Remove trailing slashes and common prefixes if users pasted
        // e.g. https://domain.com -> domain.com
        oldDomain = oldDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        newDomain = newDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    } catch (e) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    let updated = 0;

    // PostgreSQL — chain REPLACE for the targeted domains
    if (isPostgresConfigured) {
        try {
            // Build chained SQL REPLACE expressions
            let contentExpr = 'content';
            let excerptExpr = 'excerpt';
            const params: string[] = [];
            let paramIdx = 1;

            contentExpr = `REPLACE(${contentExpr}, $${paramIdx}, $${paramIdx + 1})`;
            excerptExpr = `REPLACE(${excerptExpr}, $${paramIdx}, $${paramIdx + 1})`;
            params.push(`https://${oldDomain}`, `https://${newDomain}`);
            paramIdx += 2;

            contentExpr = `REPLACE(${contentExpr}, $${paramIdx}, $${paramIdx + 1})`;
            excerptExpr = `REPLACE(${excerptExpr}, $${paramIdx}, $${paramIdx + 1})`;
            params.push(`http://${oldDomain}`, `https://${newDomain}`);
            paramIdx += 2;

            contentExpr = `REPLACE(${contentExpr}, $${paramIdx}, $${paramIdx + 1})`;
            excerptExpr = `REPLACE(${excerptExpr}, $${paramIdx}, $${paramIdx + 1})`;
            params.push(`www.${oldDomain}`, newDomain);
            paramIdx += 2;

            contentExpr = `REPLACE(${contentExpr}, $${paramIdx}, $${paramIdx + 1})`;
            excerptExpr = `REPLACE(${excerptExpr}, $${paramIdx}, $${paramIdx + 1})`;
            params.push(oldDomain, newDomain);
            paramIdx += 2;

            const whereCondition = `content LIKE $${paramIdx} OR excerpt LIKE $${paramIdx}`;
            params.push(`%${oldDomain}%`);

            const sql = `UPDATE posts
                         SET content = ${contentExpr},
                             excerpt = ${excerptExpr}
                         WHERE ${whereCondition}`;

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
            const { data: posts } = await supabase
                .from('posts')
                .select('id, content, excerpt')
                .or(`content.ilike.%${oldDomain}%,excerpt.ilike.%${oldDomain}%`);

            if (posts && posts.length > 0) {
                for (const post of posts) {
                    if (!hasOldDomain(post.content || '', oldDomain) && !hasOldDomain(post.excerpt || '', oldDomain)) continue;
                    const newContent = replaceAllDomains(post.content || '', oldDomain, newDomain);
                    const newExcerpt = replaceAllDomains(post.excerpt || '', oldDomain, newDomain);
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
        replacedDomains: [oldDomain],
        newDomain: newDomain,
    });
}
