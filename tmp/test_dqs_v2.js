const dns = require('dns').promises;

const DQS_KEY = 'e2f5luqkzrgxtnob5ttdjsgrmu';

async function testQuery(ip) {
    const reversedIp = ip.split('.').reverse().join('.');
    const variants = [
        `${reversedIp}.${DQS_KEY}.zen.dq.spamhaus.net`,
        `${reversedIp}.zen.dq.spamhaus.net`, // Checking if system default works now? 
    ];

    for (const host of variants) {
        console.log(`Checking: ${host}`);
        try {
            const res = await dns.resolve4(host);
            console.log(`  Result: ${res.join(', ')}`);
        } catch (err) {
            console.log(`  Error: ${err.code}`);
        }
    }
}

async function run() {
    console.log('--- Test IP 127.0.0.2 (Should be LISTED) ---');
    await testQuery('127.0.0.2');

    console.log('\n--- Test IP 1.2.3.4 (Should be CLEAR) ---');
    await testQuery('1.2.3.4');
}

run();
