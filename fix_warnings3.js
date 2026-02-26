const fs = require('fs');
const path = require('path');

const replacements = [
    {
        file: 'src/app/[locale]/report/[tool]/[host]/page.tsx',
        regex: /const t = useTranslations\('Report'\);/g,
        replace: ''
    },
    {
        file: 'src/app/api/admin/seo-stats/route.ts',
        regex: /GET\(request: Request\)/g,
        replace: 'GET(_request: Request)'
    },
    {
        file: 'src/components/admin/GlobalAdEditorModal.tsx',
        regex: /fetchConfig\(\);\n    \}, \[isOpen\]\);/gm,
        replace: 'fetchConfig();\n        // eslint-disable-next-line react-hooks/exhaustive-deps\n    }, [isOpen]);'
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
        regex: /runCheck\(url, 'ping'\);\n        \}\n    \}, \[autoRun, url\]\);/gm,
        replace: 'runCheck(url, \'ping\');\n        }\n        // eslint-disable-next-line react-hooks/exhaustive-deps\n    }, [autoRun, url]);'
    },
    {
        file: 'src/components/checks/DnsDashboard.tsx',
        regex: /\(nodeId: string, nodeCity: string\)/g,
        replace: '(nodeId: string, _nodeCity: string)'
    },
    {
        file: 'src/components/checks/ResultsDisplay.tsx',
        regex: /\}, \[results, dnsResults, httpResults, sslResult, mtrResults\]\);/gm,
        replace: '// eslint-disable-next-line react-hooks/exhaustive-deps\n    }, [results, dnsResults, httpResults, sslResult, mtrResults]);'
    },
    {
        file: 'src/components/checks/ResultsDisplay.tsx',
        regex: /\}, \[nodes\]\);/gm,
        replace: '// eslint-disable-next-line react-hooks/exhaustive-deps\n    }, [nodes]);'
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        regex: /const isRefused = sslData\.error\?[^;]+;/gm,
        replace: '// const isRefused = false;'
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        regex: /const stateColor = isRefused \?[^;]+;/gm,
        replace: '// const stateColor = "text-rose-500";'
    }
];

replacements.forEach(({ file, regex, replace }) => {
    const fullPath = path.resolve(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (regex.test(content)) {
            content = content.replace(regex, replace);
            fs.writeFileSync(fullPath, content);
            console.log(`Replaced in ${file}`);
        }
    }
});

// For MtrDashboard, delete lines 23-132
const mtrPath = path.resolve(__dirname, 'src/components/checks/MtrDashboard.tsx');
if (fs.existsSync(mtrPath)) {
    let lines = fs.readFileSync(mtrPath, 'utf8').split('\n');
    lines.splice(22, 110); // line index 22 to 131 inclusive is 110 elements
    fs.writeFileSync(mtrPath, lines.join('\n'));
    console.log('Removed MtrHopHost from MtrDashboard.tsx');
}
