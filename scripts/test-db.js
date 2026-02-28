require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

client.connect().then(() => {
    return client.query('SELECT * FROM user_monitors');
}).then(res => {
    console.table(res.rows);
    client.end();
}).catch(err => {
    console.error(err);
    client.end();
});
