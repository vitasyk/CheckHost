const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

async function fixLocales() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({
        connectionString,
        ssl: connectionString?.includes('supabase.co') ? { rejectUnauthorized: false } : undefined
    });

    try {
        console.log('Connecting to database...');

        // 1. Fix incorrect locales based on slug suffixes
        const locales = ['uk', 'es', 'de', 'fr', 'ru', 'nl', 'pl', 'it'];
        for (const loc of locales) {
            const result = await pool.query(
                `UPDATE posts SET locale = $1 WHERE slug LIKE $2 AND (locale IS NULL OR locale != $1)`,
                [loc, `%-${loc}`]
            );
            console.log(`Updated locale to '${loc}' for ${result.rowCount} posts.`);
        }

        // 2. Link posts into translation groups
        console.log('Linking posts into translation groups...');
        const { rows: allPosts } = await pool.query(`SELECT id, slug, locale, translation_group FROM posts`);

        const groups = new Map();

        for (const post of allPosts) {
            // Root slug: remove terminal -[locale] if present
            const rootSlug = post.slug.replace(/-[a-z]{2}$/, '');
            if (!groups.has(rootSlug)) {
                groups.set(rootSlug, []);
            }
            groups.get(rootSlug).push(post);
        }

        let updatedGroups = 0;
        for (const [rootSlug, posts] of groups.entries()) {
            if (posts.length < 2) continue; // Only link if there's more than one version

            // Use existing translation_group if any post has one, otherwise generate new
            let groupId = posts.find(p => p.translation_group)?.translation_group || crypto.randomUUID();

            for (const post of posts) {
                if (post.translation_group !== groupId) {
                    await pool.query(`UPDATE posts SET translation_group = $1 WHERE id = $2`, [groupId, post.id]);
                }
            }
            updatedGroups++;
        }
        console.log(`Linked ${updatedGroups} translation groups.`);

        // 3. Same for docs_articles
        console.log('Processing docs_articles...');
        for (const loc of locales) {
            await pool.query(
                `UPDATE docs_articles SET locale = $1 WHERE slug LIKE $2 AND (locale IS NULL OR locale != $1)`,
                [loc, `%-${loc}`]
            );
        }

        const { rows: allDocs } = await pool.query(`SELECT id, slug, locale, translation_group FROM docs_articles`);
        const docGroups = new Map();
        for (const doc of allDocs) {
            const rootSlug = doc.slug.replace(/-[a-z]{2}$/, '');
            if (!docGroups.has(rootSlug)) docGroups.set(rootSlug, []);
            docGroups.get(rootSlug).push(doc);
        }

        let updatedDocGroups = 0;
        for (const [rootSlug, docs] of docGroups.entries()) {
            if (docs.length < 2) continue;
            let groupId = docs.find(d => d.translation_group)?.translation_group || crypto.randomUUID();
            for (const doc of docs) {
                if (doc.translation_group !== groupId) {
                    await pool.query(`UPDATE docs_articles SET translation_group = $1 WHERE id = $2`, [groupId, doc.id]);
                }
            }
            updatedDocGroups++;
        }
        console.log(`Linked ${updatedDocGroups} documentation groups.`);

        console.log('Success! Data fix completed.');
    } catch (err) {
        console.error('Error fixing data:', err);
    } finally {
        await pool.end();
    }
}

fixLocales();
