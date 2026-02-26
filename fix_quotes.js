const fs = require('fs');
const files = [
    'src/components/content/DnsContentFr.tsx',
    'src/components/content/DnsContentIt.tsx',
    'src/components/content/HttpContentFr.tsx',
    'src/components/content/HttpContentIt.tsx',
    'src/components/content/HttpContentNl.tsx',
    'src/components/content/IpInfoContentFr.tsx',
    'src/components/content/IpInfoContentIt.tsx',
    'src/components/content/PingContentFr.tsx',
    'src/components/content/PingContentIt.tsx'
];

files.forEach(f => {
    if (fs.existsSync(f)) {
        let c = fs.readFileSync(f, 'utf8');
        c = c.replace(/(\w)'(\w)/g, '$1&apos;$2');
        c = c.replace(/ d'/gi, " d&apos;");
        c = c.replace(/ l'/gi, " l&apos;");
        c = c.replace(/ s'/gi, " s&apos;");
        c = c.replace(/ qu'/gi, " qu&apos;");
        c = c.replace(/ n'/gi, " n&apos;");
        c = c.replace(/ m'/gi, " m&apos;");
        c = c.replace(/ c'/gi, " c&apos;");
        c = c.replace(/ un'/gi, " un&apos;");
        c = c.replace(/ all'/gi, " all&apos;");
        c = c.replace(/ nell'/gi, " nell&apos;");
        c = c.replace(/ sull'/gi, " sull&apos;");
        c = c.replace(/ dell'/gi, " dell&apos;");
        c = c.replace(/ dall'/gi, " dall&apos;");
        fs.writeFileSync(f, c);
    }
});
console.log('Fixed quotes in content files');
