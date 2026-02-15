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
    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`, {
            signal: AbortSignal.timeout(3000)
        });

        if (!response.ok) {
            throw new Error(`IP-API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status === 'fail') {
            console.warn('IP-API failed:', data.message);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Failed to fetch from ip-api.com:', error);
        return null;
    }
}
