import { useLocale } from 'next-intl';
import { DnsContentEn } from './DnsContentEn';
import { DnsContentUk } from './DnsContentUk';
import { DnsContentDe } from './DnsContentDe';
import { DnsContentEs } from './DnsContentEs';
import { DnsContentFr } from './DnsContentFr';
import { DnsContentRu } from './DnsContentRu';
import { DnsContentNl } from './DnsContentNl';
import { DnsContentPl } from './DnsContentPl';
import { DnsContentIt } from './DnsContentIt';

export function DnsContent() {
    const locale = useLocale();

    switch (locale) {
        case 'uk': return <DnsContentUk />;
        case 'de': return <DnsContentDe />;
        case 'es': return <DnsContentEs />;
        case 'fr': return <DnsContentFr />;
        case 'ru': return <DnsContentRu />;
        case 'nl': return <DnsContentNl />;
        case 'pl': return <DnsContentPl />;
        case 'it': return <DnsContentIt />;
        default: return <DnsContentEn />;
    }
}
