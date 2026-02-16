import { getIpInfoConfig } from './ipinfo-config';
import { lookupLocalIpInfo, isLocalDbAvailable } from './ipinfo-local';

const IPINFO_API_BASE = 'https://ipinfo.io';

export interface IpInfoLiteResponse {
    ip: string;
    asn: string;
    as_name: string;
    as_domain: string;
    country_code: string;
    country: string;
    continent_code: string;
    continent: string;
    city?: string;
    region?: string;
    postal?: string;
    latitude?: number;
    longitude?: number;
    loc?: string;
    timezone?: string;
    anycast?: boolean;
    accuracy_radius?: number;
}

/**
 * Fetch IP information from IPInfo.io API
 */
async function fetchFromApi(ip: string, token: string): Promise<IpInfoLiteResponse | null> {
    if (!token) return null;
    const url = `${IPINFO_API_BASE}/${ip}/json?token=${token}`;
    console.log(`[Diagnostic] IPInfo Fetch: ${url.replace(token, 'REDACTED')}`);

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'no body');
            console.warn(`[Diagnostic] IPInfo skipped (${response.status} ${response.statusText}): ${errorBody}`);
            return null;
        }

        return response.json();
    } catch (error) {
        console.warn('[Diagnostic] IPInfo fetch failed:', error);
        return null;
    }
}

/**
 * Fetch IP information from IPGeolocation.io API
 */
export async function fetchFromIpGeolocation(ip: string): Promise<any> {
    const config = getIpInfoConfig();
    if (!config.ipGeolocationApiKey) return null;

    const url = `https://api.ipgeolocation.io/ipgeo?apiKey=${config.ipGeolocationApiKey}&ip=${ip}`;
    console.log(`[Diagnostic] IPGeolocation Fetch: ${url.replace(config.ipGeolocationApiKey, 'REDACTED')}`);

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'no body');
            console.warn(`[Diagnostic] IPGeolocation skipped (${response.status} ${response.statusText}): ${errorBody}`);
            return null;
        }

        return response.json();
    } catch (error) {
        console.warn('[Diagnostic] IPGeolocation fetch failed:', error);
        return null;
    }
}

/**
 * Fetch IP information from IPIz.net API
 */
