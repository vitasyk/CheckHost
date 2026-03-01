
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

        // 1. Ensure Schema - Fix UNIQUE constraint (Allow same slug for different locales)
        await query(`
            -- 1. Ensure columns exist
            DO $$ BEGIN
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'docs_articles' AND column_name = 'locale') THEN
                    ALTER TABLE docs_articles ADD COLUMN locale VARCHAR(10) DEFAULT 'en';
                END IF;
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'docs_articles' AND column_name = 'section') THEN
                    ALTER TABLE docs_articles ADD COLUMN section VARCHAR(100) NOT NULL DEFAULT 'General';
                END IF;
            END $$;

            -- 2. Fix Unique Constraint: Prefer (slug, locale) over just (slug)
            DO $$ BEGIN
                -- Drop the old single slug constraint if it exists (usually it's the one from original CREATE TABLE)
                -- We try to find the constraint name. Often it's docs_articles_slug_key or similar.
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'docs_articles' AND constraint_name = 'docs_articles_slug_key') THEN
                    ALTER TABLE docs_articles DROP CONSTRAINT docs_articles_slug_key;
                END IF;
            EXCEPTION WHEN OTHERS THEN 
                NULL; 
            END $$;

            -- 3. Add composite unique constraint
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'docs_articles' AND constraint_name = 'docs_articles_slug_locale_key') THEN
                    ALTER TABLE docs_articles ADD CONSTRAINT docs_articles_slug_locale_key UNIQUE (slug, locale);
                END IF;
            EXCEPTION WHEN OTHERS THEN 
                NULL; 
            END $$;
        `);

        // 2. Comprehensive FAQ Content Data
        const faqs = [
            // --- PING ---
            { slug: 'faq-ping-1', locale: 'en', title: 'What is a Ping check?', section: 'faq', content: 'A Ping check measures network latency (Round Trip Time). It uses ICMP echo requests to determine if a server is reachable and how fast it responds.', order: 1 },
            { slug: 'faq-ping-1', locale: 'uk', title: 'Що таке перевірка Ping?', section: 'faq', content: 'Перевірка Ping вимірює затримку мережі (час зворотного шляху) між нашими вузлами та вашим хостом.', order: 1 },
            { slug: 'faq-ping-2', locale: 'en', title: 'How to interpret results?', section: 'faq', content: 'Under 50ms is excellent. Over 150ms indicates noticeable delay. Packet loss is a sign of network issues.', order: 2 },
            { slug: 'faq-ping-2', locale: 'uk', title: 'Як інтерпретувати результати?', section: 'faq', content: 'До 50мс — чудово. Понад 150мс — помітна затримка. Втрата пакетів — ознака проблем мережі.', order: 2 },

            // --- HTTP ---
            { slug: 'faq-http-1', locale: 'en', title: 'What is an HTTP status check?', section: 'faq', content: 'It performs a real GET/HEAD request to verify the response code (200 OK, 404, 500) and headers.', order: 1 },
            { slug: 'faq-http-1', locale: 'uk', title: 'Що таке перевірка статусу HTTP?', section: 'faq', content: 'Це виконання реального GET/HEAD запиту для перевірки коду відповіді (200, 404, 500) та заголовків.', order: 1 },

            // --- DNS ---
            { slug: 'faq-dns-1', locale: 'en', title: 'What is a DNS lookup?', section: 'faq', content: 'It translates domain names to IP addresses. Our tool verifies propagation of A, MX, CNAME records.', order: 1 },
            { slug: 'faq-dns-1', locale: 'uk', title: 'Що таке DNS-запит?', section: 'faq', content: 'Це переклад доменних імен в IP-адреси. Наш інструмент перевіряє розповсюдження записів A, MX, CNAME.', order: 1 },

            // --- MTR / TRACEROUTE ---
            { slug: 'faq-mtr-1', locale: 'en', title: 'What is MTR (Traceroute)?', section: 'faq', content: 'MTR combines Traceroute and Ping to show the path packets take to your server and pinpoint where lag occurs.', order: 1 },
            { slug: 'faq-mtr-1', locale: 'uk', title: 'Що таке MTR (Traceroute)?', section: 'faq', content: 'MTR поєднує Traceroute та Ping, показуючи шлях пакетів до вашого сервера та локалізуючи затримки.', order: 1 },

            // --- TCP / UDP ---
            { slug: 'faq-tcpudp-1', locale: 'en', title: 'Why check TCP/UDP ports?', section: 'faq', content: 'Checking if a port (like 80, 443, 22) is open helps diagnose firewall or service configuration issues.', order: 1 },
            { slug: 'faq-tcpudp-1', locale: 'uk', title: 'Навіщо перевіряти порти TCP/UDP?', section: 'faq', content: 'Перевірка того, чи відкритий порт (80, 443, 22), допомагає діагностувати налаштування брандмауера чи сервісів.', order: 1 },

            // --- SSL ---
            { slug: 'faq-ssl-1', locale: 'en', title: 'What does the SSL check verify?', section: 'faq', content: 'It checks certificate validity, expiration date, issuer details, and common security chain issues.', order: 1 },
            { slug: 'faq-ssl-1', locale: 'uk', title: 'Що перевіряє SSL-тест?', section: 'faq', content: 'Він перевіряє валідність сертифіката, термін дії, дані про видавця та проблеми ланцюжка безпеки.', order: 1 },

            // --- IP INFO ---
            { slug: 'faq-ipinfo-1', locale: 'en', title: 'What information is in IP Info?', section: 'faq', content: 'ISP details, ASN, geographic location, and whether the IP belongs to a known VPN or Proxy.', order: 1 },
            { slug: 'faq-ipinfo-1', locale: 'uk', title: 'Яку інформацію надає IP Info?', section: 'faq', content: 'Дані про провайдера (ISP), ASN, географічне розташування та чи належить IP до VPN або проксі.', order: 1 }
        ];

        // 3. Batch Insert FAQs
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
