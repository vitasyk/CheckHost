const fs = require('fs');
const path = require('path');

async function diag() {
    console.log('--- I18n Diagnostic ---');
    const ukPath = path.resolve('messages/uk.json');
    console.log('Checking uk.json at:', ukPath);

    if (!fs.existsSync(ukPath)) {
        console.error('File does NOT exist!');
        return;
    }

    const content = fs.readFileSync(ukPath, 'utf8');
    console.log('File size:', content.length, 'bytes');

    let json;
    try {
        json = JSON.parse(content);
        console.log('JSON parsed successfully.');
    } catch (e) {
        console.error('JSON parse error:', e.message);
        return;
    }

    const metadata = json.Metadata;
    if (!metadata) {
        console.error('Metadata namespace is MISSING in JSON!');
        return;
    }

    const keys = ['mtrTitle', 'mtrDesc', 'tcpTitle', 'tcpDesc', 'sslTitle'];
    console.log('\nChecking keys in Metadata:');
    keys.forEach(key => {
        const val = metadata[key];
        if (val) {
            console.log(`[OK] ${key}: "${val.substring(0, 30)}..."`);
        } else {
            console.error(`[MISSING] ${key}`);
        }
    });

    console.log('\nAll keys in Metadata:', Object.keys(metadata).join(', '));
}

diag();
