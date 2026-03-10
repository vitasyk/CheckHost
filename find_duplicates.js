const fs = require('fs');

function findDuplicates(text) {
    const lines = text.split('\n');
    const stack = [{}];
    const duplicates = [];

    text.replace(/\"([^\"]+)\"\s*:/g, (match, key, offset) => {
        // This is a very simple regex based check, but let's try something better
    });

    // Actually, let's just use a recursive parser that tracks keys
    const json = JSON.parse(text);

    function walk(obj, path = '') {
        if (typeof obj !== 'object' || obj === null) return;
        const keys = Object.keys(obj);
        // This won't help because JSON.parse already handled duplicates by overwriting
    }
}

// Let's use a regex to find all keys and count them
const text = fs.readFileSync('messages/uk.json', 'utf8');
const keyRegex = /\"([^\"]+)\"\s*:/g;
let match;
const keyCounts = {};
while ((match = keyRegex.exec(text)) !== null) {
    const key = match[1];
    keyCounts[key] = (keyCounts[key] || 0) + 1;
}

console.log('--- Key Counts ---');
for (const key in keyCounts) {
    if (keyCounts[key] > 1) {
        console.log(`Duplicate key: ${key} (${keyCounts[key]} times)`);
    }
}
