import { getIpInfoConfig } from './ipinfo-config';
import { lookupLocalIpInfo, isLocalDbAvailable } from './ipinfo-local';

const IPINFO_API_BASE = 'https://api.ipinfo.io/lite';

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
    accuracy_radius?: number;
}

/**
 * Fetch IP information from IPInfo.io API
 */
async function fetchFromApi(ip: string, token: string): Promise<IpInfoLiteResponse> {
    const url = `${IPINFO_API_BASE}/${ip}?token=${token}`;

    const response = await fetch(url, {
        signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) {
        throw new Error(`IPInfo API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch IP information from IPGeolocation.io API
 */
export async function fetchFromIpGeolocation(ip: string): Promise<any> {
    const config = getIpInfoConfig();
    const url = `https://api.ipgeolocation.io/ipgeo?apiKey=${config.ipGeolocationApiKey}&ip=${ip}`;

    const response = await fetch(url, {
        signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) {
        throw new Error(`IPGeolocation API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
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
export async function fetchIpInfo(ip: string): Promise<IpInfoLiteResponse> {
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
                return fetchFromApi(ip, config.apiToken);
            }

            throw new Error('Local DB lookup failed and API fallback is disabled');

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

            return fetchFromApi(ip, config.apiToken);

        case 'api':
        default:
            // Use API directly (current default)
            try {
                return await fetchFromApi(ip, config.apiToken);
            } catch (err) {
                // Try local DB as fallback if enabled
                if (config.enableLocalFallback && isLocalDbAvailable()) {
                    console.log('API failed, falling back to local DB');
                    const localResult = await lookupLocalIpInfo(ip);
                    if (localResult) return localResult;
                }
                throw err;
            }
    }
}

export async function resolveHostToIp(host: string): Promise<string> {
    // Try to detect if it's already an IP
    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(host)) {
        return host;
    }

    // For hostnames, we'll use a simple DNS-over-HTTPS service
    try {
        const response = await fetch(`https://dns.google/resolve?name=${host}&type=A`);
        const data = await response.json();

        if (data.Answer && data.Answer.length > 0) {
            return data.Answer[0].data;
        }
    } catch (error) {
        console.error('Failed to resolve hostname:', error);
    }

    // Fallback: return the original host
    return host;
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
