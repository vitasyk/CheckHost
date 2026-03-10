/**
 * ip-api.com Geolocation API Client
 * 
 * Provides rich geolocation data including city, region, zip, and coordinates.
 * Free for non-commercial use, 45 requests per minute limit.
 */

export interface IpApiResponse {
    status: 'success' | 'fail';
    message?: string;
    query: string;
    continent: string;
    continentCode: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    offset: number;
    currency: string;
    isp: string;
    org: string;
    as: string;
    asname: string;
    reverse: string;
    mobile: boolean;
    proxy: boolean;
    hosting: boolean;
}

/**
 * Fetch geolocation data from ip-api.com
 */
export async function fetchIpApiData(ip: string): Promise<IpApiResponse | null> {
    // Skip local/reserved IPs
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return null;
    }

    const maxRetries = 2;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`, {
                signal: controller.signal
            });

            clearTimeout(id);

            if (!response.ok) {
                throw new Error(`Location lookup error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.status === 'fail') {
                console.warn('IP-API failed:', data.message);
                return null;
            }

            return data;
        } catch (error) {
            if (i < maxRetries) {
                const delay = Math.pow(2, i) * 1000;
                console.log(`[Diagnostic] IP-API retry ${i + 1}/${maxRetries} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('Failed to fetch from ip-api.com after retries:', error);
                return null;
            }
        }
    }
    return null;
}
