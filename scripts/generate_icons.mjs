import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.join(process.cwd(), 'public', 'logo.svg');
const iconsDir = path.join(process.cwd(), 'public', 'icons');
const publicDir = path.join(process.cwd(), 'public');

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 144, 192, 512];

async function generate() {
    console.log('Generating icons...');
    // Android Manifest Icons
    for (const size of sizes) {
        await sharp(svgPath)
            .resize(size, size)
            .png()
            .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
        console.log(`Generated icon-${size}x${size}.png`);
    }

    // Apple Touch Icon
    await sharp(svgPath)
        .resize(180, 180)
        .png()
        .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
    console.log(`Generated apple-touch-icon.png`);

    // Logo Png
    await sharp(svgPath)
        .resize(512, 512)
        .png()
        .toFile(path.join(publicDir, 'logo.png'));
    console.log(`Generated logo.png`);

    // Favicon Png
    await sharp(svgPath)
        .resize(32, 32)
        .png()
        .toFile(path.join(publicDir, 'favicon.png'));
    console.log(`Generated favicon.png`);

    console.log('Done!');
}

generate().catch(console.error);
