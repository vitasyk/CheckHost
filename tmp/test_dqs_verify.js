const dns = require('dns').promises;

const DQS_KEY = 'e2f5luqkzrgxtnob5ttdjsgrmu';
const IP = '127.0.0.2'; // Standard test IP for "listed"
const REVERSED_IP = IP.split('.').reverse().join('.');

async function testDqs() {
    const queryHost = `${REVERSED_IP}.${DQS_KEY}.zen.dq.spamhaus.net`;
    console.log(`Testing query host: ${queryHost}`);

    try {
        const addresses = await dns.resolve4(queryHost);
        console.log('Results:', addresses);
        if (addresses.length > 0) {
            console.log('SUCCESS: DQS query resolved correctly.');
        }
    } catch (err) {
        console.error('Error:', err.code, err.message);
    }
}

testDqs();
