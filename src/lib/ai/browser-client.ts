/**
 * Utility for making browser-like requests to AI providers.
 * Spoofs Windows 11 + Chrome User-Agent as requested.
 */

export const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

export interface BrowserRequestOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    cookie?: string;
    bearer?: string;
}

export async function fetchWithBrowserSpoof(url: string, options: BrowserRequestOptions = {}) {
    const headers: Record<string, string> = {
        'User-Agent': BROWSER_USER_AGENT,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        ...options.headers,
    };

    if (options.cookie) {
        headers['Cookie'] = options.cookie;
    }

    if (options.bearer) {
        headers['Authorization'] = `Bearer ${options.bearer}`;
    }

    const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers,
    };

    if (options.body) {
        fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
    }

    return fetch(url, fetchOptions);
}
