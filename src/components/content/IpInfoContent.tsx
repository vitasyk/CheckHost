import { useLocale } from 'next-intl';
import { IpInfoContentEn } from './IpInfoContentEn';
import { IpInfoContentUk } from './IpInfoContentUk';
import { IpInfoContentDe } from './IpInfoContentDe';
import { IpInfoContentEs } from './IpInfoContentEs';
import { IpInfoContentFr } from './IpInfoContentFr';
import { IpInfoContentRu } from './IpInfoContentRu';
import { IpInfoContentNl } from './IpInfoContentNl';
import { IpInfoContentPl } from './IpInfoContentPl';
import { IpInfoContentIt } from './IpInfoContentIt';

export function IpInfoContent() {
    const locale = useLocale();

    switch (locale) {
        case 'uk': return <IpInfoContentUk />;
        case 'de': return <IpInfoContentDe />;
        case 'es': return <IpInfoContentEs />;
        case 'fr': return <IpInfoContentFr />;
        case 'ru': return <IpInfoContentRu />;
        case 'nl': return <IpInfoContentNl />;
        case 'pl': return <IpInfoContentPl />;
        case 'it': return <IpInfoContentIt />;
        default: return <IpInfoContentEn />;
    }
}
