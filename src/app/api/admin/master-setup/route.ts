
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
                IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'docs_articles' AND column_name = 'translation_group') THEN
                    ALTER TABLE docs_articles ADD COLUMN translation_group UUID;
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

            -- 4. Sync sequence to avoid "duplicate key" on ID
            SELECT setval('docs_articles_id_seq', COALESCE((SELECT MAX(id) FROM docs_articles), 0) + 1, false);
        `);

        // 2. Comprehensive FAQ Content Data
        const faqs = [
            // --- PING ---
            { 
                slug: 'faq-ping-1', 
                locale: 'en', 
                title: 'What is a Ping check and how does it measure connectivity?', 
                section: 'faq', 
                content: 'A Ping check is an essential network diagnostic tool that measures network latency, also known as Round Trip Time (RTT). It operates by sending ICMP (Internet Control Message Protocol) echo request packets to a specific target host or IP address and waiting for an echo reply. This process helps determine if a server is reachable across the network and how fast it can respond to requests. \n\nBy testing from multiple global locations, you can identify regional routing issues, backbone congestion, or local ISP outages that might affect only a subset of your users. Consistent monitoring with ping helps maintain high availability and provides data for troubleshooting intermittent connectivity drops.', 
                order: 1 
            },
            { 
                slug: 'faq-ping-1', 
                locale: 'uk', 
                title: 'Що таке перевірка Ping і як вона вимірює зв\'язок?', 
                section: 'faq', 
                content: 'Перевірка Ping — це фундаментальний інструмент діагностики мережі, який вимірює затримку мережі, також відому як час зворотного шляху (RTT). Вона працює шляхом надсилання пакетів ехо-запиту ICMP (Internet Control Message Protocol) до визначеного цільового хоста або IP-адреси та очікування ехо-відповіді. Цей процес допомагає визначити, чи доступний сервер у мережі та як швидко він може відповідати на запити.\n\nТестуючи з кількох глобальних локацій, ви можете виявити регіональні проблеми маршрутизації, перевантаження магістральних каналів або збої місцевих провайдерів, які можуть впливати лише на частину ваших користувачів. Постійний моніторинг за допомогою ping допомагає підтримувати високу доступність і надає дані для усунення несправностей при періодичних розривах з\'єднання.', 
                order: 1 
            },
            { 
                slug: 'faq-ping-1', 
                locale: 'ru', 
                title: 'Что такое проверка Ping и как она измеряет качество связи?', 
                section: 'faq', 
                content: 'Проверка Ping — это фундаментальный инструмент диагностики сети, который измеряет задержку сети, также известную как время приема-передачи (RTT). Она работает путем отправки пакетов эхо-запроса ICMP (Internet Control Message Protocol) на определенный целевой хост или IP-адрес и ожидания эхо-ответа. Этот процесс помогает определить, доступен ли сервер в сети и насколько быстро он может отвечать на запросы.\n\nТестируя из нескольких глобальных локаций, вы можете выявить региональные проблемы маршрутизации, перегрузку магистральных каналов или сбои местных провайдеров, которые могут затрагивать только часть ваших пользователей. Постоянный мониторинг с помощью ping помогает поддерживать высокую доступность и предоставляет данные для устранения неполадок при периодических разрывах соединения.', 
                order: 1 
            },
            { 
                slug: 'faq-ping-2', 
                locale: 'en', 
                title: 'How to interpret Ping results and identify network issues?', 
                section: 'faq', 
                content: 'Interpreting ping results requires looking at both latency (ms) and packet loss (%). Generally, a response under 50ms is considered excellent, making it ideal for real-time applications like VOIP or gaming. Responses between 50ms and 150ms are acceptable for general web browsing, while anything over 150ms indicates a noticeable delay that could impact user experience.\n\nPacket loss is even more critical; any significant percentage of lost packets suggests serious network congestion, faulty hardware along the path, or aggressive firewall filtering. Jitter, or the variation in latency between consecutive pings, is another sign of an unstable connection. If you see high latency from only one region, it\'s likely a local routing or provider issue, whereas global high latency might indicate server-side performance bottlenecks.', 
                order: 2 
            },
            { 
                slug: 'faq-ping-2', 
                locale: 'uk', 
                title: 'Як інтерпретувати результати Ping та виявляти проблеми?', 
                section: 'faq', 
                content: 'Інтерпретація результатів ping вимагає аналізу як затримки (мс), так і втрати пакетів (%). Як правило, відповідь менше 50 мс вважається чудовою, що ідеально підходить для додатків у реальному часі, таких як VOIP або ігри. Відповіді від 50 мс до 150 мс є прийнятними для звичайного веб-перегляду, тоді як все, що перевищує 150 мс, вказує на помітну затримку, яка може вплинути на досвід користувача.\n\nВтрата пакетів є ще більш критичною; будь-який значний відсоток втрачених пакетів свідчить про серйозне перевантаження мережі, несправне обладнання на шляху або агресивну фільтрацію брандмауером. Джиттер, або варіація затримки між послідовними пінгами, є ще однією ознакою нестабільного з\'єднання. Якщо ви бачите високу затримку лише з одного регіону, ймовірно, це проблема місцевої маршрутизації або провайдера, тоді як глобальна затримка може вказувати на проблеми з продуктивністю на стороні сервера.', 
                order: 2 
            },
            { 
                slug: 'faq-ping-2', 
                locale: 'ru', 
                title: 'Как интерпретировать результаты Ping и выявлять сетевые проблемы?', 
                section: 'faq', 
                content: 'Интерпретация результатов ping требует анализа как задержки (мс), так и потери пакетов (%). Как правило, ответ менее 50 мс считается отличным, что идеально подходит для приложений реального времени, таких как VOIP или игры. Ответы от 50 мс до 150 мс являются приемлемыми для обычного веб-серфинга, в то время как все, что превышает 150 мс, указывает на заметную задержку, которая может повлиять на пользовательский опыт.\n\nПотеря пакетов еще более критична; любой значительный процент потерянных пакетов свидетельствует о серьезной перегрузке сети, неисправном оборудовании на пути или агрессивной фильтрации брандмауэром. Джиттер, или вариация задержки между последовательными пингами, является еще одним признаком нестабильного соединения. Если вы видите высокую задержку только из одного региона, скорее всего, это проблема местной маршрутизации или провайдера, тогда как глобальная высокая задержка может указывать на узкие места в производительности на стороне сервера.', 
                order: 2 
            },

            // --- HTTP ---
            { 
                slug: 'faq-http-1', 
                locale: 'en', 
                title: 'What is an HTTP status check and why is it important?', 
                section: 'faq', 
                content: 'An HTTP status check goes beyond simple connectivity tests by performing a real web request to verify the availability and performance of a specific URL. Our tool simulates a visitor\'s browser from multiple global locations to ensure that your web server returns the expected response code, such as "200 OK". It also captures redirect chains (301/302), missing pages (404), or server-side crashes (500 Internal Server Error).\n\nBeyond just the status code, our HTTP check measures the Time to First Byte (TTFB) and total response time. This is crucial for SEO and user retention, as slow-loading pages often lead to higher bounce rates. Monitoring HTTP status from worldwide locations helps detect CDN misconfigurations, regional geoblocking, and localized outages that simple uptime monitors might miss.', 
                order: 1 
            },
            { 
                slug: 'faq-http-1', 
                locale: 'uk', 
                title: 'Що таке перевірка статусу HTTP і чому вона важлива?', 
                section: 'faq', 
                content: 'Перевірка статусу HTTP виходить за рамки простих тестів на з\'єднання, виконуючи реальний веб-запит для перевірки доступності та продуктивності конкретного URL. Наш інструмент симулює браузер відвідувача з кількох глобальних локацій, щоб переконатися, що ваш веб-сервер повертає очікуваний код відповіді, наприклад "200 OK". Він також фіксує ланцюжки перенаправлень (301/302), відсутні сторінки (404) або збої на стороні сервера (500 Internal Server Error).\n\nКрім коду статусу, наша перевірка HTTP вимірює час до першого байта (TTFB) і загальний час відповіді. Це критично важливо для SEO та утримання користувачів, оскільки повільні сторінки часто призводять до високого показника відмов. Моніторинг статусу HTTP з усього світу допомагає виявити неправильні налаштування CDN, регіональні геоблокування та локалізовані збої, які прості монітори аптайму можуть пропустити.', 
                order: 1 
            },
            { 
                slug: 'faq-http-1', 
                locale: 'ru', 
                title: 'Что такое проверка статуса HTTP и почему она важна?', 
                section: 'faq', 
                content: 'Проверка статуса HTTP выходит за рамки простых тестов на соединение, выполняя реальный веб-запрос для проверки доступности и производительности конкретного URL. Наш инструмент имитирует браузер посетителя из нескольких глобальных локаций, чтобы убедиться, что ваш веб-сервер возвращает ожидаемый код ответа, например "200 OK". Он также фиксирует цепочки перенаправлений (301/302), отсутствующие страницы (404) или сбои на стороне сервера (500 Internal Server Error).\n\nПомимо кода статуса, наша проверка HTTP измеряет время до первого байта (TTFB) и общее время ответа. Это критически важно для SEO и удержания пользователей, так как медленно загружающиеся страницы часто приводят к более высокому показателю отказов. Мониторинг статуса HTTP из любой точки мира помогает обнаружить неправильные настройки CDN, региональную геоблокировку и локальные сбои, которые простые мониторы аптайма могут пропустить.', 
                order: 1 
            },
            { 
                slug: 'faq-http-2', 
                locale: 'en', 
                title: 'How to troubleshoot common HTTP errors detected by the checker?', 
                section: 'faq', 
                content: 'When our checker detects an error, the specific HTTP status code provides the first clue for troubleshooting. A 403 Forbidden error often points to server-side security rules or a WAF (Web Application Firewall) blocking our diagnostic nodes. A 404 Not Found indicates that the URL path is incorrect or the resource has been moved without a proper redirect. \n\n5xx level errors generally indicate server-side issues. For example, a 502 Bad Gateway or 504 Gateway Timeout often means the reverse proxy (like Nginx or Cloudflare) cannot communicate with the upstream application server. If you see high response times from only specific regions, check your CDN configuration and regional server performance to identify localized latency issues.', 
                order: 2 
            },
            { 
                slug: 'faq-http-2', 
                locale: 'uk', 
                title: 'Як усунути поширені помилки HTTP, виявлені інструментом?', 
                section: 'faq', 
                content: 'Коли наш інструмент виявляє помилку, конкретний код статусу HTTP дає першу підказку для усунення несправностей. Помилка 403 Forbidden часто вказує на серверні правила безпеки або WAF (Web Application Firewall), який блокує наші діагностичні вузли. 404 Not Found вказує на те, що шлях URL неправильний або ресурс було переміщено без належного перенаправлення.\n\nПомилки рівня 5xx зазвичай вказують на проблеми на стороні сервера. Наприклад, 502 Bad Gateway або 504 Gateway Timeout часто означають, що зворотний проксі (наприклад, Nginx або Cloudflare) не може зв\'язатися з сервером додатків. Якщо ви бачите високий час відповіді лише з певних регіонів, перевірте конфігурацію CDN та продуктивність регіональних серверів, щоб виявити локальні проблеми із затримкою.', 
                order: 2 
            },
            { 
                slug: 'faq-http-2', 
                locale: 'ru', 
                title: 'Как устранить распространенные ошибки HTTP, обнаруженные инструментом?', 
                section: 'faq', 
                content: 'Когда наш инструмент обнаруживает ошибку, конкретный код статуса HTTP дает первую подсказку для устранения неполадок. Ошибка 403 Forbidden часто указывает на серверные правила безопасности или WAF (Web Application Firewall), блокирующий наши диагностические узлы. 404 Not Found указывает на то, что путь URL неверен или ресурс был перемещен без надлежащего перенаправления.\n\nОшибки уровня 5xx обычно указывают на проблемы на стороне сервера. Например, 502 Bad Gateway или 504 Gateway Timeout часто означают, что обратный прокси (наприклад, Nginx или Cloudflare) не может связаться с вышестоящим сервером приложений. Если вы видите высокое время ответа только из определенных регионов, перед проверьте конфигурацию CDN и производительность региональных серверів, чтобы выявить локальные проблемы с задержкой.', 
                order: 2 
            },

            // --- DNS ---
            { 
                slug: 'faq-dns-1', 
                locale: 'en', 
                title: 'How does global DNS lookup and propagation check work?', 
                section: 'faq', 
                content: 'A DNS lookup is the process of translating human-readable domain names into machine-readable IP addresses. Our global DNS propagation checker queries authoritative nameservers and various recursive resolvers across different geographic regions to verify if your DNS records are updated everywhere. It supports all critical record types, including A (IPv4), AAAA (IPv6), MX (Mail Exchange), CNAME (Canonical Name), and TXT (Text records for security like SPF and DKIM).\n\nWhen you migrate a website or change email providers, DNS changes can take hours or even days to fully propagate due to TTL (Time to Live) settings. By using our worldwide lookup tool, you can see in real-time which countries still see the old records and which have already switched to the new ones, allowing you to confirm a successful deployment and minimize downtime.', 
                order: 1 
            },
            { 
                slug: 'faq-dns-1', 
                locale: 'uk', 
                title: 'Як працює глобальна перевірка DNS та поширення записів?', 
                section: 'faq', 
                content: 'DNS-запит — це процес перекладу зручних для людини доменних імен у зрозумілі для машин IP-адреси. Наша глобальна перевірка DNS запитує авторитетні сервери імен та різні рекурсивні резолвери у різних географічних регіонах, щоб перевірити, чи оновилися ваші DNS-записи скрізь. Вона підтримує всі критичні типи записів, включаючи A (IPv4), AAAA (IPv6), MX (Mail Exchange), CNAME (Canonical Name) та TXT (текстові записи для безпеки, такі як SPF та DKIM).\n\nКоли ви переносите веб-сайт або змінюєте постачальника електронної пошти, оновлення DNS можуть зайняти години або навіть дні для повного поширення через налаштування TTL (час життя). Використовуючи наш інструмент перевірки по всьому світу, ви можете в режимі реального часу бачити, які країни все ще бачать старі записи, а які вже перейшли на нові, що дозволяє підтвердити успішне впровадження та мінімізувати час простою.', 
                order: 1 
            },
            { 
                slug: 'faq-dns-1', 
                locale: 'ru', 
                title: 'Как работает глобальная проверка DNS и распространение записей?', 
                section: 'faq', 
                content: 'DNS-запрос — это процесс перевода понятных человеку доменных имен в понятные машинам IP-адреса. Наша глобальная проверка DNS запрашивает авторитетные серверы имен и различные рекурсивные резолверы в разных географических регионах, чтобы проверить, обновились ли ваши DNS-записи повсеместно. Она поддерживает все критические типы записей, включая A (IPv4), AAAA (IPv6), MX (Mail Exchange), CNAME (Canonical Name) и TXT (текстовые записи для безопасности, такие как SPF и DKIM).\n\nКогда вы переносите веб-сайт или меняете провайдера электронной почты, обновления DNS могут занять часы или даже дни для полного распространения из-за настроек TTL (время жизни). Используя наш инструмент проверки по всему миру, вы можете в режиме реального времени видеть, какие страны все еще видят старые записи, а какие уже перешли на новые, что позволяет подтвердить успешное внедрение и минимизировать время простоя.', 
                order: 1 
            },

            // --- MTR / TRACEROUTE ---
            { 
                slug: 'faq-mtr-1', 
                locale: 'en', 
                title: 'What is MTR and how does it help pinpoint network bottlenecks?', 
                section: 'faq', 
                content: 'MTR (My Traceroute) is an advanced tool that combines the functionality of Traceroute and Ping. While Traceroute shows the path traffic takes to reach a destination, MTR continuously sends packets to every router (hop) along that path to collect statistics about latency and packet loss at each stage. This makes it invaluable for identifying exactly where a network slowdown is occurring.\n\nFor example, if you notice 10% packet loss, MTR can show you if the loss starts at your home router, inside your ISP’s network, or at the destination data center’s edge router. This level of detail allows system administrators to provide concrete evidence when reporting issues to service providers. Our global MTR tool lets you run these tests from various continents to see how different internet backbones handle traffic to your server.', 
                order: 1 
            },
            { 
                slug: 'faq-mtr-1', 
                locale: 'uk', 
                title: 'Що таке MTR і як він допомагає знайти вузькі місця в мережі?', 
                section: 'faq', 
                content: 'MTR (My Traceroute) — це розширений інструмент, який поєднує функціональність Traceroute та Ping. У той час як Traceroute показує шлях, яким трафік йде до пункту призначення, MTR безперевно надсилає пакети на кожен маршрутизатор (вузол) на цьому шляху для збору статистики про затримки та втрати пакетів на кожному етапі. Це робить його неоціненним для визначення того, де саме відбувається сповільнення мережі.\n\nНаприклад, якщо ви помітили 10% втрати пакетів, MTR може показати вам, чи починається втрата на вашому домашньому маршрутизаторі, всередині мережі вашого провайдера або на межовому маршрутизаторі центру обробки даних призначення. Такий рівень деталізації дозволяє системним адміністраторам надавати конкретні докази при повідомленні про проблеми постачальникам послуг. Наш глобальний інструмент MTR дозволяє запускати ці тести з різних континентів, щоб побачити, як різні магістралі інтернету обробляють трафік до вашого сервера.', 
                order: 1 
            },
            { 
                slug: 'faq-mtr-1', 
                locale: 'ru', 
                title: 'Что такое MTR и как он помогает найти узкие места в сети?', 
                section: 'faq', 
                content: 'MTR (My Traceroute) — это расширенный инструмент, сочетающий в себе функциональность Traceroute и Ping. В той время как Traceroute показывает путь, по которому трафик идет к пункту назначения, MTR непрерывно отправляет пакеты на каждый маршрутизатор (хоп) на этом пути для сбора статистики о задержках и потерях пакетов на каждом этапе. Это делает его неоценимым для определения того, где именно происходит замедление сети.\n\nНапример, если вы заметили 10% потерю пакетов, MTR может показать вам, начинается ли потеря на вашем домашнем маршрутизаторе, внутри сети вашего провайдера или на граничном маршрутизаторе целевого дата-центра. Такой уровень детализации позволяет системным администраторам предоставлять конкретные доказательства при сообщении о проблемах поставщикам услуг. Наш глобальный инструмент MTR позволяет запускать эти тесты с разных континентов, чтобы увидеть, как различные магистрали интернета обрабатывают трафик к вашему серверу.', 
                order: 1 
            },

            // --- TCP / UDP ---
            { 
                slug: 'faq-tcpudp-1', 
                locale: 'en', 
                title: 'Why is checking TCP and UDP port availability essential?', 
                section: 'faq', 
                content: 'TCP and UDP port checks are critical for diagnosing firewall configurations and ensuring that specific services are accessible to the public. TCP (Transmission Control Protocol) is used for reliable communication in services like web (80/443), SSH (22), and databases (3306), while UDP (User Datagram Protocol) is preferred for speed in services like DNS (53), VOIP, and many online games.\n\nOften, a server might be online and "pingable," but a specific service like a web server might be unreachable because port 443 is blocked by a firewall or not listening. Our port checker tests connectivity from multiple global regions to verify that your firewall rules are correctly allowing legitimate traffic without exposing sensitive ports to the entire internet. This helps prevent security gaps while ensuring service continuity for your global users.', 
                order: 1 
            },
            { 
                slug: 'faq-tcpudp-1', 
                locale: 'uk', 
                title: 'Чому перевірка доступності портів TCP та UDP є необхідною?', 
                section: 'faq', 
                content: 'Перевірка портів TCP та UDP має вирішальне значення для діагностики налаштувань брандмауера та перевірки того, чи доступні конкретні послуги для громадськості. TCP (Transmission Control Protocol) використовується для надійного зв\'язку в таких службах, як веб (80/443), SSH (22) та бази даних (3306), тоді як UDP (User Datagram Protocol) є кращим для швидкості в таких службах, як DNS (53), VOIP та багатьох онлайн-іграх.\n\nЧасто сервер може бути онлайн і "пінгатися", але конкретна служба, наприклад веб-сервер, може бути недоступною, оскільки порт 443 заблокований брандмауером або не прослуховується. Наш інструмент перевірки портів тестує з\'єднання з кількох глобальних регіонів, щоб переконатися, що ваші правила брандмауера правильно дозволяють легітимний трафік, не відкриваючи чутливі порти для всього інтернету. Це допомагає запобігти прогалинам у безпеці, забезпечуючи безперервність обслуговування ваших користувачів у всьому світі.', 
                order: 1 
            },
            { 
                slug: 'faq-tcpudp-1', 
                locale: 'ru', 
                title: 'Почему проверка доступности портов TCP и UDP необходима?', 
                section: 'faq', 
                content: 'Проверка портов TCP и UDP имеет решающее значение для диагностики настроек брандмауэра и проверки того, доступны ли конкретные службы для общественности. TCP (Transmission Control Protocol) используется для надежной связи в таких службах, как веб (80/443), SSH (22) и базы данных (3306), в то время как UDP (User Datagram Protocol) предпочтителен для скорости в таких службах, как DNS (53), VOIP и многих онлайн-играх.\n\nЧасто сервер может быть онлайн и "пинговаться", но конкретная служба, например веб-сервер, может быть недоступна, так как порт 443 заблокирован брандмауэром или не прослушивается. Наш инструмент проверки портов тестирует соединение из нескольких глобальных регионов, чтобы убедиться, что ваши правила брандмауэра правильно разрешают легитимный трафик, не открывая чувствительные порти всему интернету. Это помогает предотвратить бреши в безопасности, обеспечивая непрерывность обслуживания ваших пользователей по всему миру.', 
                order: 1 
            },

            // --- SSL ---
            { 
                slug: 'faq-ssl-1', 
                locale: 'en', 
                title: 'What does a professional SSL certificate check verify?', 
                section: 'faq', 
                content: 'A professional SSL/TLS check verifies the digital identity of your website and ensures that all data transmitted between the server and the browser is encrypted and secure. It checks the certificate validity, expiration date, and whether it is trusted by major browsers. More importantly, it inspects the "Chain of Trust" to ensure that intermediate certificates are correctly installed, preventing "Untrusted Connection" warnings on some devices.\n\nIn addition to basic validity, our tool analyzes supported protocols (like TLS 1.2 and 1.3) and cipher suites to detect weak encryption that might be vulnerable to attacks. Since many websites use CDNs, a certificate might look valid in your region but be expired on an edge server in another country. A global SSL check ensures consistency across all edge nodes, protecting your brand reputation and user trust worldwide.', 
                order: 1 
            },
            { 
                slug: 'faq-ssl-1', 
                locale: 'uk', 
                title: 'Що перевіряє професійна діагностика SSL-сертифіката?', 
                section: 'faq', 
                content: 'Професійна перевірка SSL/TLS підтверджує цифрову ідентичність вашого веб-сайту та гарантує, що всі дані, які передаються між сервером і браузером, зашифровані та захищені. Вона перевіряє дійсність сертифіката, термін дії та чи довіряють йому основні браузери. Що ще важливіше, вона перевіряє "ланцюжок довіри", щоб переконатися, що проміжні сертифікати встановлені правильно, запобігаючи попередженням про "незахищене з\'єднання" на деяких пристроях.\n\nНа додаток до базової валідності, наш інструмент аналізує підтримувані протоколи (такі як TLS 1.2 та 1.3) та набори шифрів для виявлення слабкого шифрування, яке може бути вразливим до атак. Оскільки багато веб-сайтів використовують CDN, сертифікат може виглядати дійсним у вашому регіоні, але бути простроченим на межовому сервері в іншій країні. Глобальна перевірка SSL забезпечує узгодженість на всіх вузлах мережі, захищаючи репутацію вашого бренду та довіру користувачів у всьому світі.', 
                order: 1 
            },
            { 
                slug: 'faq-ssl-1', 
                locale: 'ru', 
                title: 'Что проверяет профессиональная диагностика SSL-сертификата?', 
                section: 'faq', 
                content: 'Профессиональная проверка SSL/TLS подтверждает цифровую идентичность вашего веб-сайта и гарантирует, что все данные, передаваемые между сервером и браузером, зашифрованы и защищены. Она проверяет действительность сертификата, срок действия и доверяют ли ему основные браузеры. Что еще важнее, она проверяет "цепочку доверия", чтобы убедиться, что промежуточные сертификаты установлены правильно, предотвращая предупреждения о "незащищенном соединении" на некоторых устройствах.\n\nВ дополнение к базовой валидности, наш инструмент анализирует поддерживаемые протоколы (такие как TLS 1.2 и 1.3) и наборы шифров для обнаружения слабого шифрования, которое может быть уязвимо для атак. Поскольку многие веб-сайты используют CDN, сертификат может выглядеть действительным в вашем регионе, но быть просроченным на пограничном сервере в другой стране. Глобальная проверка SSL обеспечивает согласованность на всех узлах сети, защищая репутацию вашего бренда и доверие пользователей по всему миру.', 
                order: 1 
            },

            // --- IP INFO ---
            { 
                slug: 'faq-ipinfo-1', 
                locale: 'en', 
                title: 'What critical insights can be gained from IP Address Information?', 
                section: 'faq', 
                content: 'IP Address information provides detailed metadata about any endpoint connected to the internet. This includes the geographic location (country, city, and coordinates), the Internet Service Provider (ISP), and the Autonomous System Number (ASN). Knowing the ASN is particularly useful for identifying the owner of a network block, such as Amazon AWS, Google Cloud, or a specific local telecom provider.\n\nOur IP Info tool also helps in security auditing by identifying known VPN, Proxy, or Tor exit nodes, which are often used to mask malicious activity. For network administrators, comparing results from multiple providers helps verify the accuracy of geolocation databases, which is essential for content delivery, localized pricing, and regional compliance. Whether you are identifying a suspicious visitor or verifying your own server\'s network identity, our global lookup provides the precision data you need.', 
                order: 1 
            },
            { 
                slug: 'faq-ipinfo-1', 
                locale: 'uk', 
                title: 'Які важливі дані можна отримати з інформації про IP-адресу?', 
                section: 'faq', 
                content: 'Інформація про IP-адресу надає детальні метадані про будь-яку кінцеву точку, підключену до інтернету. Це включає географічне розташування (країна, місто та координати), інтернет-провайдера (ISP) та номер автономної системи (ASN). Знання ASN особливо корисне для ідентифікації власника мережевого блоку, такого як Amazon AWS, Google Cloud або конкретного місцевого телекомунікаційного провайдера.\n\nНаш інструмент IP Info також допомагає в аудиті безпеки, ідентифікуючи відомі вузли VPN, Proxy або вихідні вузли Tor, які часто використовуються для маскування зловмисної діяльності. Для мережевих адміністраторів порівняння результатів від кількох постачальників допомагає перевірити точність баз даних геолокації, що є важливим для доставки контенту, локалізованого ціноутворення та регіонального комплаєнсу. Незалежно від того, чи ідентифікуєте ви підозрілого відвідувача, чи перевіряєте мережеву ідентичність власного сервера, наш глобальний пошук надає необхідні точні дані.', 
                order: 1 
            },
            { 
                slug: 'faq-ipinfo-1', 
                locale: 'ru', 
                title: 'Какие важные данные можно получить из информации об IP-адресе?', 
                section: 'faq', 
                content: 'Информация об IP-адресе предоставляет детальные метаданные о любой конечной точке, подключенной к интернету. Это включает географическое положение (страна, город и координаты), интернет-провайдера (ISP) и номер автономной системы (ASN). Знание ASN особенно полезно для идентификации владельца сетевого блока, такого как Amazon AWS, Google Cloud или конкретного местного телеком-провайдера.\n\nНаш инструмент IP Info также помогает в аудите безопасности, идентифицируя известные узлы VPN, прокси или выходные узлы Tor, которые часто используются для маскировки вредоносной деятельности. Для сетевых администраторов сравнение результатов от нескольких поставщиков помогает проверить точность баз данных геолокации, что важно для доставки контента, локализованного ценообразования и регионального комплаенса. Независимо от того, идентифицируете ли вы подозрительного посетителя или проверяете сетевую идентичность собственного сервера, наш глобальный поиск предоставляет необходимые вам точные данные.', 
                order: 1 
            }
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
