const fs = require('fs');
const path = require('path');

const messagesDir = path.join(process.cwd(), 'messages');
const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

// Load English as the reference for Footer keys
const enPath = path.join(messagesDir, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const footerReference = enData.Footer;

files.forEach(file => {
    const filePath = path.join(messagesDir, file);
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (!data.Footer) {
            data.Footer = {};
        }

        // Fill in missing keys from the reference
        let updated = false;
        Object.keys(footerReference).forEach(key => {
            if (!(key in data.Footer)) {
                data.Footer[key] = footerReference[key];
                updated = true;
            }
        });

        if (updated) {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
            console.log(`Synced Footer keys in ${file}`);
        } else {
            console.log(`Footer keys already sync in ${file}`);
        }
    } catch (err) {
        console.error(`Error processing ${file}:`, err);
    }
});
