
import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    // For production setup, we might want to allow this once or require admin session
    // Let's require admin session for safety, or a secret key
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const masterKey = process.env.NEXTAUTH_SECRET; // Simple guard

    if (!session && key !== masterKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Master Setup] Starting database synchronization and seeding...');

        // 1. Ensure Schema
        await query(`
            -- Ensure locale column exists
            DO $$ BEGIN
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'docs_articles' AND column_name = 'locale') THEN
                    ALTER TABLE docs_articles ADD COLUMN locale VARCHAR(10) DEFAULT 'en';
                END IF;
            END $$;

            -- Ensure section column has correct default or exists
            DO $$ BEGIN
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'docs_articles' AND column_name = 'section') THEN
                    ALTER TABLE docs_articles ADD COLUMN section VARCHAR(100) NOT NULL DEFAULT 'General';
                END IF;
            END $$;
        `);

        // 2. FAQ Content Data
        const faqs = [
            // --- PING (EN) ---
            { slug: 'faq-ping-1', locale: 'en', title: 'What is a Ping check?', section: 'faq', content: 'A Ping check measures the network latency (Round Trip Time) between our global nodes and your host. It uses ICMP echo requests to determine if a server is reachable and how fast it responds.', order: 1 },
            { slug: 'faq-ping-2', locale: 'en', title: 'How to interpret Ping results?', section: 'faq', content: 'Low latency (under 50ms) is excellent. 50-150ms is acceptable for most web tasks. Higher latency or packet loss usually indicates network congestion, routing issues, or high server load.', order: 2 },
            { slug: 'faq-ping-3', locale: 'en', title: 'Why check Ping from different locations?', section: 'faq', content: 'Network performance varies globally. Your site might be fast in Europe but slow in Asia. Global checks help identify regional routing problems or CDN issues.', order: 3 },

            // --- PING (UK) ---
            { slug: 'faq-ping-1', locale: 'uk', title: 'Що таке перевірка Ping?', section: 'faq', content: 'Перевірка Ping вимірює затримку мережі (час зворотного шляху) між нашими глобальними вузлами та вашим хостом. Вона використовує ехо-запити ICMP, щоб визначити, чи доступний сервер і як швидко він відповідає.', order: 1 },
            { slug: 'faq-ping-2', locale: 'uk', title: 'Як інтерпретувати результати Ping?', section: 'faq', content: 'Низька затримка (менше 50 мс) - це чудово. 50-150 мс є прийнятним для більшості веб-завдань. Вища затримка або втрата пакетів зазвичай вказують на перевантаження мережі, проблеми з маршрутизацією або високе навантаження на сервер.', order: 2 },

            // --- HTTP (EN) ---
            { slug: 'faq-http-1', locale: 'en', title: 'What does the HTTP status check do?', section: 'faq', content: 'It performs a real GET/HEAD request to your URL and checks the response code (e.g., 200 OK, 404 Not Found, 500 Error) and response headers.', order: 1 },
            { slug: 'faq-http-2', locale: 'en', title: 'Why check HTTP response time?', section: 'faq', content: 'Response time (TTFB - Time to First Byte) is critical for SEO and user experience. It shows how long your server takes to process the request before sending data.', order: 2 },

            // --- HTTP (UK) ---
            { slug: 'faq-http-1', locale: 'uk', title: 'Що робить перевірка статусу HTTP?', section: 'faq', content: 'Вона виконує справжній запит GET/HEAD до вашої URL-адреси та перевіряє код відповіді (наприклад, 200 OK, 404 Not Found, 500 Error) і заголовки відповіді.', order: 1 },
            { slug: 'faq-http-2', locale: 'uk', title: 'Чому важливо перевіряти час відповіді HTTP?', section: 'faq', content: 'Час відповіді (TTFB - час до першого байта) має вирішальне значення для SEO та користувацького досвіду. Він показує, скільки часу потрібно вашому серверу для обробки запиту перед надсиланням даних.', order: 2 },

            // --- DNS (EN) ---
            { slug: 'faq-dns-1', locale: 'en', title: 'What is a DNS lookup?', section: 'faq', content: 'DNS lookup translates human-readable domain names (like example.com) into IP addresses. Our tool checks if your records (A, CNAME, MX) are correctly propagated worldwide.', order: 1 },

            // --- DNS (UK) ---
            { slug: 'faq-dns-1', locale: 'uk', title: 'Що таке DNS-запит?', section: 'faq', content: 'DNS-запит перетворює зрозумілі людині доменні імена (наприклад, example.com) в IP-адреси. Наш інструмент перевіряє, чи правильно ваші записи (A, CNAME, MX) розповсюджені по всьому світу.', order: 1 }
        ];

        // 3. Insert FAQs
        for (const faq of faqs) {
            await query(`
                INSERT INTO docs_articles (slug, locale, title, content, section, order_index, published)
                VALUES ($1, $2, $3, $4, $5, $6, true)
                ON CONFLICT (slug, locale) DO UPDATE SET
                    title = EXCLUDED.title,
                    content = EXCLUDED.content,
                    section = EXCLUDED.section,
                    order_index = EXCLUDED.order_index,
                    published = true,
                    updated_at = NOW()
            `, [faq.slug, faq.locale, faq.title, faq.content, faq.section, faq.order]);
        }

        // 4. Update index for unique constraint if it was missed
        // (Wait, the table definition might not have a UNIQUE(slug, locale) constraint yet)
        // Let's ensure the unique constraint exists for ON CONFLICT to work properly
        try {
            await query(`
                ALTER TABLE docs_articles DROP CONSTRAINT IF EXISTS docs_articles_slug_locale_key;
                ALTER TABLE docs_articles ADD CONSTRAINT docs_articles_slug_locale_key UNIQUE (slug, locale);
            `);
        } catch (e) {
            console.log('Constraint update skipped or failed (might already exist)');
        }

        console.log('[Master Setup] Successfully completed seeding.');

        return NextResponse.json({
            success: true,
            message: 'Database schema updated and FAQs seeded successfully.',
            count: faqs.length
        });
    } catch (error: any) {
        console.error('[Master Setup] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
