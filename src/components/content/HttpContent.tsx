import { ToolSeoBlock } from './ToolSeoBlock';
import { ToolFaqBlock } from './ToolFaqBlock';

interface HttpContentProps {
    locale: string;
}

export function HttpContent({ locale }: HttpContentProps) {
    return (
        <>
            <ToolSeoBlock toolId="http" titleTag="h1" />
            <ToolFaqBlock toolId="http" locale={locale} />
        </>
    );
}
