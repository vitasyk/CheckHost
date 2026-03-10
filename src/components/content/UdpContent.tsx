import { useLocale } from 'next-intl';
import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

export function UdpContent() {
    const locale = useLocale();
    return (
        <>
            <ToolSeoBlock toolId="udp" />
            <ToolFaqBlock toolId="udp" locale={locale} />
        </>
    );
}
