const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const directories = ['public/screenshots', 'public/uploads'];

async function optimizeImages() {
    for (const dir of directories) {
        const fullPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(fullPath)) continue;

        const files = fs.readdirSync(fullPath);
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                const filePath = path.join(fullPath, file);
                const webPath = path.join(fullPath, file.replace(ext, '.webp'));

                console.log(`Optimizing ${filePath}...`);
                try {
                    await sharp(filePath)
                        .webp({ quality: 80 })
                        .toFile(webPath);

                    // console.log(`Created ${webPath}, removing original...`);
                    // Optionally remove original
                    // fs.unlinkSync(filePath);
                } catch (e) {
                    console.error(`Error processing ${filePath}: ${e.message}`);
                }
            }
        }
    }
}

optimizeImages().then(() => console.log('Done'));
