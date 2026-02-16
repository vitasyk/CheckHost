/**
 * IPInfo Data Source Configuration
 * 
 * This module manages the configuration for IP information lookup sources.
 * Currently supports API-based lookup with future support for local database.
 */

export type IpInfoDataSource = 'api' | 'local' | 'hybrid';

export interface IpInfoConfig {
    /** Primary data source for IP lookups */
    dataSource: IpInfoDataSource;

    /** IPInfo.io API token */
    apiToken: string;

    /** Path to local IPInfo lite database (for future use) */
    localDbPath?: string;

    /** Enable fallback to API if local lookup fails */
    enableApiFallback: boolean;

    /** Enable fallback to local DB if API fails */
    enableLocalFallback: boolean;

    /** IPGeolocation.io API key */
    ipGeolocationApiKey: string;

    /** MaxMind Account ID */
    maxMindAccountId?: string;

    /** MaxMind License Key */
    maxMindLicenseKey?: string;

    /** Path to local MMDB files */
    mmdbPaths?: {
        city: string;
        country: string;
        asn: string;
    };
}

/**
 * Default configuration - currently using API only
 * TODO: Add admin panel toggle to switch between sources
 */
export const defaultConfig: IpInfoConfig = {
    dataSource: (process.env.IP_INFO_DATA_SOURCE as IpInfoDataSource) || 'api',
    apiToken: process.env.IPINFO_TOKEN || '',
    ipGeolocationApiKey: process.env.IPGEOLOCATION_API_KEY || '',
    maxMindAccountId: process.env.MAXMIND_ACCOUNT_ID || '',
    maxMindLicenseKey: process.env.MAXMIND_LICENSE_KEY || '',
    localDbPath: process.env.IPINFO_LOCAL_DB_PATH || './data/ipinfo_lite.json',
    mmdbPaths: {
        city: process.env.MMDB_PATH_CITY || './data/GeoLite2-City.mmdb',
        country: process.env.MMDB_PATH_COUNTRY || './data/GeoLite2-Country.mmdb',
        asn: process.env.MMDB_PATH_ASN || './data/GeoLite2-ASN.mmdb',
    },
    enableApiFallback: process.env.IP_INFO_ENABLE_API_FALLBACK !== 'false',
    enableLocalFallback: process.env.IP_INFO_ENABLE_LOCAL_FALLBACK !== 'false',
};

/**
 * Get current IPInfo configuration
 * In the future, this will read from admin settings/database
 */
export function getIpInfoConfig(): IpInfoConfig {
    // TODO: Implement admin panel settings integration
    // For now, return default config
    return defaultConfig;
}

/**
 * Update IPInfo configuration
 * Future: This will be called from admin panel
 */
export async function updateIpInfoConfig(config: Partial<IpInfoConfig>): Promise<void> {
    // TODO: Implement settings persistence
    // This will save to database/config file for admin panel
    console.log('IPInfo config update requested:', config);
    throw new Error('Admin panel configuration not yet implemented');
}
