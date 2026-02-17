
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function testCache() {
    console.log('--- Testing Request Deduplication and Caching ---');

    const startTime = Date.now();

    // 1. Single request
    console.log('Sending first check request...');
    const res1 = await axios.get(`${BASE_URL}/check/ping?host=google.com&max_nodes=3`);
    const id1 = res1.data.request_id;
    console.log(`First request returned ID: ${id1}`);

    // 2. Immediate second request (should be cached)
    console.log('Sending immediate second request...');
    const res2 = await axios.get(`${BASE_URL}/check/ping?host=google.com&max_nodes=3`);
    const id2 = res2.data.request_id;
    console.log(`Second request returned ID: ${id2}`);

    if (id1 === id2) {
        console.log('✅ SUCCESS: Both requests returned the same ID (Cached).');
    } else {
        console.log('❌ FAILURE: Requests returned different IDs.');
    }

    // 3. Testing result caching
    console.log('\n--- Testing Result Caching ---');
    console.log('Polling for results...');

    let resultId = id1;
    let finalResult: any = null;

    // Simple polling
    for (let i = 0; i < 5; i++) {
        const res = await axios.get(`${BASE_URL}/result/${resultId}`);
        const values = Object.values(res.data);
        if (values.length > 0 && values.every(v => v !== null)) {
            finalResult = res.data;
            break;
        }
        await new Promise(r => setTimeout(r, 2000));
    }

    if (finalResult) {
        console.log('Got finalized result. Testing cache delivery...');
        const cacheStart = Date.now();
        const res3 = await axios.get(`${BASE_URL}/result/${resultId}`);
        const cacheDuration = Date.now() - cacheStart;
        console.log(`Cache request took ${cacheDuration}ms`);

        if (cacheDuration < 50) {
            console.log('✅ SUCCESS: Result delivered from cache instantly.');
        } else {
            console.log('⚠️ WARNING: Cache delivery was slower than expected.');
        }
    } else {
        console.log('⚠️ Could not get finalized results in time to test result caching.');
    }
}

testCache().catch(console.error);
