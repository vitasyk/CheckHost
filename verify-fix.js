async function fetchWithRetry(url, options = {}, retries = 2, timeout = 8000) {
    let lastError;
    for (let i = 0; i <= retries; i++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (err) {
            lastError = err;
            if (i < retries) {
                const delay = Math.pow(2, i) * 1000;
                console.log(`[Diagnostic] Retry ${i + 1}/${retries} for ${url} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

async function testLookup() {
    const ip = '8.8.8.8';
    const url = `https://api.ipiz.net/${ip}`;
    console.log(`Testing fetch with retry for ${url}...`);

    try {
        const response = await fetchWithRetry(url, {}, 2, 8000);
        if (!response.ok) {
            console.log(`Response NOT OK: ${response.status} ${response.statusText}`);
        } else {
            const data = await response.json();
            console.log('Success! Data:', JSON.stringify(data).substring(0, 100) + '...');
        }
    } catch (error) {
        console.error('Final failure:', error);
    }
}

testLookup();
