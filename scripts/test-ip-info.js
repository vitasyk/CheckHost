
async function testIpInfo() {
    const host = 'google.com';
    console.log(`Testing /api/ip-info?host=${host}...`);

    try {
        const res = await fetch(`http://localhost:3000/api/ip-info?host=${host}`);
        const data = await res.json();

        console.log('Response Status:', res.status);
        console.log('Data Host:', data.host);
        console.log('Data IP:', data.ip);

        if (data.host === host) {
            console.log('✅ SUCCESS: Host property matches input.');
        } else {
            console.log('❌ FAILURE: Host property missing or incorrect.');
        }
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testIpInfo();
