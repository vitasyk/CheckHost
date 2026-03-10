import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function TcpContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="tcp" />
            <ToolFaqBlock toolId="tcp" locale={locale} />
        </>
    );
}
