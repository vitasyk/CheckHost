import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function DnsContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="dns" titleTag="h1" />
            <ToolFaqBlock toolId="dns" locale={locale} />
        </>
    );
}
