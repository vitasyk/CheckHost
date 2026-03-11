import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function HttpContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="http" titleTag="h2" />
            <ToolFaqBlock toolId="http" locale={locale} />
        </>
    );
}
