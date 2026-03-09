import { routing } from '@/i18n/routing';

/**
 * Генерує об'єкт alternates для Next.js Metadata.
 * Створює правильні canonical URL та languages/hreflang URL для всіх підтримуваних мов.
 * 
 * @param path Шлях сторінки без локалі (наприклад, '/ping', '/about', або '/' для головної)
 * @param siteUrl Базовий URL сайту (наприклад, 'https://checknode.io')
 * @returns Об'єкт alternates для Metadata
 */
export function generateAlternates(path: string, siteUrl: string) {
    // Нормалізація шляху (видалення зайвих слешів)
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const cleanPath = normalizedPath === '/' ? '' : normalizedPath;

    const languages: Record<string, string> = {};

    routing.locales.forEach((loc) => {
        // Форматування локалі для hreflang (наприклад, 'en' -> 'en-US', 'uk' -> 'uk-UA')
        let hreflangCode: string = loc;
        switch (loc) {
            case 'en': hreflangCode = 'en-US'; break;
            case 'uk': hreflangCode = 'uk-UA'; break;
            case 'ru': hreflangCode = 'ru-RU'; break;
            case 'es': hreflangCode = 'es-ES'; break;
            case 'fr': hreflangCode = 'fr-FR'; break;
            case 'de': hreflangCode = 'de-DE'; break;
            case 'it': hreflangCode = 'it-IT'; break;
            case 'nl': hreflangCode = 'nl-NL'; break;
            case 'pl': hreflangCode = 'pl-PL'; break;
        }

        // Побудова URL для кожної локалі
        // Згідно з налаштуваннями routing: defaultLocale 'en' не має префікса
        const localePrefix = loc === routing.defaultLocale ? '' : `/${loc}`;
        const url = `${siteUrl}${localePrefix}${cleanPath}` || `${siteUrl}/`;

        languages[hreflangCode] = url;
    });

    // Важливо: додаємо x-default, який вказує на мову за замовчуванням (у нашому випадку англійську без префіксу)
    languages['x-default'] = `${siteUrl}${cleanPath}` || `${siteUrl}/`;

    return {
        // Канонічний URL за замовчуванням завжди вказує на поточний шлях (який передається у generateMetadata або визначається відносно)
        // Next.js автоматично перетворить його на абсолютний URL, якщо задано metadataBase (в layout)
        canonical: cleanPath || '/',
        languages,
    };
}
