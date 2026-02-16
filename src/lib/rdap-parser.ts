export interface ParsedRdap {
    domain?: string;
    handle?: string;
    name?: string;
    startAddress?: string;
    endAddress?: string;
    ipVersion?: string;
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
    objectClassName?: string;
}

export function parseRdapData(data: any): ParsedRdap {
    if (!data || typeof data !== 'object') return {};

    const result: ParsedRdap = {
        domain: data.ldhName || data.unicodeName,
        handle: data.handle,
        name: data.name,
        startAddress: data.startAddress,
        endAddress: data.endAddress,
        ipVersion: data.ipVersion,
        status: data.status || [],
        nameservers: data.nameservers?.map((ns: any) => typeof ns === 'string' ? ns : ns.ldhName) || [],
        objectClassName: data.objectClassName
    };

    // Parse Events (Dates)
    if (data.events && Array.isArray(data.events)) {
        data.events.forEach((event: any) => {
            const action = event.eventAction?.toLowerCase();
            const date = event.eventDate;
            if (action === 'registration') result.registrationDate = date;
            if (action === 'expiration') result.expirationDate = date;
            if (action === 'last changed' || action === 'last-changed') result.lastChangedDate = date;
            if (action === 'transfer') result.transferDate = date;
        });
    }

    // Parse Entities (Registrar & Contacts)
    if (data.entities && Array.isArray(data.entities)) {
        data.entities.forEach((entity: any) => {
            // Match registrar for domains or administrative/registrant for IPs
            if (entity.roles?.some((r: string) => ['registrar', 'administrative', 'registrant'].includes(r.toLowerCase()))) {
                // Get Name from vcard
                const fn = extractVCardField(entity.vcardArray, 'fn');
                if (fn && !result.registrar) result.registrar = fn;

                // Look for abuse contact inside entities
                if (entity.entities && Array.isArray(entity.entities)) {
                    entity.entities.forEach((subEntity: any) => {
                        if (subEntity.roles?.includes('abuse')) {
                            const email = extractVCardField(subEntity.vcardArray, 'email');
                            const phone = extractVCardField(subEntity.vcardArray, 'tel');
                            if (email || phone) {
                                result.abuseContact = { email, phone };
                            }
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
