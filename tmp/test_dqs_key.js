const dns = require('dns').promises;

const DQS_KEY = 'Wml4cEtidUhUMWxVWGtqRU01d0N2S1lXd3VhMmJLZHpKNktWMXI4TWlnOC5lOWM5YmYwOS0zOGViLTQ3OWItOGRkNy01NWE4Nzg1NjkzMDM';
const IP = '1.2.3.4';
const REVERSED_IP = IP.split('.').reverse().join('.');

async function testDqs() {
    const queryHost = `${REVERSED_IP}.${DQS_KEY}.zen.dq.spamhaus.net`;
    console.log(`Testing query host: ${queryHost}`);
    console.log(`Query host length: ${queryHost.length}`);

    try {
        const addresses = await dns.resolve4(queryHost);
        console.log('Results:', addresses);
    } catch (err) {
        console.error('Error:', err.code, err.message);
    }
}

testDqs();
