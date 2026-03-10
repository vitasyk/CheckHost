import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function SmtpContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="smtp" />
            <ToolFaqBlock toolId="smtp" locale={locale} />
        </>
    );
}
