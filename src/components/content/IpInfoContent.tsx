import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function IpInfoContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="ipInfo" titleTag="h2" />
            <ToolFaqBlock toolId="ipInfo" locale={locale} />
        </>
    );
}
