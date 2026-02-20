const chalk = require('chalk');

const rawResult = [
    [
        1,
        0.310429096221924,
        "Permanent Redirect",
        "308",
        "193.162.131.1"
    ]
];

const checkType = 'http';

function getStatus(result) {
    if (result === null) return 'loading';

    // Check if it's an empty array (often happens during initial ping/http setup)
    if (Array.isArray(result) && result.length === 0) return 'loading';

    // Extract firstResult safely
    const firstResult = Array.isArray(result) && result.length > 0 ? result[0] : result;

    console.log("firstResult is:", JSON.stringify(firstResult));

    if (firstResult === null) return 'loading';

    if (Array.isArray(result) && result.length > 0) {
        // CheckHost API returns strings for some errors
        if (typeof firstResult === 'string') {
            if (firstResult.toUpperCase().includes('ERROR')) return 'error';
            return 'success';
        }

        // HTTP Array Format (HTTP redirects/successes sometimes come back as an array)
        // Format check: [ [successCode, time, message, httpCode, ip] ]
        if (Array.isArray(firstResult)) {
            console.log("Is array format. Length:", firstResult.length);
            if (firstResult.length >= 4 && !isNaN(parseFloat(firstResult[1])) && !isNaN(parseInt(firstResult[3]))) {
                return 'success';
            }

            // Ping results - last check to avoid catching MTR partials
            if (checkType === 'ping') {
                // Check if there are any OK packets
                const flatFirst = Array.isArray(firstResult[0]) ? firstResult : [firstResult];
                const hasOk = flatFirst.some(r => Array.isArray(r) && String(r[0]).toUpperCase() === 'OK');
                if (hasOk) return 'success';
            }
        }
    }

    // HTTP/TCP/UDP results (Object format)
    if (typeof firstResult === 'object' && !Array.isArray(firstResult) && firstResult !== null) {
        // If it has error property
        if ('error' in firstResult && firstResult.error) return 'error';

        // For DNS, if it has any record type it's a success
        if (checkType === 'dns') {
            const dnsKeys = ['A', 'AAAA', 'MX', 'CNAME', 'NS', 'TXT', 'PTR'];
            const hasRecord = dnsKeys.some(key => key in firstResult);
            return hasRecord ? 'success' : 'error';
        }
        return 'success';
    }

    // Handle error cases in result object itself
    if (result && typeof result === 'object' && 'error' in result) return 'error';

    return 'error';
}

console.log("Status:", getStatus(rawResult));

