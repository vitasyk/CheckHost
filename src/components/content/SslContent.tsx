import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function SslContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="ssl" />
            <ToolFaqBlock toolId="ssl" locale={locale} />
        </>
    );
}