export async function fetchFromIpiz(ip: string): Promise<any> {
    const url = `https://api.ipiz.net/${ip}`;

    const response = await fetch(url, {
        signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) {
        throw new Error(`IPIz API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'ok') {
        return null;
    }

    // Transform IPIz response to our standard format
    // Use org_country as fallback if main country fields are empty (common for some IPs like Cloudflare)
    return {
        ip: data.ip,
        asn: data.asn?.toString() || '',
        as_name: data.org_name || '',
        as_domain: '',
        country_code: data.country_code || data.org_country_code || '',
        country: data.country || data.org_country || '',
        continent_code: data.continent_code || '',
        continent: data.continent || '',
        city: data.city || '',
        region: data.region || '',
        postal: data.postal || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        accuracy_radius: 0,
        org: data.org_name || '',
        timezone: data.timezone || ''
    };
}

/**
 * Fetch IP information from MaxMind GeoIP Web Services (now using IPIz.net as source)
 */
export async function fetchFromMaxMind(ip: string): Promise<any> {
    try {
        // As per user request, we use IPIz.net but keep it under the MaxMind label
        return await fetchFromIpiz(ip);
    } catch (error) {
        console.error('Failed to fetch from IPIz (MaxMind fallback):', error);
        return null;
    }
}

/**
 * Main function to fetch IP information
 * Supports multiple data sources based on configuration
 */
export async function fetchIpInfo(ip: string): Promise<IpInfoLiteResponse | null> {
    const config = getIpInfoConfig();

    // Strategy based on configured data source
    switch (config.dataSource) {
        case 'local':
            // Try local DB first
            if (isLocalDbAvailable()) {
                const localResult = await lookupLocalIpInfo(ip);
                if (localResult) return localResult;
            }

            // Fallback to API if enabled
            if (config.enableApiFallback) {
                console.log('Local lookup failed, falling back to API');
                const apiResult = await fetchFromApi(ip, config.apiToken);
                if (apiResult) return apiResult;
            }

            console.warn('Local DB lookup failed and API fallback is disabled');
            return null;

        case 'hybrid':
            // Try local first, then API
            if (isLocalDbAvailable()) {
                try {
                    const localResult = await lookupLocalIpInfo(ip);
                    if (localResult) return localResult;
                } catch (err) {
                    console.warn('Local lookup error, trying API:', err);
                }
            }

            const hybridResult = await fetchFromApi(ip, config.apiToken);
            if (hybridResult) return hybridResult;
            console.warn('Hybrid lookup failed: both local DB and API failed');
            return null;

        case 'api':
        default:
            // Use API directly (current default)
            try {
                const result = await fetchFromApi(ip, config.apiToken);
                if (result) return result;

                // If API failed/empty, try local DB as fallback if enabled
                if (config.enableLocalFallback && isLocalDbAvailable()) {
                    console.log('API failed or missing token, falling back to local DB');
                    const localResult = await lookupLocalIpInfo(ip);
                    if (localResult) return localResult;
                }

                return null;
            } catch (err) {
                // Try local DB as fallback if enabled
                if (config.enableLocalFallback && isLocalDbAvailable()) {
                    console.warn('API fetch error, falling back to local DB:', err);
                    const localResult = await lookupLocalIpInfo(ip);
                    if (localResult) return localResult;
                }
                return null;
            }
    }
}

export async function resolveHostToIp(host: string): Promise<string> {
    // Basic sanitization: remove http://, https://, and trailing paths
    let cleanedHost = host
        .replace(/^https?:\/\//i, '') // Remove protocol
        .split('/')[0]                // Remove path/query
        .split(':')[0]                // Remove port if present
        .trim();

    // Try to detect if it's already an IP
    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(cleanedHost)) {
        return cleanedHost;
    }

    // For hostnames, we'll use a simple DNS-over-HTTPS service
    try {
        const response = await fetch(`https://dns.google/resolve?name=${cleanedHost}&type=A`);
        const data = await response.json();

        if (data.Answer && data.Answer.length > 0) {
            // Find the first actual IP address in the answer chain
            // Type 1 is A record (IPv4)
            const aRecord = data.Answer.find((ans: any) => ans.type === 1);
            if (aRecord) {
                return aRecord.data;
            }

            // If no A record but we have answers, return the last one (might be another CNAME or specialized record)
            // But usually we want an IP for the providers to work correctly.
            const lastRecord = data.Answer[data.Answer.length - 1];
            if (lastRecord && lastRecord.data) {
                // Strip trailing dot if present
                return lastRecord.data.replace(/\.$/, '');
            }
        }
    } catch (error) {
        console.error('Failed to resolve hostname:', error);
    }

    // Fallback: return the original host
    return host;
}

/**
 * Resolve an IP address to its hostname using Reverse DNS (PTR)
 */
export async function resolveIpToHost(ip: string): Promise<string | null> {
    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return null;

    // Convert IP to in-addr.arpa format (e.g., 1.2.3.4 -> 4.3.2.1.in-addr.arpa)
    const arpaHost = ip.split('.').reverse().join('.') + '.in-addr.arpa';

    try {
        const response = await fetch(`https://dns.google/resolve?name=${arpaHost}&type=PTR`, {
            signal: AbortSignal.timeout(3000)
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (data.Answer && data.Answer.length > 0) {
            // PTR record is type 12
            const ptrRecord = data.Answer.find((ans: any) => ans.type === 12);
            if (ptrRecord && ptrRecord.data) {
                // Remove trailing dot
                return ptrRecord.data.replace(/\.$/, '');
            }
        }
    } catch (error) {
        console.error(`Reverse DNS lookup failed for ${ip}:`, error);
    }

    return null;
}

/**
 * Fetch RDAP information from rdap.org (WHOIS JSON)
 */
export async function fetchRdapInfo(query: string): Promise<any> {
    const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$|^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/.test(query);
    const type = isIp ? 'ip' : 'domain';
    const url = `https://rdap.org/${type}/${query}`;

    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/rdap+json, application/json' },
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) return null;

        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch RDAP for ${query}:`, error);
        return null;
    }
}
