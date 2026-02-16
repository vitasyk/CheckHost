import { IpInfoResponse } from '@/types/ip-info';
import { fetchIpInfo, resolveHostToIp, fetchFromIpGeolocation, fetchFromMaxMind, fetchRdapInfo, resolveIpToHost } from './ipinfo-api';
import { fetchIpApiData } from './ipapi-api';
import { lookupLocalIpInfo } from './ipinfo-local';

export async function getMockIpInfo(host: string): Promise<IpInfoResponse> {
    // Resolve hostname to IP
    const ip = await resolveHostToIp(host);
    const isIpInput = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);

    // Fetch data from multiple sources in parallel
    const [realIpInfo, ipApiData, ipGeoData, maxmindData, localMmdbData, rdapData, ptrHost] = await Promise.all([
        fetchIpInfo(ip).catch(err => {
            console.warn('IPInfo data skipped:', err.message);
            return null;
        }),
        fetchIpApiData(ip).catch(err => {
            console.warn('IP-API data skipped:', err.message);
            return null;
        }),
        fetchFromIpGeolocation(ip).catch(err => {
            console.warn('IPGeolocation data skipped:', err.message);
            return null;
        }),
        fetchFromMaxMind(ip).catch(err => {
            console.warn('MaxMind data skipped:', err.message);
            return null;
        }),
        lookupLocalIpInfo(ip).catch(err => {
            console.warn('Local MMDB lookup skipped:', err.message);
            return null;
        }),
        fetchRdapInfo(host).catch(err => {
            console.warn('RDAP data skipped:', err.message);
            return null;
        }),
        // Always try to resolve PTR for the IP address
        resolveIpToHost(ip).catch(() => null)
    ]);

    const isGoogle = host.toLowerCase().includes('google') || ip === '8.8.8.8';
    const isCloudflare = host.includes('cloudflare') || ip === '1.1.1.1';

    // Priority: PTR record > API hostname > Input host (if domain) > IP
    const resolvedHostname = ptrHost || realIpInfo?.as_domain || (isIpInput ? null : host);

    return {
        ip: ip,
        hostname: resolvedHostname || (isGoogle ? 'dns.google' : (isCloudflare ? 'one.one.one.one' : ip)),
        providers: {
            // Real IPInfo.io data (from lite API)
            ipinfo: realIpInfo ? {
                ip: realIpInfo.ip,
                hostname: realIpInfo.as_domain || '',
                city: realIpInfo.city || 'N/A',
                region: realIpInfo.region || 'N/A',
                country: realIpInfo.country_code,
                country_name: realIpInfo.country,
                continent: realIpInfo.continent,
                continent_code: realIpInfo.continent_code,
                loc: realIpInfo.latitude && realIpInfo.longitude
                    ? `${realIpInfo.latitude},${realIpInfo.longitude}`
                    : realIpInfo.loc || '0,0',
                org: `${realIpInfo.asn} ${realIpInfo.as_name}`,
                asn: realIpInfo.asn,
                as_name: realIpInfo.as_name,
                as_domain: realIpInfo.as_domain,
                postal: realIpInfo.postal || '',
                timezone: realIpInfo.timezone || '',
                anycast: realIpInfo.anycast || false
            } : undefined,
            // Real IP-API.com data
            ipapi: ipApiData ? {
                status: ipApiData.status,
                country: ipApiData.country,
                countryCode: ipApiData.countryCode,
                region: ipApiData.region,
                regionName: ipApiData.regionName,
                city: ipApiData.city,
                zip: ipApiData.zip,
                lat: ipApiData.lat,
                lon: ipApiData.lon,
                timezone: ipApiData.timezone,
                isp: ipApiData.isp,
                org: ipApiData.org,
                as: ipApiData.as,
                mobile: ipApiData.mobile,
                proxy: ipApiData.proxy,
                hosting: ipApiData.hosting,
                currency: ipApiData.currency
            } : undefined,
            // Simulated data for other providers (populated by real IP-API data if available)
            maxmind: {
                ip: ip,
                country: maxmindData?.country || ipApiData?.country || realIpInfo?.country || "N/A",
                countryCode: maxmindData?.countryCode || ipApiData?.countryCode || realIpInfo?.country_code || "N/A",
                city: maxmindData?.city || ipApiData?.city || "N/A",
                region: maxmindData?.region || ipApiData?.regionName || "N/A",
                postal: maxmindData?.postal || ipApiData?.zip || "N/A",
                latitude: maxmindData?.latitude || ipApiData?.lat || 0,
                longitude: maxmindData?.longitude || ipApiData?.lon || 0,
                accuracyRadius: 0,
                asn: maxmindData?.asn || (realIpInfo?.asn ? parseInt(realIpInfo.asn.replace('AS', '')) : (ipApiData?.as ? parseInt(ipApiData.as.split(' ')[0].replace('AS', '')) : 0)),
                org: maxmindData?.org || realIpInfo?.as_name || ipApiData?.org || "N/A",
                _isReal: !!maxmindData
            },
            dbip: {
                ipAddress: ip,
                continentCode: realIpInfo?.continent_code || ipApiData?.continentCode || "N/A",
                continentName: realIpInfo?.continent || ipApiData?.continent || "N/A",
                countryCode: ipApiData?.countryCode || realIpInfo?.country_code || "N/A",
                countryName: ipApiData?.country || realIpInfo?.country || "N/A",
                stateProv: ipApiData?.regionName || "N/A",
                city: ipApiData?.city || "N/A",
                isp: realIpInfo?.as_name || ipApiData?.isp || "N/A",
                connectionType: ipApiData?.hosting ? "Hosting" : "N/A",
                organization: realIpInfo?.as_name || ipApiData?.org || "N/A"
            },
            ip2location: {
                country_name: ipApiData?.country || realIpInfo?.country || "N/A",
                cntry_code: ipApiData?.countryCode || realIpInfo?.country_code || "N/A",
                region_name: ipApiData?.regionName || "N/A",
                city_name: ipApiData?.city || "N/A",
                latitude: ipApiData?.lat || 0,
                longitude: ipApiData?.lon || 0,
                zip_code: ipApiData?.zip || "N/A",
                time_zone: ipApiData?.timezone || "N/A",
                isp: realIpInfo?.as_name || ipApiData?.isp || "N/A",
                domain: realIpInfo?.as_domain || "N/A",
                net_speed: "N/A",
                idd_code: "N/A",
                area_code: "N/A",
                weather_station_code: "N/A",
                weather_station_name: "N/A",
                mcc: "-",
                mnc: "-",
                mobile_brand: "-",
                elevation: 0,
                usage_type: ipApiData?.hosting ? "DCH" : "N/A"
            },
            ipgeolocation: {
                ip: ip,
                continent_code: ipGeoData?.continent_code || realIpInfo?.continent_code || "N/A",
                continent_name: ipGeoData?.continent_name || realIpInfo?.continent || "N/A",
                country_code2: ipGeoData?.country_code2 || ipApiData?.countryCode || realIpInfo?.country_code || "N/A",
                country_code3: ipGeoData?.country_code3 || (ipApiData?.countryCode || realIpInfo?.country_code) === "US" ? "USA" : (ipApiData?.countryCode || realIpInfo?.country_code || "N/A"),
                country_name: ipGeoData?.country_name || ipApiData?.country || realIpInfo?.country || "N/A",
                country_capital: ipGeoData?.country_capital || "N/A",
                state_prov: ipGeoData?.state_prov || ipApiData?.regionName || "N/A",
                district: ipGeoData?.district || "N/A",
                city: ipGeoData?.city || ipApiData?.city || "N/A",
                zipcode: ipGeoData?.zipcode || ipApiData?.zip || "N/A",
                latitude: ipGeoData?.latitude?.toString() || ipApiData?.lat?.toString() || "0",
                longitude: ipGeoData?.longitude?.toString() || ipApiData?.lon?.toString() || "0",
                is_eu: ipGeoData?.is_eu || false,
                calling_code: ipGeoData?.calling_code || "N/A",
                country_tld: ipGeoData?.country_tld || "N/A",
                languages: ipGeoData?.languages || "N/A",
                country_flag: ipGeoData?.country_flag || "",
                isp: ipGeoData?.isp || realIpInfo?.as_name || ipApiData?.isp || "N/A",
                connection_type: ipGeoData?.connection_type || (ipApiData?.mobile ? "mobile" : "N/A"),
                organization: ipGeoData?.organization || realIpInfo?.as_name || ipApiData?.org || "N/A",
                currency: {
                    code: ipGeoData?.currency?.code || ipApiData?.currency || "N/A",
                    name: ipGeoData?.currency?.name || "N/A",
                    symbol: ipGeoData?.currency?.symbol || ""
                },
                time_zone: {
                    name: ipGeoData?.time_zone?.name || ipApiData?.timezone || "N/A",
                    offset: ipGeoData?.time_zone?.offset || ipApiData?.offset || 0,
                    current_time: ipGeoData?.time_zone?.current_time || "N/A"
                }
            },
            maxmind_local: localMmdbData ? {
                country: localMmdbData.country || "N/A",
                countryCode: localMmdbData.country_code || "N/A",
                city: localMmdbData.city || "N/A",
                region: localMmdbData.region || "N/A",
                postal: localMmdbData.postal || "N/A",
                latitude: localMmdbData.latitude || 0,
                longitude: localMmdbData.longitude || 0,
                accuracyRadius: localMmdbData.accuracy_radius || 0,
                asn: localMmdbData.asn ? parseInt(localMmdbData.asn.replace('AS', '')) : 0,
                org: localMmdbData.as_name || "N/A",
                _isReal: true
            } : undefined
        },
        rdapRawData: rdapData
    };
}
