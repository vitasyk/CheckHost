import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function PingContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="ping" />
            <ToolFaqBlock toolId="ping" locale={locale} />
        </>
    );
}
