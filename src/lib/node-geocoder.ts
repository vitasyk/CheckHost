
interface NodeCoords {
    lat: number;
    lng: number;
    city: string;
    country: string;
}

// Static mapping for common locations to avoid unnecessary API calls
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    // Europe - Ukraine
    'Kyiv': { lat: 50.4501, lng: 30.5234 },
    'Kharkiv': { lat: 49.9935, lng: 36.2304 },
    'Khmelnytskyi': { lat: 49.4230, lng: 26.9871 },

    // Europe - Western/Central
    'Falkenstein': { lat: 50.4779, lng: 12.3713 },
    'Frankfurt': { lat: 50.1109, lng: 8.6821 },
    'Nuremberg': { lat: 49.4521, lng: 11.0767 },
    'Limburg': { lat: 50.3833, lng: 8.0500 },
    'Amsterdam': { lat: 52.3676, lng: 4.9041 },
    'Meppel': { lat: 52.6934, lng: 6.1950 },
    'London': { lat: 51.5074, lng: -0.1278 },
    'Coventry': { lat: 52.4068, lng: -1.5197 },
    'Paris': { lat: 48.8566, lng: 2.3522 },
    'Roubaix': { lat: 50.6927, lng: 3.1778 },
    'Strasbourg': { lat: 48.5734, lng: 7.7521 },
    'Warsaw': { lat: 52.2297, lng: 21.0122 },
    'Gdansk': { lat: 54.3520, lng: 18.6466 },
    'Poznan': { lat: 52.4064, lng: 16.9252 },
    'Prague': { lat: 50.0755, lng: 14.4378 },
    'C.Budejovice': { lat: 48.9745, lng: 14.4746 },
    'Chisinau': { lat: 47.0105, lng: 28.8638 },
    'Stockholm': { lat: 59.3293, lng: 18.0686 },
    'Tallberg': { lat: 60.8197, lng: 14.9912 },
    'Zurich': { lat: 47.3769, lng: 8.5417 },
    'Vienna': { lat: 48.2082, lng: 16.3738 },
    'Milano': { lat: 45.4642, lng: 9.1900 },
    'Milan': { lat: 45.4642, lng: 9.1900 },
    'Madrid': { lat: 40.4168, lng: -3.7038 },
    'Barcelona': { lat: 41.3851, lng: 2.1734 },
    'Lisbon': { lat: 38.7223, lng: -9.1393 },
    'Viana': { lat: 41.6918, lng: -8.8345 },
    'Sofia': { lat: 42.6977, lng: 23.3219 },
    'Bucharest': { lat: 44.4268, lng: 26.1025 },
    'Belgrade': { lat: 44.8125, lng: 20.4612 },
    'Zagreb': { lat: 45.8150, lng: 15.9819 },
    'Ljubljana': { lat: 46.0569, lng: 14.5058 },
    'Maribor': { lat: 46.5546, lng: 15.6459 },
    'Bratislava': { lat: 48.1486, lng: 17.1077 },
    'Budapest': { lat: 47.4979, lng: 19.0402 },
    'Nyiregyhaza': { lat: 47.9531, lng: 21.7167 },
    'Athens': { lat: 37.9838, lng: 23.7275 },
    'Thessaloniki': { lat: 40.6401, lng: 22.9444 },
    'Istanbul': { lat: 41.0082, lng: 28.9784 },
    'Bursa': { lat: 40.1885, lng: 29.0610 },
    'Izmir': { lat: 38.4237, lng: 27.1428 },
    'Antalya': { lat: 36.8969, lng: 30.7133 },
    'Tallinn': { lat: 59.4370, lng: 24.7536 },
    'Riga': { lat: 56.9496, lng: 24.1052 },
    'Vilnius': { lat: 54.6872, lng: 25.2797 },
    'Helsinki': { lat: 60.1699, lng: 24.9384 },
    'Oslo': { lat: 59.9139, lng: 10.7522 },
    'Copenhagen': { lat: 55.6761, lng: 12.5683 },
    'Dublin': { lat: 53.3498, lng: -6.2603 },
    'Moscow': { lat: 55.7558, lng: 37.6173 },
    'Saint Petersburg': { lat: 59.9343, lng: 30.3351 },
    'Larnaca': { lat: 34.9168, lng: 33.6290 },

    // North America
    'Los Angeles': { lat: 34.0522, lng: -118.2437 },
    'New York': { lat: 40.7128, lng: -74.0060 },
    'New York City': { lat: 40.7128, lng: -74.0060 },
    'Dallas': { lat: 32.7767, lng: -96.7970 },
    'Miami': { lat: 25.7617, lng: -80.1918 },
    'Chicago': { lat: 41.8781, lng: -87.6298 },
    'Atlanta': { lat: 33.7490, lng: -84.3880 },
    'Seattle': { lat: 47.6062, lng: -122.3321 },
    'San Jose': { lat: 37.3382, lng: -121.8863 },
    'Santa Clara': { lat: 37.3541, lng: -121.9552 },
    'Ashburn': { lat: 39.0438, lng: -77.4874 },
    'Piscataway': { lat: 40.5549, lng: -74.4643 },
    'Buffalo': { lat: 42.8864, lng: -78.8784 },
    'Secaucus': { lat: 40.7895, lng: -74.0565 },
    'Toronto': { lat: 43.6532, lng: -79.3832 },
    'Montreal': { lat: 45.5017, lng: -73.5673 },
    'Vancouver': { lat: 49.2827, lng: -123.1207 },

    // Asia
    'Singapore': { lat: 1.3521, lng: 103.8198 },
    'Tokyo': { lat: 35.6762, lng: 139.6503 },
    'Seoul': { lat: 37.5665, lng: 126.9780 },
    'Hong Kong': { lat: 22.3193, lng: 114.1694 },
    'Ho Chi Minh City': { lat: 10.8231, lng: 106.6297 },
    'Jakarta': { lat: -6.2088, lng: 106.8456 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Bengaluru': { lat: 12.9716, lng: 77.5946 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Dubai': { lat: 25.2048, lng: 55.2708 },
    'Tehran': { lat: 35.6892, lng: 51.3890 },
    'Karaj': { lat: 35.8400, lng: 51.0000 },
    'Shiraz': { lat: 29.5926, lng: 52.5836 },
    'Khonj': { lat: 27.8833, lng: 53.4333 },
    'Almaty': { lat: 43.2220, lng: 76.8512 },
    'Astana': { lat: 51.1605, lng: 71.4704 },
    'Karaganda': { lat: 49.8020, lng: 73.1021 },
    'Tel Aviv': { lat: 32.0853, lng: 34.7818 },
    'Netanya': { lat: 32.3215, lng: 34.8532 },
    'Jerusalem': { lat: 31.7683, lng: 35.2137 },

    // South America
    'Sao Paulo': { lat: -23.5505, lng: -46.6333 },

    // Africa
    'Johannesburg': { lat: -26.2041, lng: 28.0473 },

    // Oceania
    'Sydney': { lat: -33.8688, lng: 151.2093 },
    'Melbourne': { lat: -37.8136, lng: 144.9631 },
};

