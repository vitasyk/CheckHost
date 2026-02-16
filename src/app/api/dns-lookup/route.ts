import { NextResponse } from 'next/server';
import dns from 'dns';
import { getMockIpInfo } from '@/lib/mock-data';

// Create a custom resolver with fixed reliable public DNS servers
// to bypass potentially broken local resolvers (like 127.0.0.1)
const resolver = new dns.promises.Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

const resolve4 = (domain: string) => resolver.resolve4(domain);
const resolve6 = (domain: string) => resolver.resolve6(domain);
const resolveMx = (domain: string) => resolver.resolveMx(domain);
const resolveNs = (domain: string) => resolver.resolveNs(domain);
const resolveCname = (domain: string) => resolver.resolveCname(domain);
const resolveTxt = (domain: string) => resolver.resolveTxt(domain);
const resolveSoa = (domain: string) => resolver.resolveSoa(domain);
const resolvePtr = (domain: string) => resolver.resolvePtr(domain);

interface DnsRecord {
    type: string;
    value: string;
    ttl?: number;
    priority?: number;
    auxiliary?: string;
}

async function safeResolve<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
        return await fn();
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'domain parameter is required' }, { status: 400 });
    }

    // Clean domain
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();

    // Detect if input is already an IP address
    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    const isIP = ipRegex.test(cleanDomain);

    const records: DnsRecord[] = [];

    if (isIP) {
        // For IP inputs, primarily do reverse DNS (PTR)
        const ptr = await safeResolve(() => resolver.reverse(cleanDomain));
        if (ptr) {
            ptr.forEach(p => records.push({ type: 'PTR', value: p }));
        }

        return NextResponse.json({
            domain: cleanDomain,
            ip: cleanDomain,
            records,
            timestamp: Date.now(),
        });
    }

    // Run all DNS lookups in parallel
    const [a, aaaa, mx, ns, cname, txt, soa, dmarc, dkim_mail, dkim_sign, mail_a, mail_mx, www_a, www_cname] = await Promise.all([
        safeResolve(() => resolve4(cleanDomain)),
        safeResolve(() => resolve6(cleanDomain)),
        safeResolve(() => resolveMx(cleanDomain)),
        safeResolve(() => resolveNs(cleanDomain)),
        safeResolve(() => resolveCname(cleanDomain)),
        safeResolve(() => resolveTxt(cleanDomain)),
        safeResolve(() => resolveSoa(cleanDomain)),
        // Service records
        safeResolve(() => resolveTxt(`_dmarc.${cleanDomain}`)),
        safeResolve(() => resolveTxt(`mail._domainkey.${cleanDomain}`)),
        safeResolve(() => resolveTxt(`sign._domainkey.${cleanDomain}`)),
        // Common subdomains
        safeResolve(() => resolve4(`mail.${cleanDomain}`)),
        safeResolve(() => resolveMx(`mail.${cleanDomain}`)),
        safeResolve(() => resolve4(`www.${cleanDomain}`)),
        safeResolve(() => resolveCname(`www.${cleanDomain}`)),
    ]);

    // A records
    if (a) {
        a.forEach(ip => records.push({ type: 'A', value: ip }));
    }

    // AAAA records
    if (aaaa) {
        aaaa.forEach(ip => records.push({ type: 'AAAA', value: ip }));
    }

    // CNAME records
    if (cname) {
        cname.forEach(cn => records.push({ type: 'CNAME', value: cn }));
    }

    // MX records
    if (mx) {
        mx.sort((a, b) => a.priority - b.priority);
        mx.forEach(r => records.push({
            type: 'MX',
            value: r.exchange,
            priority: r.priority,
        }));
    }

    // NS records
    if (ns) {
        ns.forEach(n => records.push({ type: 'NS', value: n }));
    }

    // SOA record
    if (soa) {
        records.push({
            type: 'SOA',
            value: soa.hostmaster,
            auxiliary: `mname=${soa.nsname}; serial=${soa.serial}; refresh=${soa.refresh}; retry=${soa.retry}; expire=${soa.expire}; minttl=${soa.minttl}`,
        });
    }

    // TXT records
    if (txt) {
        txt.forEach(chunks => {
            const value = chunks.join('');
            records.push({ type: 'TXT', value });
        });
    }

    // DMARC & DKIM Service Records
    if (dmarc) {
        dmarc.forEach(chunks => records.push({ type: 'TXT', value: chunks.join(''), auxiliary: '_dmarc.@' }));
    }
    if (dkim_mail) {
        dkim_mail.forEach(chunks => records.push({ type: 'TXT', value: chunks.join(''), auxiliary: 'mail._domainkey.@' }));
    }
    if (dkim_sign) {
        dkim_sign.forEach(chunks => records.push({ type: 'TXT', value: chunks.join(''), auxiliary: 'sign._domainkey.@' }));
    }

    // Subdomain records
    if (mail_a) {
        mail_a.forEach(ip => records.push({ type: 'A', value: ip, auxiliary: 'mail.@' }));
    }
    if (mail_mx) {
        mail_mx.forEach(r => records.push({ type: 'MX', value: r.exchange, priority: r.priority, auxiliary: 'mail.@' }));
    }
    if (www_a) {
        www_a.forEach(ip => records.push({ type: 'A', value: ip, auxiliary: 'www.@' }));
    }
    if (www_cname) {
        www_cname.forEach(cn => records.push({ type: 'CNAME', value: cn, auxiliary: 'www.@' }));
    }

    // PTR records for the primary A record
    const primaryIP = a && a.length > 0 ? a[0] : (aaaa && aaaa.length > 0 ? aaaa[0] : null);
    if (primaryIP) {
        const ptrResults = await safeResolve(() => resolver.reverse(primaryIP));
        if (ptrResults) {
            ptrResults.forEach(p => records.push({ type: 'PTR', value: p, auxiliary: `for ${primaryIP}` }));
        }
    }

    // Enhance with IP info (ISP, Location)
    let ipMetadata = null;
    if (primaryIP) {
        ipMetadata = await safeResolve(() => getMockIpInfo(primaryIP));
    }

    // Also try to resolve mail A record (like quer.monster does) for primary MX records
    if (mx && mx.length > 0) {
        for (const mxRecord of mx) {
            const mailA = await safeResolve(() => resolver.resolve4(mxRecord.exchange));
            if (mailA) {
                mailA.forEach(ip => records.push({
                    type: 'A',
                    value: ip,
                    auxiliary: `mail server (${mxRecord.exchange})`,
                }));
            }
        }
    }

    return NextResponse.json({
        domain: cleanDomain,
        ip: primaryIP,
        ipInfo: ipMetadata,
        records,
        timestamp: Date.now(),
    });
}
