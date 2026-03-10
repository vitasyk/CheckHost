import { routing } from '@/i18n/routing';

/**
 * Генерує об'єкт alternates для Next.js Metadata.
 * Створює canonical URL та hreflang URL для всіх підтримуваних мов.
 *
 * @param path Шлях сторінки БЕЗ локалі та БЕЗ починаючого слеша (наприклад, 'ssl', 'ping', 'blog/my-post').
 *             Для головної сторінки передайте '' або '/'.
 * @param siteUrl Базовий URL сайту (наприклад, 'https://checknode.io')
 * @param currentLocale Поточна локаль (наприклад, 'uk', 'en')
 * @returns Об'єкт alternates для Metadata
 */
export function generateAlternates(path: string, siteUrl: string, currentLocale?: string) {
    const base = siteUrl.replace(/\/$/, ''); // видалити кінцевий слеш

    // Нормалізуємо шлях сторінки (без локалі, без початкового / і без кінцевого /)
    const cleanPath = path
        .replace(/^\/+/, '') // прибрати початкові слеші
        .replace(/\/+$/, ''); // прибрати кінцеві слеші

    // Шлях сторінки для URL-ів (порожній для головної сторінки)
    const pagePath = cleanPath ? `/${cleanPath}` : '';

    const languages: Record<string, string> = {};

    routing.locales.forEach((loc) => {
        // Відображення коротких кодів на IETF BCP 47 (з регіоном) для hreflang
        const hreflangMap: Record<string, string> = {
            en: 'en-US',
            uk: 'uk-UA',
            ru: 'ru-RU',
            es: 'es-ES',
            fr: 'fr-FR',
            de: 'de-DE',
            it: 'it-IT',
            nl: 'nl-NL',
            pl: 'pl-PL',
        };
        const hreflangCode = hreflangMap[loc] ?? loc;

        // Мова за замовчуванням (en) — без префікса в URL
        const localePrefix = loc === routing.defaultLocale ? '' : `/${loc}`;
        const url = `${base}${localePrefix}${pagePath}` || `${base}/`;

        languages[hreflangCode] = url;
    });

    // x-default — вказує на версію мови за замовчуванням (без префікса)
    languages['x-default'] = `${base}${pagePath}` || `${base}/`;

    // Canonical — абсолютний URL поточної локалі
    const canonicalLocalePrefix = currentLocale && currentLocale !== routing.defaultLocale
        ? `/${currentLocale}`
        : '';
    const canonical = `${base}${canonicalLocalePrefix}${pagePath}` || `${base}/`;

    return {
        canonical,
        languages,
    };
}
