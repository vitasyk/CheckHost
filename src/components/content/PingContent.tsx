import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function PingContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="ping" titleTag="h1" />
            <ToolFaqBlock toolId="ping" locale={locale} />
        </>
    );
}
