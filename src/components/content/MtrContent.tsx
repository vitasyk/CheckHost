import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function MtrContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="mtr" titleTag="h1" />
            <ToolFaqBlock toolId="mtr" locale={locale} />
        </>
    );
}
