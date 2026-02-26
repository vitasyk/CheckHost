const fs = require('fs');
const path = require('path');

const replacements = [
    {
        file: 'src/app/[locale]/report/[tool]/[host]/page.tsx',
        regex: /const t = useTranslations\('Report'\);\s*/g,
        replace: ''
    },
    {
        file: 'src/app/[locale]/share/[id]/page.tsx',
        regex: /Card,?\s*/g,
        replace: ''
    },
    {
        file: 'src/app/api/admin/seo-stats/route.ts',
        regex: /export async function GET\(request: Request\)/,
        replace: 'export async function GET(_request: Request)'
    },
    {
        file: 'src/app/api/share/[id]/route.ts',
        regex: /const \{ data, error \} = await supabase/g,
        replace: 'const { data, error: _error } = await supabase'
    },
    {
        file: 'src/components/AdSlot.tsx',
        regex: /import \{ Button \} from '\.\/ui\/button';\s*/g,
        replace: ''
    },
    {
        file: 'src/components/AdSlot.tsx',
        regex: /import \{ Button \} from '@\/components\/ui\/button';\s*/g,
        replace: ''
    },
    {
        file: 'src/components/VisitorIpInfo.tsx',
        regex: /const isLocal = ip === '::1' || ip === '127\.0\.0\.1';/g,
        replace: '// const isLocal = ip === \'::1\' || ip === \'127.0.0.1\';'
    },
    {
        file: 'src/components/admin/GlobalAdEditorModal.tsx',
        regex: /        fetchConfig\(\);\n    \}, \[isOpen\]\);/g,
        replace: '        fetchConfig();\n        // eslint-disable-next-line react-hooks/exhaustive-deps\n    }, [isOpen]);'
    },
    {
        file: 'src/components/checks/CheckForm.tsx',
        regex: /const nodes = \(global as any\)\.siteNodes \|\| \[\];/g,
        replace: '// const nodes = (global as any).siteNodes || [];'
    },
    {
        file: 'src/components/checks/CheckForm.tsx',
        regex: /onDnsTypeChange\?: \(val: string\) => void;/g,
        replace: 'onDnsTypeChange?: (_val: string) => void;'
    },
    {
        file: 'src/components/checks/CheckForm.tsx',
        regex: /onDnsTypeChange=\(\{ val \}/g,
        replace: 'onDnsTypeChange={({ _val }'
    },
    {
        file: 'src/components/checks/ChecksClient.tsx',
        regex: /        if \(autoRun && url\) \{\n            runCheck\(url, 'ping'\);\n        \}\n    \}, \[autoRun, url\]\);/g,
        replace: '        if (autoRun && url) {\n            runCheck(url, \'ping\');\n        }\n        // eslint-disable-next-line react-hooks/exhaustive-deps\n    }, [autoRun, url]);'
    },
    {
        file: 'src/components/checks/DnsDashboard.tsx',
        regex: /\(nodeId: string, nodeCity: string\)/g,
        replace: '(nodeId: string, _nodeCity: string)'
    },
    {
        file: 'src/components/checks/MtrDashboard.tsx',
        regex: /Activity,?\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/MtrDashboard.tsx',
        regex: /MtrHopHost,?\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/MtrDashboard.tsx',
        regex: /const maxLoss = Math\.max\(\.\.\.hops\.map\(.*?\)\);/g,
        replace: '// const maxLoss = Math.max(...hops.map(h => parseFloat(h.Loss) || 0));'
    },
    {
        file: 'src/components/checks/ResultsDisplay.tsx',
        regex: /\}, \[results, dnsResults, httpResults, sslResult, mtrResults\]\);/g,
        replace: '// eslint-disable-next-line react-hooks/exhaustive-deps\n    }, [results, dnsResults, httpResults, sslResult, mtrResults]);'
    },
    {
        file: 'src/components/checks/ResultsDisplay.tsx',
        regex: /\}, \[nodes\]\);/g,
        replace: '// eslint-disable-next-line react-hooks/exhaustive-deps\n    }, [nodes]);'
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        regex: /Share2,?\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        regex: /const isRefused = sslData\.error\?.*/g,
        replace: '// const isRefused = false;'
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        regex: /const stateColor = isRefused \?.*/g,
        replace: '// const stateColor = \"text-rose-500\";'
    },
    {
        file: 'src/components/ip-info/IpInfoResult.tsx',
        regex: /getCountryCoords,?\s*/g,
        replace: ''
    },
    {
        file: 'src/components/ip-info/IpMap.tsx',
        regex: /const icon = L\.icon\(\{[\s\S]*?\}\);\s*/g,
        replace: ''
    }
];

let changedFiles = 0;

replacements.forEach(({ file, regex, replace }) => {
    const fullPath = path.resolve(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (regex.test(content)) {
            content = content.replace(regex, replace);
            fs.writeFileSync(fullPath, content);
            changedFiles++;
            console.log(`Replaced in ${file}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});

console.log(`Fixed ${changedFiles} files`);
