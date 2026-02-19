import { NextRequest, NextResponse } from 'next/server';
import * as tls from 'tls';
import * as dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    let host = searchParams.get('host');

    if (!host) {
        return NextResponse.json({ error: 'Host is required' }, { status: 400 });
    }

    // Sanitize host (remove protocol/path)
    host = host.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

    try {
        const result = await checkSsl(host);
        return NextResponse.json(result);
    } catch (error: any) {
        // Map internal error codes to user-friendly messages
        let errorMessage = error.message || 'Failed to check SSL certificate';
        let isTechnicalError = true;

        if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
            errorMessage = `DNS Resolution failed: The domain "${host}" could not be found.`;
            isTechnicalError = false;
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = `Connection refused: The server at "${host}" is not accepting connections on port 443.`;
            isTechnicalError = false;
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = `Connection timed out: The server at "${host}" (port 443) took too long to respond.`;
            isTechnicalError = false;
        } else if (error.code === 'EHOSTUNREACH') {
            errorMessage = `Host unreachable: No path to the server at "${host}".`;
            isTechnicalError = false;
        }

        if (!isTechnicalError) {
            console.warn(`[SSL Check] Handled failure for ${host}: ${error.code} - ${error.message}`);
        } else {
            console.error(`[SSL Check] Technical error for ${host}:`, error);
        }

        // Return 200 for "Not Found", "Refused", or "Timeout" to allow the UI to render an integrated empty state
        if (!isTechnicalError) {
            return NextResponse.json({
                host,
                error: errorMessage,
                errorCode: error.code,
                status: 'failed'
            });
        }

        return NextResponse.json({
            error: errorMessage,
            code: error.code,
            originalError: error.message
        }, { status: 500 });
    }
}

async function checkSsl(host: string, port: number = 443): Promise<any> {
    let hostIp = '';
    try {
        const lookupResult = await lookup(host);
        if (lookupResult && lookupResult.address) {
            hostIp = lookupResult.address;
        }
    } catch (e) {
        // Fallback or ignore
    }

    return new Promise((resolve, reject) => {
        let completed = false;

        const options = {
            host,
            port,
            servername: host, // SNI is required for most sites
            rejectUnauthorized: false, // We want to see invalid certs too
        };

        const socket = tls.connect(options, () => {
            if (completed) return;

            const cert = socket.getPeerCertificate(true);

            if (!cert || Object.keys(cert).length === 0) {
                cleanup(new Error('No certificate received'));
                return;
            }

            // Traverse the chain
            const chain: any[] = [];
            let current: any = cert;
            const seen = new Set();
            const crypto = require('crypto');

            while (current && !seen.has(current.fingerprint)) {
                seen.add(current.fingerprint);

                let sigalg = (current as any).sigalg;
                let pubkeyType = '';

                // Use X509Certificate if available for more detailed info (Node 15.6+)
                if (current.raw && crypto.X509Certificate) {
                    try {
                        const x509 = new crypto.X509Certificate(current.raw);
                        sigalg = x509.signatureAlgorithm;
                        // Construct a descriptive algorithm string if possible
                        if (!sigalg && x509.publicKey) {
                            const keyInfo = x509.publicKey.asymmetricKeyDetails;
                            const keyType = x509.publicKey.asymmetricKeyType.toUpperCase();
                            sigalg = `${keyType} ${keyInfo?.modulusLength || current.bits || ''}`;
                        }
                    } catch (e) {
                        console.error('X509 parsing error:', e);
                    }
                }

                // Fallback for sigalg display
                if (!sigalg) {
                    const keyType = current.pubkey ? 'Public Key' : '';
                    sigalg = current.bits ? `${keyType} (${current.bits} bits)` : 'Unknown';
                }

                chain.push({
                    subject: current.subject,
                    issuer: current.issuer,
                    valid_from: current.valid_from,
                    valid_to: current.valid_to,
                    fingerprint: current.fingerprint,
                    serialNumber: current.serialNumber,
                    bits: current.bits,
                    pubkey: current.pubkey?.toString('hex'),
                    asn1Curve: current.asn1Curve,
                    nistCurve: current.nistCurve,
                    ext_key_usage: current.ext_key_usage,
                    subjectaltname: current.subjectaltname,
                    sigalg: sigalg,
                });

                if (current.issuerCertificate && current.issuerCertificate.fingerprint !== current.fingerprint) {
                    current = current.issuerCertificate;
                } else {
                    current = null;
                }
            }

            // Try to extract server type from TLS session or headers
            // We'll also try a quick HTTP HEAD request to get the 'Server' header
            let serverType = 'Unknown';

            const fetchHeaders = async () => {
                try {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 2000);
                    const response = await fetch(`https://${host}`, {
                        method: 'HEAD',
                        signal: controller.signal,
                        cache: 'no-store'
                    });
                    clearTimeout(id);
                    serverType = response.headers.get('server') || 'Unknown';
                } catch (e) {
                    // Ignore errors for header fetching
                }
            };

            fetchHeaders().finally(() => {
                cleanup(null, {
                    host,
                    hostIp,
                    port,
                    serverType,
                    authorized: socket.authorized,
                    authorizationError: socket.authorizationError,
                    protocol: socket.getProtocol(),
                    cipher: socket.getCipher(),
                    certificate: chain[0], // End-entity certificate
                    chain: chain // Full chain including end-entity
                });
            });
        });

        socket.on('error', (err) => {
            cleanup(err);
        });

        socket.setTimeout(15000); // Increased to 15s timeout
        socket.on('timeout', () => {
            const err = new Error('Connection timed out');
            (err as any).code = 'ETIMEDOUT';
            cleanup(err);
        });

        function cleanup(err: Error | null, data?: any) {
            if (completed) return;
            completed = true;

            socket.destroy();

            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        }
    });
}
