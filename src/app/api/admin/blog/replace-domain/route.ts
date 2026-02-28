import { NextResponse } from 'next/server';
import pool, { isPostgresConfigured } from '@/lib/postgres';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const OLD_DOMAIN = 'check-host.top';
const NEW_DOMAIN = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
    : 'checknode.io';

export async function POST() {
    if (!isPostgresConfigured && !isSupabaseConfigured) {
        return NextResponse.json({ error: 'No database configured' }, { status: 500 });
    }

    let updated = 0;

    // PostgreSQL
    if (isPostgresConfigured) {
        try {
            const result = await pool.query(
                `UPDATE posts
                 SET content = REPLACE(content, $1, $2),
                     excerpt = REPLACE(excerpt, $1, $2)
                 WHERE content LIKE $3 OR excerpt LIKE $3`,
                [`https://${OLD_DOMAIN}`, `https://${NEW_DOMAIN}`, `%${OLD_DOMAIN}%`]
            );
            updated += result.rowCount ?? 0;
        } catch (e: any) {
            console.error('[ReplaceDomain] Postgres error:', e.message);
        }
    }

    // Supabase
    if (isSupabaseConfigured) {
        try {
            const { data: posts } = await supabase
                .from('posts')
                .select('id, content, excerpt')
                .or(`content.ilike.%${OLD_DOMAIN}%,excerpt.ilike.%${OLD_DOMAIN}%`);

            if (posts && posts.length > 0) {
                for (const post of posts) {
                    const newContent = (post.content || '').replaceAll(
                        `https://${OLD_DOMAIN}`, `https://${NEW_DOMAIN}`
                    );
                    const newExcerpt = (post.excerpt || '').replaceAll(
                        `https://${OLD_DOMAIN}`, `https://${NEW_DOMAIN}`
                    );
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
        oldDomain: OLD_DOMAIN,
        newDomain: NEW_DOMAIN,
    });
}
