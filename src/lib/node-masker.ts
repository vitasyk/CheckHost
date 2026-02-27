export const MASKED_DOMAIN = '.node.network';
export const ORIGINAL_DOMAIN = '.node.check-host.net';

/**
 * Masks node.check-host.net with node.network in any JSON-serializable object
 */
export function maskNodes<T>(data: T): T {
    if (!data) return data;

    // Convert to string, replace, and parse back
    // This is the safest way to replace keys and values deep in the object
    const strData = JSON.stringify(data);
    const maskedStr = strData.replaceAll(ORIGINAL_DOMAIN, MASKED_DOMAIN);
    return JSON.parse(maskedStr);
}

/**
 * Unmasks node.network to node.check-host.net in a URL query string
 */
export function unmaskUrl(urlOrQuery: string): string {
    if (!urlOrQuery) return urlOrQuery;
    return urlOrQuery.replaceAll(MASKED_DOMAIN, ORIGINAL_DOMAIN);
}
