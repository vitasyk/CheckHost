const fs = require('fs');

function mapKeys(obj, path = '') {
    if (typeof obj !== 'object' || obj === null) return;
    for (const key in obj) {
        const fullPath = path ? `${path}.${key}` : key;
        console.log(fullPath);
        mapKeys(obj[key], fullPath);
    }
}

try {
    const json = JSON.parse(fs.readFileSync('messages/uk.json', 'utf8'));
    console.log('--- Key Paths in uk.json ---');
    mapKeys(json);
} catch (e) {
    console.error('Error:', e.message);
}
