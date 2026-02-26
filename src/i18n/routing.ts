import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['en', 'uk', 'es', 'de', 'fr', 'ru', 'nl', 'pl', 'it'],

    // Used when no locale matches
    defaultLocale: 'en',

    // Optionally, you can configure locale prefixing
    localePrefix: 'as-needed' // Only prefixes for non-default locale e.g /de/ping, but /ping for EN
});