const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
    'UA': { lat: 48.3794, lng: 31.1656 },
    'DE': { lat: 51.1657, lng: 10.4515 },
    'FR': { lat: 46.2276, lng: 2.2137 },
    'US': { lat: 37.0902, lng: -95.7129 },
    'NL': { lat: 52.1326, lng: 5.2913 },
    'GB': { lat: 55.3781, lng: -3.4360 },
    'PL': { lat: 51.9194, lng: 19.1451 },
    'CZ': { lat: 49.8175, lng: 15.4730 },
    'FI': { lat: 61.9241, lng: 25.7482 },
    'SE': { lat: 60.1282, lng: 18.6435 },
    'CH': { lat: 46.8182, lng: 8.2275 },
    'AT': { lat: 47.5162, lng: 14.5501 },
    'SK': { lat: 48.6690, lng: 19.6990 },
    'RO': { lat: 45.9432, lng: 24.9668 },
    'BG': { lat: 42.7339, lng: 25.4858 },
    'HU': { lat: 47.1625, lng: 19.5033 },
    'IT': { lat: 41.8719, lng: 12.5674 },
    'ES': { lat: 40.4637, lng: -3.7492 },
    'PT': { lat: 39.3999, lng: -8.2245 },
    'GR': { lat: 39.0742, lng: 21.8243 },
    'TR': { lat: 38.9637, lng: 35.2433 },
    'RS': { lat: 44.0165, lng: 21.0059 },
    'HR': { lat: 45.1000, lng: 15.2000 },
    'SI': { lat: 46.1512, lng: 14.9955 },
    'EE': { lat: 58.5953, lng: 25.0136 },
    'LV': { lat: 56.8796, lng: 24.6032 },
    'LT': { lat: 55.1694, lng: 23.8813 },
    'IE': { lat: 53.1424, lng: -7.6921 },
    'NO': { lat: 60.4720, lng: 8.4689 },
    'DK': { lat: 56.2639, lng: 9.5018 },
    'RU': { lat: 61.5240, lng: 105.3188 },
    'KZ': { lat: 48.0196, lng: 66.9237 },
    'IL': { lat: 31.0461, lng: 34.8516 },
    'AE': { lat: 23.4241, lng: 53.8478 },
    'SG': { lat: 1.3521, lng: 103.8198 },
    'JP': { lat: 36.2048, lng: 138.2529 },
    'HK': { lat: 22.3193, lng: 114.1694 },
    'IN': { lat: 20.5937, lng: 78.9629 },
    'CA': { lat: 56.1304, lng: -106.3468 },
    'BR': { lat: -14.2350, lng: -51.9253 },
    'ZA': { lat: -30.5595, lng: 22.9375 },
    'AU': { lat: -25.2744, lng: 133.7751 },
    'MD': { lat: 47.4116, lng: 28.3699 },
};

/**
 * Resolves coordinates for a node based on its city and country
 */
export function geocodeNode(city: string, country: string, countryCode: string): { lat: number, lng: number } {
    const trimmedCity = city?.trim();
    const trimmedCountry = country?.trim();
    const trimmedCountryCode = countryCode?.trim();

    // 1. Try city exact match
    if (trimmedCity && CITY_COORDS[trimmedCity]) return CITY_COORDS[trimmedCity];

    // 2. Try partial city match (e.g. "Kyiv, Ukraine")
    if (trimmedCity) {
        for (const [cityKey, coords] of Object.entries(CITY_COORDS)) {
            if (trimmedCity.includes(cityKey)) return coords;
        }
    }

    // 3. Try country code match
    if (trimmedCountryCode && COUNTRY_COORDS[trimmedCountryCode]) return COUNTRY_COORDS[trimmedCountryCode];

    // 4. Try country name match
    if (trimmedCountry && COUNTRY_COORDS[trimmedCountry]) return COUNTRY_COORDS[trimmedCountry];

    // 5. Default - Log warning and return generic point
    console.warn(`[NodeGeocoder] Unknown location: City="${city}", Country="${country}", Code="${countryCode}"`);

    // Use a slightly different default point or at least jittered
    const latBase = 0;
    const lngBase = 0;
    const jitter = () => (Math.random() - 0.5) * 5;

    return {
        lat: latBase + jitter(),
        lng: lngBase + jitter()
    };
}
