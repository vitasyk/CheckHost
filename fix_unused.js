const fs = require('fs');
const path = require('path');

const replacements = [
    {
        file: 'src/app/[locale]/page.tsx',
        search: /Globe2,\s*/g,
        replace: ''
    },
    {
        file: 'src/app/[locale]/report/[tool]/[host]/page.tsx',
        search: /const t = useTranslations\('Report'\);\s*/g,
        replace: ''
    },
    {
        file: 'src/app/[locale]/share/[id]/page.tsx',
        search: /import { Card, CardHeader, CardTitle, CardContent } from '@\/components\/ui\/card';/g,
        replace: "import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';"
    },
    {
        file: 'src/app/[locale]/share/[id]/page.tsx',
        search: /Globe,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/AdSlot.tsx',
        search: /import { Button } from '\.\/ui\/button';\s*/g,
        replace: ''
    },
    {
        file: 'src/components/admin/BlogEditor.tsx',
        search: /import { Badge } from '@\/components\/ui\/badge';\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/CheckForm.tsx',
        search: /useRef,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/CheckForm.tsx',
        search: /Search,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/ChecksClient.tsx',
        search: /MapIcon,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/ChecksClient.tsx',
        search: /X,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/ChecksClient.tsx',
        search: /MapPin,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/ChecksClient.tsx',
        search: /Search\s*} from 'lucide-react';/g,
        replace: "} from 'lucide-react';"
    },
    {
        file: 'src/components/checks/ChecksClient.tsx',
        search: /Search,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/DnsDashboard.tsx',
        search: /import { Button } from '@\/components\/ui\/button';\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/MtrDashboard.tsx',
        search: /Activity,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/MtrDashboard.tsx',
        search: /import { Button } from '@\/components\/ui\/button';\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/MtrDashboard.tsx',
        search: /MtrHopHost,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/NodalMap.tsx',
        search: /Tooltip,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/NodalMap.tsx',
        search: /useMap\s*} from 'react-leaflet';/g,
        replace: "} from 'react-leaflet';"
    },
    {
        file: 'src/components/checks/NodalMap.tsx',
        search: /import { Badge } from '@\/components\/ui\/badge';\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/NodalMap.tsx',
        search: /MapPin,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        search: /ChevronRight,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        search: /Calendar,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        search: /ShieldAlert,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        search: /ExternalLink,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        search: /ChevronDown,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        search: /Unlock,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        search: /FileText,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        search: /Download,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        search: /Share2\s*} from 'lucide-react';/g,
        replace: "} from 'lucide-react';"
    },
    {
        file: 'src/components/checks/SslDashboard.tsx',
        search: /import { Button } from '@\/components\/ui\/button';\s*/g,
        replace: ''
    },
    {
        file: 'src/components/ip-info/IpInfoResult.tsx',
        search: /getCountryCoords,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/ip-info/IpInfoResult.tsx',
        search: /Share2,\s*/g,
        replace: ''
    },
    {
        file: 'src/components/ip-info/IpMap.tsx',
        search: /\/\/ Fix Leaflet default icon issue in Next\.js\nconst icon = L\.icon\([\s\S]*?\);\n\n/g,
        replace: ''
    },
    {
        file: 'src/app/[locale]/auth/signin/page.tsx',
        search: /catch \(_err\) \{/g,
        replace: 'catch {'
    },
    {
        file: 'src/app/api/admin/server-status/route.ts',
        search: /catch \(_e\) \{/g,
        replace: 'catch {'
    },
    {
        file: 'src/app/api/dns-lookup/route.ts',
        search: /catch \(_error\) \{/g,
        replace: 'catch {'
    },
    {
        file: 'src/app/api/share/[id]/route.ts',
        search: /catch \(error\) \{/g,
        replace: 'catch {'
    },
    {
        file: 'src/app/api/ssl-check/route.ts',
        search: /catch \(_e\) \{/g,
        replace: 'catch {'
    },
    {
        file: 'src/app/api/ssl-check/route.ts',
        search: /catch \(__e\) \{/g,
        replace: 'catch {'
    },
    {
        file: 'src/lib/api-logger.ts',
        search: /catch \(_e\) \{/g,
        replace: 'catch {'
    },
    {
        file: 'src/lib/ipinfo-api.ts',
        search: /catch \(_soaErr\) \{/g,
        replace: 'catch {'
    },
    {
        file: 'src/lib/mock-data.ts',
        search: /catch \(_\) \{/g,
        replace: 'catch {'
    },
    {
        file: 'src/lib/site-settings.ts',
        search: /catch \(_e\) \{/g,
        replace: 'catch {'
    }
];

replacements.forEach(({ file, search, replace }) => {
    const fullPath = path.resolve(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(search, replace);
        fs.writeFileSync(fullPath, content);
    }
});

console.log('Fixed unused variables and exceptions');
