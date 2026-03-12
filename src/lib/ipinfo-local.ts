/**
 * Local IPInfo Database Lookup
 * 
 * This module will handle IP lookups using the local ipinfo_lite.json database.
 * Currently a placeholder for future implementation.
 */

import type { IpInfoLiteResponse } from './ipinfo-api';
import { getIpInfoConfig } from './ipinfo-config';
import * as maxmind from 'maxmind';
import { existsSync, readFileSync } from 'fs';

let cityReader: maxmind.Reader<maxmind.CityResponse> | null = null;
let asnReader: maxmind.Reader<maxmind.AsnResponse> | null = null;

/**
 * Initialize local databases
 */
export async function initializeLocalDb(): Promise<void> {
    const config = getIpInfoConfig();
    const paths = config.mmdbPaths;

    if (!paths) return;

    try {
        if (existsSync(paths.city)) {
            const buffer = readFileSync(paths.city);
            cityReader = new maxmind.Reader<maxmind.CityResponse>(buffer);
        }
        if (existsSync(paths.asn)) {
            const buffer = readFileSync(paths.asn);
            asnReader = new maxmind.Reader<maxmind.AsnResponse>(buffer);
        }
        console.log('Local MMDB databases initialized from buffers');
    } catch (err) {
        console.error('Failed to initialize local MMDB:', err);
    }
}

/**
 * Look up IP information from local database
 */
export async function lookupLocalIpInfo(ip: string): Promise<IpInfoLiteResponse | null> {
    if (!ip || typeof ip !== 'string') {
        console.warn('Local MMDB lookup: Invalid IP string provided');
        return null;
    }

    if (!cityReader && !asnReader) {
        await initializeLocalDb();
    }

    if (!cityReader && !asnReader) return null;

    // Validate IP format for maxmind library to avoid RangeError
    if (!maxmind.validate(ip)) {
        console.warn(`Local MMDB lookup: IP "${ip}" is not valid according to maxmind`);
        return null;
    }

    try {
        const cityData = cityReader?.get(ip);
        const asnData = asnReader?.get(ip);

        if (!cityData && !asnData) return null;

        return {
            ip,
            asn: asnData?.autonomous_system_number ? `AS${asnData.autonomous_system_number}` : '',
            as_name: asnData?.autonomous_system_organization || '',
            as_domain: '', // Domain not in GeoLite2 ASN
            country_code: cityData?.country?.iso_code || '',
            country: cityData?.country?.names?.en || '',
            continent_code: cityData?.continent?.code || '',
            continent: cityData?.continent?.names?.en || '',
            city: cityData?.city?.names?.en || '',
            region: cityData?.subdivisions?.[0]?.names?.en || '',
            postal: cityData?.postal?.code || '',
            latitude: cityData?.location?.latitude,
            longitude: cityData?.location?.longitude,
            accuracy_radius: cityData?.location?.accuracy_radius,
        };
    } catch (err) {
        console.error(`Local MMDB lookup error for IP "${ip}":`, err);
        return null;
    }
}

/**
 * Check if local database is available and initialized
 */
export function isLocalDbAvailable(): boolean {
    const config = getIpInfoConfig();
    return !!(config.mmdbPaths && (existsSync(config.mmdbPaths.city) || existsSync(config.mmdbPaths.asn)));
}
