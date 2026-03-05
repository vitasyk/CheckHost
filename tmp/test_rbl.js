const dns = require('dns').promises;

const RBL_SERVERS = [
    'sbl.spamhaus.org',
    'xbl.spamhaus.org',
    'zen.spamhaus.org',
    'bl.spamcop.net'
];

async function checkRbl(ip, dnsServers) {
    if (dnsServers) {
        require('dns').setServers(dnsServers);
    }
    const reversedIp = ip.split('.').reverse().join('.');
    const results = {};

    for (const rbl of RBL_SERVERS) {
        try {
            console.log(`Checking ${ip} against ${rbl} using DNS: ${dnsServers || 'system default'}...`);
            const addresses = await dns.resolve4(`${reversedIp}.${rbl}`);
            if (addresses.some(addr => addr.startsWith('127.255.'))) {
                results[rbl] = 'ERROR (BLOCKED)';
            } else {
                results[rbl] = 'LISTED: ' + addresses.join(', ');
            }
        } catch (err) {
            if (err.code === 'ENOTFOUND') {
                results[rbl] = 'CLEAR';
            } else {
                results[rbl] = `ERROR: ${err.code} ${err.message}`;
            }
        }
    }
    return results;
}

async function run() {
    const testIp = '1.2.3.4'; // Just a dummy IP
    
    console.log('--- Test with default system DNS ---');
    console.log(await checkRbl(testIp, null));
    
    console.log('\n--- Test with Google DNS (8.8.8.8) ---');
    console.log(await checkRbl(testIp, ['8.8.8.8']));

    console.log('\n--- Test with Cloudflare DNS (1.1.1.1) ---');
    console.log(await checkRbl(testIp, ['1.1.1.1']));
}

run().catch(console.error);
