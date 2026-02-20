const https = require('https');
const http = require('http');

async function testApi() {
    const baseUrl = 'http://localhost:3000';
    const TEST_ID = 'test-id-' + Math.random().toString(36).substring(7);

    console.log('--- Testing Share API (POST) ---');
    const postData = JSON.stringify({
        id: TEST_ID,
        type: 'ping',
        host: 'google.com',
        results: { 'us-west': [['OK', 0.05, '8.8.8.8']] },
        checkNodes: {}
    });

    const postOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/share',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    const runRequest = (options, body) => new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });

    try {
        const postResult = await runRequest(postOptions, postData);
        console.log('POST Status:', postResult.status);
        console.log('POST Data:', postResult.data);

        if (postResult.status !== 200) {
            console.error('Failed to create snapshot');
            return;
        }

        const id = postResult.data.id;
        console.log('\n--- Testing Share API (GET) for ID:', id, '---');

        const getOptions = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/share/${id}`,
            method: 'GET'
        };

        const getResult = await runRequest(getOptions);
        console.log('GET Status:', getResult.status);
        console.log('GET Data:', getResult.data);

        if (getResult.status === 200 && getResult.data.id === id) {
            console.log('\n✅ SUCCESS: API correctly returns snapshot data.');
        } else {
            console.error('\n❌ FAILURE: API returned error or incorrect data:', getResult.data);
        }

    } catch (e) {
        console.error('Test failed with error:', e.message);
    }
}

testApi();
