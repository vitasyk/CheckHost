import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }

    const finalLocale = locale as string;

    // Use dynamic import instead of fs to support Edge Runtime
    const messages = (await import(`../../messages/${finalLocale}.json`)).default;

    return {
        locale: finalLocale,
        messages
    };
});
