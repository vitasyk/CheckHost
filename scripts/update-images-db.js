const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'checknode',
    password: 'your_password', // change to actual password if needed or use env
    port: 5432,
});

async function run() {
    try {
        const res1 = await pool.query("UPDATE posts SET cover_image = REPLACE(cover_image, '.png', '.webp') WHERE cover_image LIKE '%.png'");
        console.log(`Updated posts: ${res1.rowCount}`);

        const res2 = await pool.query("UPDATE docs_articles SET cover_image = REPLACE(cover_image, '.png', '.webp') WHERE cover_image LIKE '%.png'");
        console.log(`Updated docs: ${res2.rowCount}`);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
