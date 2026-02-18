
const net = require('net');

async function fetchWhoisInfo(domain) {
    // Map TLD to WHOIS server
    const tld = domain.split('.').pop()?.toLowerCase() || '';
    const whoisServers = {
        'com': 'whois.verisign-grs.com',
        'net': 'whois.verisign-grs.com',
        'org': 'whois.pir.org',
        'co': 'whois.nic.co',
        'io': 'whois.nic.io',
    };

    const whoisServer = whoisServers[tld] || `whois.nic.${tld}`;
    console.log(`Querying ${whoisServer} for ${domain}...`);

    return new Promise((resolve) => {
        let data = '';
        const socket = new net.Socket();
        socket.setTimeout(10000);

        socket.connect(43, whoisServer, () => {
            console.log('Connected to WHOIS server.');
            socket.write(domain + '\r\n');
        });

        socket.on('data', (chunk) => {
            console.log('Received chunk:', chunk.length, 'bytes');
            data += chunk.toString();
        });

        socket.on('end', () => {
            console.log('Connection closed.');
            console.log('--- RAW OUTPUT START ---');
            console.log(data);
            console.log('--- RAW OUTPUT END ---');
            resolve(data);
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err);
            resolve(null);
        });

        socket.on('timeout', () => {
            console.error('Socket timeout');
            socket.destroy();
            resolve(null);
        });
    });
}

fetchWhoisInfo('base51.co');
