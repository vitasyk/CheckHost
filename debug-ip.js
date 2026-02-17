const fetch = require('node-fetch');

async function testApis() {
    const ip = '1.1.1.1';
    const ipinfoToken = '6ff9d482149980';
    const ipgeoKey = 'e66a3d460fd6479b82cf352ceee6d708';

    console.log('--- Testing IPInfo.io ---');
    try {
        const url1 = `https://ipinfo.io/${ip}/json?token=${ipinfoToken}`;
        const res1 = await fetch(url1);
        const body1 = await res1.text();
        console.log(`Status: ${res1.status} ${res1.statusText}`);
        console.log(`Body: ${body1}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }

    console.log('\n--- Testing IPGeolocation.io ---');
    try {
        const url2 = `https://api.ipgeolocation.io/ipgeo?apiKey=${ipgeoKey}&ip=${ip}`;
        const res2 = await fetch(url2);
        const body2 = await res2.text();
        console.log(`Status: ${res2.status} ${res2.statusText}`);
        console.log(`Body: ${body2}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

testApis();
