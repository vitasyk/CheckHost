const fs = require('fs');
const path = require('path');

const messagesDir = path.join(process.cwd(), 'messages');
const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

const translations = {
    en: {
        ping: {
            title: "What is a Ping Test and How Does It Work?",
            understanding: "Understanding the Ping Command",
            understandingDesc: "A Ping test is an essential network diagnostic tool used to test the reachability of a host on an IP network. It operates by sending ICMP Echo Request packets to the target and waiting for a reply.",
            latency: "Why Measure Network Latency?",
            latencyDesc: "The round-trip time (RTT) for packets is known as latency, measured in milliseconds (ms). High latency causes slow website loading and poor application performance.",
            latencyList: {
                fast: "Fast Response (0-50ms): Excellent connection, ideal for real-time applications.",
                acceptable: "Acceptable Response (50-150ms): Good connection, suitable for general web browsing.",
                slow: "Slow Response (>150ms): Noticeable delay that impacts interactive applications."
            },
            global: "The Importance of Global Testing",
            globalDesc: "Testing from a single location only shows part of the picture. By using a global ping tool, you verify routing efficiency and identify regional network outages simultaneously."
        },
        http: {
            title: "HTTP Status Check: Verify Website Availability",
            understanding: "Understanding HTTP Checks",
            understandingDesc: "An HTTP check simulates a real browser sending a request to your web server. It verifies if your website is online, responds with the correct HTTP status code (like 200 OK), and measures exactly how long it takes to fetch the page content.",
            latency: "Monitoring Response Times",
            latencyDesc: "Website speed is critical for user experience and SEO. A slow Time to First Byte (TTFB) or long DNS resolution time can drive visitors away.",
            latencyList: {
                fast: "Fast (0-500ms): Excellent server response and optimized network path.",
                acceptable: "Average (500-1500ms): Typical response time, but can be improved with caching.",
                slow: "Slow (>1500ms): Poor user experience, indicating server overload or network issues."
            },
            global: "Why Test Worldwide?",
            globalDesc: "Your server in Frankfurt might load instantly for European users, but time out for visitors in Sydney. Global HTTP checks reveal CDN misconfigurations, regional blocking, and latency bottlenecks."
        },
        dns: {
            title: "Global DNS Propagation Checker",
            understanding: "How DNS Lookups Work",
            understandingDesc: "The Domain Name System (DNS) translates human-readable domain names into IP addresses. A DNS Lookup queries authoritative nameservers to fetch specific records (A, AAAA, MX, CNAME, TXT) associated with your domain.",
            latency: "Key DNS Records Explained",
            latencyDesc: "Different records serve specific functional purposes in your network architecture:",
            latencyList: {
                a: "A & AAAA: Maps a domain name to an IPv4 (A) or IPv6 (AAAA) address.",
                mx: "MX (Mail Exchange): Directs email to the correct mail server.",
                txt: "TXT: Holds text information, crucial for email security (SPF, DKIM, DMARC)."
            },
            global: "Verifying Global DNS Propagation",
            globalDesc: "When you change your domain's hosting, the new IP address must propagate across global DNS caches. This tool checks multiple resolvers worldwide to ensure your updates are visible everywhere."
        },
        mtr: {
            title: "MTR (Multi-Traceroute): Advanced Network Diagnostics",
            understanding: "What is MTR?",
            understandingDesc: "MTR combines the functionality of the 'traceroute' and 'ping' programs in a single network diagnostic tool. It investigates the network connection between the host MTR runs on and a user-specified destination host.",
            latency: "Analyzing Hop-by-Hop Data",
            latencyDesc: "By continuously sending packets to each router (hop) along the path, MTR provides real-time statistics about network health.",
            latencyList: {
                loss: "Packet Loss (%): High loss at a specific hop often indicates a congested router or faulty link.",
                ping: "Latency (Ping): Sudden spikes in response time reveal where network slowdowns originate.",
                routing: "Routing Path: Identify if traffic is taking an optimal geographical route."
            },
            global: "Isolating Network Bottlenecks",
            globalDesc: "When users report connectivity issues, MTR helps pinpoint exactly where the connection fails—whether it's at your ISP, a backbone provider, or the destination data center."
        },
        tcpUdp: {
            title: "TCP and UDP Port Availability Check",
            understanding: "Port Scanning Explained",
            understandingDesc: "Port checks determine the status of specific network ports. TCP (Transmission Control Protocol) establishes a reliable connection, while UDP (User Datagram Protocol) sends data without a preliminary connection.",
            latency: "Common Use Cases",
            latencyDesc: "Verifying port availability is essential for system administrators configuring firewalls and deploying new services.",
            latencyList: {
                web: "Web Services: TCP 80 (HTTP) and TCP 443 (HTTPS).",
                mail: "Email: TCP 25 (SMTP), TCP 110 (POP3), and TCP 143 (IMAP).",
                db: "Databases: TCP 3306 (MySQL), TCP 5432 (PostgreSQL)."
            },
            global: "Detecting Firewall Blocks",
            globalDesc: "Testing ports globally ensures your services aren't being inadvertently blocked by regional ISP firewalls or geoblocking rules configured on your server."
        },
        ipInfo: {
            title: "IP Address Information & Geolocation",
            understanding: "What is IP Intelligence?",
            understandingDesc: "IP Info tools extract detailed metadata associated with a specific IP address or domain name. This includes geographic coordinates, the governing Internet Service Provider (ISP), and the Autonomous System Number (ASN).",
            latency: "Why Identify IP Data?",
            latencyDesc: "Understanding who owns an IP address and where it is physically located is crucial for numerous administrative tasks:",
            latencyList: {
                security: "Security: Investigate suspicious traffic or failed login attempts.",
                routing: "Routing: Verify BGP routing and CDN edge node resolving.",
                compliance: "Compliance: Ensure data is hosted in the correct geographic jurisdiction."
            },
            global: "WHOIS and Abuse Contacts",
            globalDesc: "In addition to location data, advanced lookups provide administrative contact information (WHOIS) for an IP block, which is necessary for reporting network abuse or spam."
        },
        ssl: {
            title: "SSL/TLS Certificate Checker",
            understanding: "What Does an SSL Certificate Check Verify?",
            understandingDesc: "An SSL/TLS check analyzes the security certificate of a website, confirming it is valid, trusted by major browsers, and not expired. It reveals the certificate authority (CA), expiry date, and encryption strength.",
            latency: "Why Monitor Your SSL Certificate?",
            latencyDesc: "An expired or misconfigured SSL certificate causes browser security warnings, blocking visitors immediately. Proactive monitoring prevents unexpected outages.",
            latencyList: {
                expiry: "Certificate Expiry: Certificates have a validity period. An expired cert immediately breaks HTTPS for all visitors.",
                chain: "Chain of Trust: A broken chain (missing intermediate certificate) causes untrusted warnings on some browsers.",
                cipher: "Cipher Suite: Weak encryption algorithms (like RC4 or MD5) expose users to man-in-the-middle attacks."
            },
            global: "Global Certificate Validation",
            globalDesc: "Different regions may resolve to different servers due to CDN or GeoDNS configurations. A global SSL check confirms that all edge servers present a valid certificate, not just your local resolver."
        }
    },
    uk: {
        ping: {
            title: "Що таке Ping-тест і як він працює?",
            understanding: "Розуміння команди Ping",
            understandingDesc: "Ping-тест - це базовий інструмент мережевої діагностики, що перевіряє доступність хоста в IP-мережі. Він відправляє запити ICMP Echo Request до цілі та чекає на відповідь.",
            latency: "Навіщо вимірювати затримку мережі?",
            latencyDesc: "Час, за який пакети долають шлях туди і назад (RTT), називається затримкою, і вимірюється в мілісекундах (мс). Висока затримка сповільнює завантаження сайтів та роботу застосунків.",
            latencyList: {
                fast: "Швидко (0-50 мс): Відмінне з'єднання, ідеально для додатків реального часу.",
                acceptable: "Прийнятно (50-150 мс): Добре з'єднання для звичайного серфінгу.",
                slow: "Повільно (>150 мс): Відчутна затримка, що впливає на інтерактивність."
            },
            global: "Важливість глобальних перевірок",
            globalDesc: "Перевірка з однієї локації не показує повної картини. Глобальний ping-тест дозволяє перевірити ефективність маршрутизації та миттєво виявити регіональні збої."
        },
        http: {
            title: "HTTP-перевірка: контроль доступності сайту",
            understanding: "Як працюють HTTP-запити",
            understandingDesc: "HTTP-перевірка імітує реальний браузер. Вона перевіряє, чи сайт онлайн, чи повертає правильний код статусу (наприклад, 200 OK) та скільки часу займає завантаження.",
            latency: "Моніторинг часу відповіді",
            latencyDesc: "Швидкість сайту критична для користувачів та SEO. Довгий час відповіді сервера (TTFB) або повільний DNS відлякують відвідувачів.",
            latencyList: {
                fast: "Швидко (0-500 мс): Відмінна швидкість сервера та оптимізований канал.",
                acceptable: "Середньо (500-1500 мс): Нормальний час, але можна покращити кешуванням.",
                slow: "Повільно (>1500 мс): Поганий досвід користувача, можливе перевантаження сервера."
            },
            global: "Навіщо перевіряти з усього світу?",
            globalDesc: "Ваш сервер у Німеччині може швидко працювати для Європи, але не відкриватися в Азії. Глобальна перевірка виявляє помилки CDN та регіональні блокування."
        },
        dns: {
            title: "Глобальна перевірка розповсюдження DNS",
            understanding: "Як працюють DNS-запити",
            understandingDesc: "DNS перетворює доменні імена на IP-адреси. DNS-запит звертається до авторитетних серверів для отримання записів (A, AAAA, MX, CNAME, TXT) вашого домену.",
            latency: "Ключові DNS-записи",
            latencyDesc: "Різні записи виконують конкретні функції у вашій архітектурі:",
            latencyList: {
                a: "A та AAAA: Пов'язує домен з адресою IPv4 (A) або IPv6 (AAAA).",
                mx: "MX: Направляє електронну пошту на правильний поштовий сервер.",
                txt: "TXT: Зберігає текстові дані, критично для безпеки пошти (SPF, DKIM, DMARC)."
            },
            global: "Перевірка оновлення DNS у світі",
            globalDesc: "При зміні хостингу нова IP-адреса має оновитися в кешах глобальних DNS. Цей інструмент перевіряє світові сервери, щоб переконатися, що ваш сайт доступний усюди."
        },
        mtr: {
            title: "MTR: Детальна діагностика маршруту мережі",
            understanding: "Що таке MTR?",
            understandingDesc: "MTR поєднує функції утиліт traceroute та ping в одному інструменті. Він досліджує повний шлях між сервером та кінцевим хостом.",
            latency: "Аналіз кожного вузла (Hop)",
            latencyDesc: "Постійно надсилаючи пакети кожному маршрутизатору на шляху, MTR надає статистику якості мережі в реальному часі.",
            latencyList: {
                loss: "Втрата пакетів (%): Високі втрати на певному вузлі вказують на перевантаження або аварію.",
                ping: "Затримка: Раптові стрибки часу відгуку показують, де саме виникає гальмування.",
                routing: "Маршрутизація: Дозволяє побачити, чи оптимальним фізичним шляхом йде трафік."
            },
            global: "Пошук вузьких місць",
            globalDesc: "Коли користувачі скаржаться на обриви зв'язку, MTR точно показує, де саме розрив: у провайдера, на магістральній лінії чи в дата-центрі."
        },
        tcpUdp: {
            title: "Перевірка доступності TCP та UDP портів",
            understanding: "Як працює перевірка портів",
            understandingDesc: "Тест перевіряє статус мережевих портів. TCP встановлює надійне з'єднання з підтвердженням, тоді як UDP просто надсилає дані без попереднього встановлення зв'язку.",
            latency: "Популярні сценарії використання",
            latencyDesc: "Перевірка портів обов'язкова під час налаштування фаєрволів та запуску нових сервісів.",
            latencyList: {
                web: "Веб-сервіси: TCP 80 (HTTP) та TCP 443 (HTTPS).",
                mail: "Пошта: TCP 25 (SMTP), TCP 110 (POP3), та TCP 143 (IMAP).",
                db: "Бази даних: TCP 3306 (MySQL), TCP 5432 (PostgreSQL)."
            },
            global: "Виявлення блокувань фаєрволом",
            globalDesc: "Глобальна перевірка портів переконує, що ваші сервіси не заблоковані регіональними провайдерами або невірними правилами безпеки на сервері."
        },
        ipInfo: {
            title: "Детальна інформація про IP та геолокацію",
            understanding: "Що таке IP-аналітика?",
            understandingDesc: "Інструмент витягує метадані, пов'язані з IP-адресою чи доменом. Це включає географічні координати, інтернет-провайдера (ISP) та номер автономної системи (ASN).",
            latency: "Навіщо збирати ці дані?",
            latencyDesc: "Розуміння того, кому належить IP-адреса, важливо для адміністрування:",
            latencyList: {
                security: "Безпека: Розслідування підозрілого трафіку чи спроб злому.",
                routing: "Маршрутизація: Перевірка BGP та розподілу вузлів CDN.",
                compliance: "Комплаєнс: Гарантія того, що дані обробляються в правильній країні."
            },
            global: "Пошук власників та повідомлення про спам",
            globalDesc: "Крім розташування, база WHOIS надає контакти адміністраторів мережі, куди можна скаржитися на мережеві атаки (abuse) чи розсилку спаму."
        },
        ssl: {
            title: "Перевірка SSL/TLS сертифіката",
            understanding: "Що перевіряє SSL/TLS тест?",
            understandingDesc: "SSL/TLS перевірка аналізує сертифікат безпеки сайту, підтверджуючи його дійсність, довіреність основними браузерами та строк дії. Вона показує центр сертифікації (CA), дату закінчення дії та рівень шифрування.",
            latency: "Навіщо моніторити SSL-сертифікат?",
            latencyDesc: "Прострочений або неправильно налаштований SSL-сертифікат викликає попередження безпеки в браузері, миттєво блокуючи відвідувачів. Проактивний моніторинг запобігає несподіваним збоям.",
            latencyList: {
                expiry: "Закінчення терміну дії: Сертифікати мають термін дії. Прострочений сертифікат миттєво ламає HTTPS для всіх відвідувачів.",
                chain: "Ланцюжок довіри: Зламаний ланцюжок (відсутній проміжний сертифікат) викликає попередження у деяких браузерах.",
                cipher: "Набір шифрів: Слабкі алгоритми шифрування (RC4, MD5) відкривають вразливості для атак типу 'людина посередині'."
            },
            global: "Глобальна перевірка сертифікатів",
            globalDesc: "Через CDN або GeoDNS різні регіони можуть звертатись до різних серверів. Глобальна перевірка SSL підтверджує, що всі edge-сервери мають дійсний сертифікат, а не лише ваш локальний резолвер."
        }
    },
    ru: {
        ping: {
            title: "Что такое Ping-тест и как он работает?",
            understanding: "Понимание команды Ping",
            understandingDesc: "Ping-тест - базовый инструмент для проверки доступности хоста в IP-сети. Он отправляет запросы ICMP Echo Request к цели и ожидает ответа.",
            latency: "Зачем измерять задержку сети?",
            latencyDesc: "Время, за которое пакеты проходят путь туда и обратно (RTT), называется задержкой и измеряется в миллисекундах (мс). Высокая задержка замедляет загрузку.",
            latencyList: {
                fast: "Быстро (0-50 мс): Отличное соединение, идеально для реального времени.",
                acceptable: "Приемлемо (50-150 мс): Хорошее соединение для веб-серфинга.",
                slow: "Медленно (>150 мс): Заметная задержка, влияющая на интерактивность."
            },
            global: "Важность глобальных проверок",
            globalDesc: "Проверка из одной локации не показывает полную картину. Глобальный ping-тест позволяет проверить эффективность маршрутизации и выявить сбои."
        },
        http: {
            title: "HTTP-проверка: контроль доступности сайта",
            understanding: "Как работают HTTP-запросы",
            understandingDesc: "HTTP-проверка имитирует реальный браузер. Она убеждается, что сайт онлайн, возвращает правильный код (например, 200 OK) и измеряет время загрузки.",
            latency: "Мониторинг времени ответа",
            latencyDesc: "Скорость сайта критична для пользователей и SEO. Долгий ответ сервера (TTFB) или медленный DNS отпугивают людей.",
            latencyList: {
                fast: "Быстро (0-500 мс): Отличная скорость сервера и оптимизированный канал.",
                acceptable: "Средне (500-1500 мс): Нормальное время, но можно улучшить кэшированием.",
                slow: "Медленно (>1500 мс): Плохой опыт, возможно перегрузка сервера."
            },
            global: "Зачем проверять со всего мира?",
            globalDesc: "Ваш сервер в Европе может быстро работать, но не открываться в Азии. Глобальная проверка выявляет ошибки CDN и региональные блокировки."
        },
        dns: {
            title: "Глобальная проверка обновления DNS",
            understanding: "Как работают DNS-запросы",
            understandingDesc: "DNS преобразует домены в IP-адреса. Запрос обращается к серверам имен для получения записей (A, AAAA, MX, CNAME, TXT) вашего домена.",
            latency: "Ключевые DNS-записи",
            latencyDesc: "Различные записи выполняют конкретные функции в архитектуре:",
            latencyList: {
                a: "A и AAAA: Связывает домен с адресом IPv4 (A) или IPv6 (AAAA).",
                mx: "MX: Направляет почту на правильный почтовый сервер.",
                txt: "TXT: Хранит текстовые данные для безопасности почты (SPF, DKIM, DMARC)."
            },
            global: "Разрешение DNS в мире",
            globalDesc: "При смене хостинга новый IP должен обновиться в кэшах глобальных DNS. Инструмент проверяет серверы, чтобы убедиться, что сайт доступен везде."
        },
        mtr: {
            title: "MTR: Детальная диагностика маршрута сети",
            understanding: "Что такое MTR?",
            understandingDesc: "MTR объединяет функции утилит traceroute и ping в одном инструменте. Он исследует полный путь между сервером и конечным хостом.",
            latency: "Анализ каждого узла (Hop)",
            latencyDesc: "Постоянно отправляя пакеты каждому маршрутизатору на пути, MTR предоставляет статистику качества сети в реальном времени.",
            latencyList: {
                loss: "Потеря пакетов (%): Высокие потери указывают на перегрузку промежуточного роутера.",
                ping: "Задержка: Внезапные скачки времени отклика показывают, где возникает торможение.",
                routing: "Маршрутизация: Позволяет увидеть, оптимальным ли путем идет трафик."
            },
            global: "Поиск узких мест",
            globalDesc: "Когда пользователи жалуются на обрывы связи, MTR показывает, где именно разрыв: у провайдера, на магистральной линии или в дата-центре."
        },
        tcpUdp: {
            title: "Проверка доступности TCP и UDP портов",
            understanding: "Как работает проверка портов",
            understandingDesc: "Тест проверяет статус сетевых портов. TCP устанавливает надежное соединение с подтверждением, тогда как UDP просто отправляет данные.",
            latency: "Популярные сценарии использования",
            latencyDesc: "Проверка портов обязательна при настройке брандмауэров и запуске новых сервисов.",
            latencyList: {
                web: "Веб-сервисы: TCP 80 (HTTP) и TCP 443 (HTTPS).",
                mail: "Почта: TCP 25 (SMTP), TCP 110 (POP3) и TCP 143 (IMAP).",
                db: "Базы данных: TCP 3306 (MySQL), TCP 5432 (PostgreSQL)."
            },
            global: "Выявление блокировок брандмауэром",
            globalDesc: "Глобальная проверка портов убеждается, что ваши сервисы не заблокированы провайдерами или неверными правилами безопасности."
        },
        ipInfo: {
            title: "Детальная информация о IP и геолокации",
            understanding: "Что такое IP-аналитика?",
            understandingDesc: "Инструмент извлекает метаданные, связанные с IP-адресом. Это включает географические координаты, интернет-провайдера (ISP) и номер системы (ASN).",
            latency: "Зачем собирать эти данные?",
            latencyDesc: "Понимание того, кому принадлежит адрес, важно для администрирования:",
            latencyList: {
                security: "Безопасность: Расследование попыток взлома.",
                routing: "Маршрутизация: Проверка BGP и распределения узлов CDN.",
                compliance: "Комплаенс: Гарантия обработки данных в правильной стране."
            },
            global: "Поиск владельцев",
            globalDesc: "Помимо расположения, база WHOIS предоставляет контакты администраторов сети, куда можно жаловаться на сетевые атаки или рассылку спама."
        },
        ssl: {
            title: "Проверка SSL/TLS сертификата",
            understanding: "Что проверяет SSL/TLS тест?",
            understandingDesc: "SSL/TLS проверка анализирует сертификат безопасности сайта, подтверждая его действительность, доверие основными браузерами и срок действия. Она показывает центр сертификации (CA), дату окончания и уровень шифрования.",
            latency: "Зачем мониторить SSL-сертификат?",
            latencyDesc: "Просроченный или неправильно настроенный SSL-сертификат вызывает предупреждения безопасности в браузере, мгновенно блокируя посетителей. Проактивный мониторинг предотвращает неожиданные сбои.",
            latencyList: {
                expiry: "Истечение срока: Сертификаты имеют срок действия. Просроченный сертификат мгновенно ломает HTTPS для всех посетителей.",
                chain: "Цепочка доверия: Сломанная цепочка (отсутствует промежуточный сертификат) вызывает предупреждение в некоторых браузерах.",
                cipher: "Набор шифров: Слабые алгоритмы шифрования (RC4, MD5) открывают уязвимости для атак типа 'человек посередине'."
            },
            global: "Глобальная проверка сертификатов",
            globalDesc: "Из-за CDN или GeoDNS разные регионы могут обращаться к разным серверам. Глобальная проверка SSL подтверждает наличие действительного сертификата на всех edge-серверах, а не только на вашем локальном резолвере."
        }
    }
};

files.forEach(file => {
    const langCode = file.replace('.json', '');
    const filePath = path.join(messagesDir, file);

    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Ensure correct site name branding
        content = content.replace(/CheckHost\.top/g, 'CheckNode');
        content = content.replace(/CheckHost/g, 'CheckNode');

        const data = JSON.parse(content);

        // Choose appropriate translation, fallback to English
        data.ToolSeoContent = translations[langCode] || translations.en;

        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        console.log(`Updated ToolSeoContent in ${file}`);
    } catch (err) {
        console.error(`Error processing ${file}:`, err);
    }
});
