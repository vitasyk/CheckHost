import { getTranslations } from 'next-intl/server';
import { query } from '@/lib/postgres';
import { FaqAccordion } from '@/components/common/FaqAccordion';

interface ToolFaqBlockProps {
    toolId: string;
    locale: string;
}

export async function ToolFaqBlock({ toolId, locale }: ToolFaqBlockProps) {
    const t = await getTranslations({ locale, namespace: 'FAQ' });

    // Determine the slug prefix based on toolId (e.g., 'ping' -> 'faq-ping-')
    const toolMapping: Record<string, string> = {
        'ping': 'ping',
        'http': 'http',
        'dns': 'dns',
        'mtr': 'mtr',
        'tcp': 'tcpudp',
        'udp': 'tcpudp',
        'dns-all': 'dns',
        'ssl': 'ssl',
        'info': 'ipinfo',
        'ip-info': 'ipinfo',
        'smtp': 'smtp'
    };

    const mappedId = toolMapping[toolId] || toolId;
    const slugPrefix = `faq-${mappedId}-`;

    let faqs = [];
    try {
        const result = await query(`
            SELECT id, title, content, order_index
            FROM docs_articles
            WHERE section = 'faq' AND published = true AND locale = $1 AND slug LIKE $2
            ORDER BY order_index ASC
        `, [locale, `${slugPrefix}%`]);

        // Fallback to English if no FAQs strictly for this tool in current locale
        if (result.rows.length === 0 && locale !== 'en') {
            const fallback = await query(`
                SELECT id, title, content, order_index
                FROM docs_articles
                WHERE section = 'faq' AND published = true AND locale = 'en' AND slug LIKE $1
                ORDER BY order_index ASC
            `, [`${slugPrefix}%`]);
            faqs = fallback.rows;
        } else {
            faqs = result.rows;
        }
    } catch (e) {
        console.error(`Failed to fetch FAQs for tool ${mappedId}:`, e);
    }

    if (faqs.length === 0) return null;

    const accordionItems = faqs.map(faq => ({
        id: faq.id,
        question: faq.title,
        answer: faq.content
    }));

    return (
        <section className="mt-12 mb-16 max-w-4xl mx-auto w-full">
            <FaqAccordion
                items={accordionItems}
                title={t('title')}
                titleTag="h3"
            />
        </section>
    );
}
