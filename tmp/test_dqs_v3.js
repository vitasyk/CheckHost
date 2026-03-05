const dns = require('dns').promises;

const DQS_KEY = 'e2f5luqkzrgxtnob5ttdjsgrmu';

async function testQuery(name, title) {
    console.log(`\n--- ${title} ---`);
    console.log(`Checking: ${name}`);
    try {
        const res = await dns.resolve4(name);
        console.log(`  Result: ${res.join(', ')}`);
    } catch (err) {
        console.log(`  Error: ${err.code} ${err.message}`);
    }
}

async function run() {
    // 1. Check if the key itself resolves (Spamhaus usually allows this to check if key is active)
    await testQuery(`${DQS_KEY}.zen.dq.spamhaus.net`, "Key Activation Check");

    // 2. Check standard test IP 127.0.0.2
    await testQuery(`2.0.0.127.${DQS_KEY}.zen.dq.spamhaus.net`, "Standard Test IP (Listed)");

    // 3. Check public IP lookup variant (sometimes required)
    await testQuery(`2.0.0.127.zen.dq.spamhaus.net`, "Standard DQS Dataset (No Key in sub)");
}

run();
