import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function SslContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="ssl" titleTag="h1" />
            <ToolFaqBlock toolId="ssl" locale={locale} />
        </>
    );
}
