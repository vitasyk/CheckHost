import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function SslContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="ssl" titleTag="h2" />
            <ToolFaqBlock toolId="ssl" locale={locale} />
        </>
    );
}
