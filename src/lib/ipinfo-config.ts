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
    dataSource: 'api',
    apiToken: '6ff9d482149980',
    ipGeolocationApiKey: 'e66a3d460fd6479b82cf352ceee6d708',
    maxMindAccountId: '', // User to provide
    maxMindLicenseKey: '', // User to provide
    localDbPath: './data/ipinfo_lite.json',
    mmdbPaths: {
        city: './data/GeoLite2-City.mmdb',
        country: './data/GeoLite2-Country.mmdb',
        asn: './data/GeoLite2-ASN.mmdb',
    },
    enableApiFallback: true,
    enableLocalFallback: true,
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
