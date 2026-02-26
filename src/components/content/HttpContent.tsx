import { useLocale } from 'next-intl';
import { HttpContentEn } from './HttpContentEn';
import { HttpContentUk } from './HttpContentUk';
import { HttpContentDe } from './HttpContentDe';
import { HttpContentEs } from './HttpContentEs';
import { HttpContentFr } from './HttpContentFr';
import { HttpContentRu } from './HttpContentRu';
import { HttpContentNl } from './HttpContentNl';
import { HttpContentPl } from './HttpContentPl';
import { HttpContentIt } from './HttpContentIt';

export function HttpContent() {
    const locale = useLocale();

    switch (locale) {
        case 'uk': return <HttpContentUk />;
        case 'de': return <HttpContentDe />;
        case 'es': return <HttpContentEs />;
        case 'fr': return <HttpContentFr />;
        case 'ru': return <HttpContentRu />;
        case 'nl': return <HttpContentNl />;
        case 'pl': return <HttpContentPl />;
        case 'it': return <HttpContentIt />;
        default: return <HttpContentEn />;
    }
}
