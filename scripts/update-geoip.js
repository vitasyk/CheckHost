const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '../data');
const DB_URLS = {
    'GeoLite2-City.mmdb': 'https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb',
    'GeoLite2-Country.mmdb': 'https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-Country.mmdb',
    'GeoLite2-ASN.mmdb': 'https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-ASN.mmdb'
};

/**
 * Download a file from a URL
 */
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { headers: { 'User-Agent': 'Node.js' }, followRedirect: true }, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirects manually if needed, but https.get with followRedirect: true might not work in all Node versions
                // Actually Node's https.get doesn't have followRedirect. Let's implement a simple version.
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode} ${response.statusText}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function updateDatabases() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }

    console.log('Updating GeoLite2 databases...');

    for (const [filename, url] of Object.entries(DB_URLS)) {
        const dest = path.join(DATA_DIR, filename);
        console.log(`Downloading ${filename}...`);
        try {
            await downloadFile(url, dest);
            console.log(`Successfully downloaded ${filename}`);
        } catch (err) {
            console.error(`Error downloading ${filename}:`, err.message);
        }
    }

    console.log('Update complete!');
}

updateDatabases().catch(console.error);
