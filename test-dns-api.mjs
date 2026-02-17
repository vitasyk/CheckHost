import fetch from 'node-fetch';

async function check(host, type, dnsType) {
    const url = `https://check-host.net/check/${type}?host=${host}&max_nodes=1` + (dnsType ? `&type=${dnsType}` : '');
    console.log(`Requesting: ${url}`);
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await res.json();
    console.log(`Init response:`, data);

    if (!data.request_id) return;

    const requestId = data.request_id;
    console.log(`Polling result for ${requestId}...`);

    // Poll for a bit
    for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const res2 = await fetch(`https://check-host.net/check/result/${requestId}`, { headers: { Accept: 'application/json' } });
        const data2 = await res2.json();
        // Check if we have any data
        const values = Object.values(data2);
        if (values.length > 0 && values[0] && values[0].length > 0 && values[0][0]) {
            console.log(`Result sample for ${dnsType || 'DEFAULT'}:`, JSON.stringify(values[0][0], null, 2));
            break;
        }
    }
}

async function run() {
    // Check default
    await check('google.com', 'dns', null);
    // Check TXT
    await check('google.com', 'dns', 'txt');
}

run();
