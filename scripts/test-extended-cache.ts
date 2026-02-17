
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function testExtendedCache() {
    console.log('--- Testing Extended Caching Coverage ---');

    // 1. Test admin/settings with cache-busting 't'
    console.log('\nTesting /api/admin/settings with t parameter...');
    const t1 = Date.now();
    const s1Start = Date.now();
    const s1 = await axios.get(`${BASE_URL}/admin/settings?key=ip_info_display&t=${t1}`);
    console.log(`First settings request took ${Date.now() - s1Start}ms`);

    const t2 = Date.now() + 1;
    const s2Start = Date.now();
    const s2 = await axios.get(`${BASE_URL}/admin/settings?key=ip_info_display&t=${t2}`);
    const s2Duration = Date.now() - s2Start;
    console.log(`Second settings request (different t) took ${s2Duration}ms`);

    if (s2Duration < 30) {
        console.log('✅ SUCCESS: admin/settings cached regardless of t parameter.');
    } else {
        console.log('❌ FAILURE: admin/settings cache-busting still effective.');
    }

    // 2. Test ip-info caching
    console.log('\nTesting /api/ip-info caching...');
    const i1Start = Date.now();
    await axios.get(`${BASE_URL}/ip-info?host=google.com`);
    console.log(`First ip-info request took ${Date.now() - i1Start}ms`);

    const i2Start = Date.now();
    await axios.get(`${BASE_URL}/ip-info?host=google.com`);
    const i2Duration = Date.now() - i2Start;
    console.log(`Second ip-info request took ${i2Duration}ms`);

    if (i2Duration < 30) {
        console.log('✅ SUCCESS: ip-info served from cache.');
    } else {
        console.log('❌ FAILURE: ip-info not cached.');
    }

    // 3. Test dns-lookup deduplication (concurrent requests)
    console.log('\nTesting /api/dns-lookup deduplication (concurrent)...');
    console.log('Sending two concurrent DNS lookups for upstash.com...');

    const dStart = Date.now();
    const [d1, d2] = await Promise.all([
        axios.get(`${BASE_URL}/dns-lookup?domain=upstash.com`),
        axios.get(`${BASE_URL}/dns-lookup?domain=upstash.com`)
    ]);
    const dDuration = Date.now() - dStart;
    console.log(`Concurrent DNS lookups finished in ${dDuration}ms`);

    if (d1.data.timestamp === d2.data.timestamp) {
        console.log('✅ SUCCESS: Concurrent requests returned identical deduplicated data.');
    } else {
        console.log('❌ FAILURE: Concurrent requests executed independently.');
    }
}

testExtendedCache().catch(console.error);
