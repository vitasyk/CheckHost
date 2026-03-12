import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function IpInfoContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="ip-info" titleTag="h2" />
            <ToolFaqBlock toolId="ip-info" locale={locale} />
        </>
    );
}
