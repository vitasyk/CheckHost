export interface IpInfoResponse {
    ip: string;
    hostname?: string;
    providers: {
        maxmind?: MaxMindData;
        ipinfo?: IpInfoData;
        dbip?: DbIpData;
        ip2location?: Ip2LocationData;
        ipgeolocation?: IpGeolocationData;
        ipapi?: IpApiData;
        maxmind_local?: MaxMindData;
    };
    rdapRawData?: any;
    nameservers?: string[];
    status?: 'success' | 'failed';
    host?: string;
    error?: string;
}

export interface IpApiData {
    status: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
    as: string;
    mobile: boolean;
    proxy: boolean;
    hosting: boolean;
    currency?: string;
}

export interface MaxMindData {
    country: string;
    countryCode: string;
    city: string;
    region: string;
    postal: string;
    latitude: number;
    longitude: number;
    accuracyRadius: number;
    asn?: number;
    org?: string;
    ip?: string;
    _isReal?: boolean;
}

export interface IpInfoData {
    ip: string;
    hostname: string;
    city?: string;
    region?: string;
    country: string; // country code
    country_name?: string;
    continent?: string;
    continent_code?: string;
    loc?: string; // "lat,long"
    org: string;
    asn?: string;
    as_name?: string;
    as_domain?: string;
    postal?: string;
    timezone?: string;
    anycast?: boolean;
}

export interface DbIpData {
    ipAddress: string;
    continentCode: string;
    continentName: string;
    countryCode: string;
    countryName: string;
    stateProv: string;
    city: string;
    isp: string;
    connectionType?: string;
    organization?: string;
}

export interface Ip2LocationData {
    country_name: string;
    cntry_code: string; // "US"
    region_name: string;
    city_name: string;
    latitude: number;
    longitude: number;
    zip_code: string;
    time_zone: string;
    isp: string;
    domain: string;
    net_speed: string;
    idd_code: string;
    area_code: string;
    weather_station_code: string;
    weather_station_name: string;
    mcc: string;
    mnc: string;
    mobile_brand: string;
    elevation: number;
    usage_type: string;
}

export interface IpGeolocationData {
    ip: string;
    continent_code: string;
    continent_name: string;
    country_code2: string;
    country_code3: string;
    country_name: string;
    country_capital: string;
    state_prov: string;
    district: string;
    city: string;
    zipcode: string;
    latitude: string;
    longitude: string;
    is_eu: boolean;
    calling_code: string;
    country_tld: string;
    languages: string;
    country_flag: string;
    isp: string;
    connection_type: string;
    organization: string;
    currency: {
        code: string;
        name: string;
        symbol: string;
    };
    time_zone: {
        name: string;
        offset: number;
        current_time: string;
    };
}
