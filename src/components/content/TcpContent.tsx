import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function TcpContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="tcp" titleTag="h1" />
            <ToolFaqBlock toolId="tcp" locale={locale} />
        </>
    );
}
