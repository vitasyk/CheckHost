import { useLocale } from 'next-intl';
import { PingContentEn } from './PingContentEn';
import { PingContentUk } from './PingContentUk';
import { PingContentDe } from './PingContentDe';
import { PingContentEs } from './PingContentEs';
import { PingContentFr } from './PingContentFr';
import { PingContentRu } from './PingContentRu';
import { PingContentNl } from './PingContentNl';
import { PingContentPl } from './PingContentPl';
import { PingContentIt } from './PingContentIt';

export function PingContent() {
    const locale = useLocale();

    switch (locale) {
        case 'uk': return <PingContentUk />;
        case 'de': return <PingContentDe />;
        case 'es': return <PingContentEs />;
        case 'fr': return <PingContentFr />;
        case 'ru': return <PingContentRu />;
        case 'nl': return <PingContentNl />;
        case 'pl': return <PingContentPl />;
        case 'it': return <PingContentIt />;
        default: return <PingContentEn />;
    }
}
