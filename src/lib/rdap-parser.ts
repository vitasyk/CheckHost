export interface ParsedRdap {
    domain?: string;
    registrar?: string;
    registrationDate?: string;
    expirationDate?: string;
    lastChangedDate?: string;
    transferDate?: string;
    status?: string[];
    nameservers?: string[];
    abuseContact?: {
        email?: string;
        phone?: string;
    };
}

export function parseRdapData(data: any): ParsedRdap {
    if (!data || typeof data !== 'object') return {};

    const result: ParsedRdap = {
        domain: data.ldhName || data.unicodeName,
        status: data.status || [],
        nameservers: data.nameservers?.map((ns: any) => ns.ldhName) || [],
    };

    // Parse Events (Dates)
    if (data.events && Array.isArray(data.events)) {
        data.events.forEach((event: any) => {
            const action = event.eventAction?.toLowerCase();
            const date = event.eventDate;
            if (action === 'registration') result.registrationDate = date;
            if (action === 'expiration') result.expirationDate = date;
            if (action === 'last changed') result.lastChangedDate = date;
            if (action === 'transfer') result.transferDate = date;
        });
    }

    // Parse Entities (Registrar & Contacts)
    if (data.entities && Array.isArray(data.entities)) {
        data.entities.forEach((entity: any) => {
            if (entity.roles?.includes('registrar')) {
                // Get Registrar Name from vcard
                const fn = extractVCardField(entity.vcardArray, 'fn');
                if (fn) result.registrar = fn;

                // Look for abuse contact inside registrar entities
                if (entity.entities && Array.isArray(entity.entities)) {
                    entity.entities.forEach((subEntity: any) => {
                        if (subEntity.roles?.includes('abuse')) {
                            result.abuseContact = {
                                email: extractVCardField(subEntity.vcardArray, 'email'),
                                phone: extractVCardField(subEntity.vcardArray, 'tel')
                            };
                        }
                    });
                }
            }
        });
    }

    return result;
}

function extractVCardField(vcardArray: any, fieldName: string): string | undefined {
    if (!vcardArray || !Array.isArray(vcardArray) || vcardArray[0] !== 'vcard') return undefined;

    const fields = vcardArray[1];
    if (!Array.isArray(fields)) return undefined;

    const field = fields.find((f: any) => f[0] === fieldName);
    return field ? field[3] : undefined;
}
