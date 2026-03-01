import { NextResponse } from 'next/server';
import pool, { isPostgresConfigured } from '@/lib/postgres';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    if (!isPostgresConfigured && !isSupabaseConfigured) {
        return NextResponse.json({ error: 'No database configured' }, { status: 500 });
    }

    let findText: string;
    let replaceWith: string;
    let dryRun: boolean;

    try {
        const body = await req.json();
        findText = body.findText;
        replaceWith = body.replaceWith ?? '';
        dryRun = body.dryRun === true;

        if (!findText) {
            return NextResponse.json({ error: 'findText is required' }, { status: 400 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    let affectedCount = 0;

    // PostgreSQL
    if (isPostgresConfigured) {
        try {
            if (dryRun) {
                const result = await pool.query(
                    `SELECT COUNT(*) FROM posts WHERE content LIKE $1 OR excerpt LIKE $1`,
                    [`%${findText}%`]
                );
                affectedCount += parseInt(result.rows[0].count);
            } else {
                const result = await pool.query(
                    `UPDATE posts
                     SET content = REPLACE(content, $1, $2),
                         excerpt = REPLACE(excerpt, $1, $2)
                     WHERE content LIKE $3 OR excerpt LIKE $3`,
                    [findText, replaceWith, `%${findText}%`]
                );
                affectedCount += result.rowCount ?? 0;
            }
        } catch (e: any) {
            console.error('[ReplaceText] Postgres error:', e.message);
        }
    }

    // Supabase
    if (isSupabaseConfigured) {
        try {
            const { data: posts, error: fetchError } = await supabase
                .from('posts')
                .select('id, content, excerpt')
                .or(`content.ilike.%${findText}%,excerpt.ilike.%${findText}%`);

            if (fetchError) throw fetchError;

            if (posts && posts.length > 0) {
                if (dryRun) {
                    affectedCount += posts.length;
                } else {
                    for (const post of posts) {
                        const newContent = post.content?.replaceAll(findText, replaceWith);
                        const newExcerpt = post.excerpt?.replaceAll(findText, replaceWith);

                        const { error: updateError } = await supabase
                            .from('posts')
                            .update({ content: newContent, excerpt: newExcerpt })
                            .eq('id', post.id);

                        if (!updateError) affectedCount++;
                    }
                }
            }
        } catch (e: any) {
            console.error('[ReplaceText] Supabase error:', e.message);
        }
    }

    return NextResponse.json({
        success: true,
        affectedCount,
        dryRun,
        findText,
        replaceWith
    });
}
