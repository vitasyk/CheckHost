const dns = require('dns').promises;

const DQS_KEY = 'e2f5luqkzrgxtnob5ttdjsgrmu';
const HOST = `2.0.0.127.${DQS_KEY}.zen.dq.spamhaus.net`;

async function testResolver(server, name) {
    console.log(`\n--- Testing ${name} (${server}) ---`);
    const resolver = new dns.Resolver();
    resolver.setServers([server]);

    try {
        const start = Date.now();
        const res = await resolver.resolve4(HOST);
        const duration = Date.now() - start;
        console.log(`  Result: ${res.join(', ')} (${duration}ms)`);
    } catch (err) {
        console.log(`  Error: ${err.code} ${err.message}`);
    }
}

async function run() {
    await testResolver('8.8.8.8', 'Google DNS');
    await testResolver('1.1.1.1', 'Cloudflare DNS');
    await testResolver('9.9.9.9', 'Quad9 DNS');
    await testResolver('8.8.4.4', 'Google DNS Secondary');
}

run();
