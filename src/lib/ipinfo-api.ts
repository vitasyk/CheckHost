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

export async function resolveHostToIp(host: string): Promise<string | null> {
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

    // Fallback: return null so the caller knows resolution failed
    return null;
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
 * Fetch Name Servers for a domain using DNS-over-HTTPS
 */
export async function resolveNameservers(domain: string): Promise<string[]> {
    try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=NS`, {
            signal: AbortSignal.timeout(3000)
        });

        if (!response.ok) return [];

        const data = await response.json();
        if (data.Answer && data.Answer.length > 0) {
            // NS record is type 2
            return data.Answer
                .filter((ans: any) => ans.type === 2)
                .map((ans: any) => ans.data.replace(/\.$/, ''));
        }
    } catch (error) {
        console.error(`Nameserver resolution failed for ${domain}:`, error);
    }

    return [];
}

/**
 * Fetch RDAP information from rdap.org (WHOIS JSON)
 */
export async function fetchRdapInfo(query: string): Promise<any> {
    const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$|^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/.test(query);
    const type = isIp ? 'ip' : 'domain';

    // List of RDAP servers to try
    const servers = [`https://rdap.org/${type}/${query}`];

    // Add TLD-specific fallbacks for common TLDs if not already covered
    if (!isIp) {
        const tld = query.split('.').pop()?.toLowerCase();
        if (tld === 'co') servers.push(`https://rdap.nic.co/domain/${query}`);
        if (tld === 'io') servers.push(`https://rdap.nic.io/domain/${query}`);
        if (tld === 'me') servers.push(`https://rdap.me/domain/${query}`);
    }

    for (const url of servers) {
        try {
            console.log(`[RDAP] Fetching from ${url}...`);
            const response = await fetch(url, {
                headers: { 'Accept': 'application/rdap+json, application/json' },
                signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
                const data = await response.json();
                if (data && !data.error) return data;
            }
        } catch (error) {
            console.warn(`RDAP fetch failed for ${url}:`, error instanceof Error ? error.message : error);
        }
    }

    return null;
}

/**
 * Fetch WHOIS info via TCP port 43 as a fallback when RDAP is unavailable.
 * Returns a structured object compatible with parseRdapData expectations.
 */
export async function fetchWhoisInfo(domain: string): Promise<any> {
    const net = require('net');

    // Map TLD to WHOIS server
    const tld = domain.split('.').pop()?.toLowerCase() || '';
    const whoisServers: Record<string, string> = {
        'com': 'whois.verisign-grs.com',
        'net': 'whois.verisign-grs.com',
        'org': 'whois.pir.org',
        'co': 'whois.nic.co',
        'io': 'whois.nic.io',
        'me': 'whois.nic.me',
        'biz': 'whois.biz',
        'info': 'whois.afilias.net',
        'ua': 'whois.ua',
    };

    const primaryServer = whoisServers[tld] || `whois.nic.${tld}`;
    const allServers = [primaryServer, 'whois.iana.org', 'whois.internic.net'];

    for (const server of allServers) {
        try {
            let resText = await queryWhoisServer(server, domain, net);
            if (!resText) continue;

            // Handle IANA referral
            if (server === 'whois.iana.org') {
                const referLine = resText.split('\n').find(l => l.toLowerCase().startsWith('refer:') || l.toLowerCase().startsWith('whois:'));
                if (referLine) {
                    const referredServer = referLine.split(':')[1].trim();
                    if (referredServer && referredServer !== server) {
                        console.log(`[WHOIS] Following IANA referral to ${referredServer} for ${domain}`);
                        const referredData = await queryWhoisServer(referredServer, domain, net).catch(() => null);
                        if (referredData) resText = referredData;
                    }
                }
            }

            const parsed = parseWhoisText(resText, domain);
            if (parsed) return parsed;
        } catch (e) {
            console.warn(`WHOIS query failed for ${server}:`, e instanceof Error ? e.message : e);
        }
    }

    return null;
}

/**
 * Low-level TCP query to a WHOIS server
 */
async function queryWhoisServer(server: string, domain: string, net: any): Promise<string | null> {
    return new Promise((resolve, reject) => {
        let data = '';
        const socket = new net.Socket();
        const timeout = setTimeout(() => {
            socket.destroy();
            resolve(null);
        }, 10000);

        socket.connect(43, server, () => {
            socket.write(domain + '\r\n');
        });

        socket.on('data', (chunk: Buffer) => {
            data += chunk.toString();
        });

        socket.on('end', () => {
            clearTimeout(timeout);
            resolve(data);
        });

        socket.on('error', (err: any) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}

/**
 * Parse raw WHOIS text into a structured object compatible with RDAP viewer.
 */
function parseWhoisText(text: string, domain: string): any {
    const lines = text.split('\n');
    const result: any = {
        objectClassName: 'domain',
        ldhName: domain,
        name: domain,
        handle: domain,
        status: [] as string[],
        events: [] as any[],
        entities: [] as any[],
        nameservers: [] as any[],
        _whoisRaw: text,
    };

    const fieldMap: Record<string, string> = {};

    for (const line of lines) {
        const match = line.match(/^\s*([^:]+):\s*(.+)\s*$/);
        if (!match) continue;
        const key = match[1].trim().toLowerCase();
        const value = match[2].trim();

        // Registrar
        if (key.includes('registrar') && !key.includes('url') && !key.includes('abuse') && !key.includes('whois') && !key.includes('iana')) {
            if (!fieldMap['registrar']) fieldMap['registrar'] = value;
        }

        // Registrar URL
        if (key.includes('registrar url') || key === 'referral url') {
            fieldMap['registrar_url'] = value;
        }

        // Dates
        if (key.includes('creation date') || key.includes('registered') || key === 'created') {
            fieldMap['creation_date'] = value;
        }
        if (key.includes('expir') || key.includes('registry expiry')) {
            fieldMap['expiration_date'] = value;
        }
        if (key.includes('updated date') || key.includes('last updated') || key.includes('last modified')) {
            fieldMap['updated_date'] = value;
        }

        // Status
        if (key.includes('domain status') || key === 'status') {
            const statusValue = value.split(' ')[0]; // "clientTransferProhibited https://..." -> "clientTransferProhibited"
            result.status.push(statusValue);
        }

        // Nameservers
        if (key.includes('name server') || key === 'nserver' || key === 'nameserver') {
            result.nameservers.push({ ldhName: value.toLowerCase() });
        }

        // Abuse email
        if (key.includes('abuse') && key.includes('email')) {
            fieldMap['abuse_email'] = value;
        }
        if (key.includes('abuse') && key.includes('phone')) {
            fieldMap['abuse_phone'] = value;
        }
    }

    // Build events array
    if (fieldMap['creation_date']) {
        result.events.push({ eventAction: 'registration', eventDate: fieldMap['creation_date'] });
    }
    if (fieldMap['expiration_date']) {
        result.events.push({ eventAction: 'expiration', eventDate: fieldMap['expiration_date'] });
    }
    if (fieldMap['updated_date']) {
        result.events.push({ eventAction: 'last changed', eventDate: fieldMap['updated_date'] });
    }

    // Build entities (registrar)
    if (fieldMap['registrar']) {
        const registrarEntity: any = {
            objectClassName: 'entity',
            roles: ['registrar'],
            vcardArray: ['vcard', [['fn', {}, 'text', fieldMap['registrar']]]],
        };
        if (fieldMap['registrar_url']) {
            registrarEntity.publicIds = [{ identifier: fieldMap['registrar_url'] }];
        }
        result.entities.push(registrarEntity);
    }

    // Abuse contact entity
    if (fieldMap['abuse_email'] || fieldMap['abuse_phone']) {
        const abuseEntity: any = {
            objectClassName: 'entity',
            roles: ['abuse'],
            vcardArray: ['vcard', [
                ['fn', {}, 'text', 'Abuse Contact'],
                ...(fieldMap['abuse_email'] ? [['email', {}, 'text', fieldMap['abuse_email']]] : []),
                ...(fieldMap['abuse_phone'] ? [['tel', {}, 'text', fieldMap['abuse_phone']]] : []),
            ]],
        };
        result.entities.push(abuseEntity);
    }

    // If we got no useful data, return null
    if (!fieldMap['registrar'] && result.status.length === 0 && result.events.length === 0) {
        return null;
    }

    return result;
}
