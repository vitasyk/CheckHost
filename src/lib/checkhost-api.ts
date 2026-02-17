
import axios, { AxiosInstance } from 'axios';
import type {
    CheckType,
    CheckOptions,
    CheckResponse,
    ResultsResponse,
    ExtendedResultsResponse,
    Node,
} from '@/types/checkhost';

const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_ATTEMPTS = 30; // 60 seconds total

export class CheckHostAPI {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: '/api',
            headers: {
                Accept: 'application/json',
            },
            timeout: 10000,
        });
    }

    /**
     * Initiate a check request
     */
    async initiateCheck(
        type: CheckType,
        host: string,
        options: CheckOptions = {}
    ): Promise<CheckResponse> {
        const { maxNodes = 10, nodes } = options;

        const params = new URLSearchParams({
            host,
        });

        // Use max_nodes ONLY if no specific nodes are provided
        if (nodes && nodes.length > 0) {
            nodes.forEach((node) => {
                params.append('node', node);
            });
        } else {
            params.append('max_nodes', maxNodes.toString());
        }

        try {
            // Check-host.net uses /check-traceroute for traceroute/mtr
            // For DNS, check-host supports specific types via the URL path or query param?
            // Actually check-host uses /check-dns for generic, but we want specific records.
            // Documentation or reverse engineering suggests: /check-dns?host=...&type=mx

            let apiType = type === 'mtr' ? 'traceroute' : type;

            // Handle specific DNS types if passed in options (we'll add this to options interface momentarily)
            // But for now, let's assume the 'type' argument might be a specific DNS type if we change the CheckType definition,
            // OR we add a subtype. 
            // The cleanest way with current architecture is to treat 'dns' as generic, but allow a custom 'resource' param for DNS.

            // The standard check-host API for DNS is: /check-dns?host=...&type=A|MX|etc
            if ((type === 'dns' || type === 'dns-all') && options.dnsType && options.dnsType !== 'all') {
                params.append('type', options.dnsType);
            }

            // For dns-all, we want standard DNS check which returns A, AAAA, MX, etc.
            // We just use 'dns' execution type but without specific type param (or with specific if needed later)
            if (type === 'dns-all') {
                apiType = 'dns';
            }

            const response = await this.client.get<CheckResponse>(
                `/check/${apiType}?${params.toString()}`
            );
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `CheckHost API error: ${error.response?.data?.message || error.message}`
                );
            }
            throw error;
        }
    }

    /**
     * Get check results by request ID
     */
    async getResults(requestId: string): Promise<ResultsResponse> {
        try {
            const response = await this.client.get<ResultsResponse>(
                `/result/${requestId}`
            );
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `Failed to get results: ${error.response?.data?.message || error.message}`
                );
            }
            throw error;
        }
    }

    /**
     * Get extended check results by request ID
     */
    async getExtendedResults(requestId: string): Promise<ExtendedResultsResponse> {
        try {
            const response = await this.client.get<ExtendedResultsResponse>(
                `/result-extended/${requestId}`
            );
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `Failed to get extended results: ${error.response?.data?.message || error.message}`
                );
            }
            throw error;
        }
    }

    /**
     * Get list of available nodes
     */
    async getNodes(): Promise<Record<string, Node>> {
        try {
            // Fetch from our own API route to avoid CORS issues
            const response = await this.client.get<{
                nodes: Record<string, {
                    asn: string;
                    ip: string;
                    location: [string, string, string];
                }>;
            }>('/nodes');

            // Transform to our Node type
            const nodes: Record<string, Node> = {};
            if (response.data && response.data.nodes) {
                Object.entries(response.data.nodes).forEach(([id, nodeData]) => {
                    const sanitizedId = id; // Keep full ID for API compatibility
                    nodes[sanitizedId] = {
                        id: sanitizedId,
                        countryCode: nodeData.location[0],
                        country: nodeData.location[1],
                        city: nodeData.location[2],
                        ip: nodeData.ip,
                        asn: nodeData.asn,
                    };
                });
            }

            return nodes;
        } catch (error) {
            console.error('Failed to fetch nodes:', error);
            // Return empty object instead of throwing to allow app to function
            return {};
        }
    }

    /**
     * Poll for results until complete or timeout
     */
    async pollResults(
        requestId: string,
        onProgress?: (results: ResultsResponse) => void,
        type?: CheckType
    ): Promise<ResultsResponse> {
        let attempts = 0;

        while (attempts < MAX_POLL_ATTEMPTS) {
            const results = await this.getResults(requestId);
            const resultValues = Object.values(results);

            // For MTR, we need to be more careful about completion.
            // A result like [[null]] or [null] is just a placeholder.
            const allComplete = resultValues.length > 0 && resultValues.every(
                (result) => {
                    if (result === null) return false;

                    if (type === 'mtr') {
                        // For MTR, if the result is an array, it must contain at least 
                        // one non-null element somewhere in its structure to be considered "started".
                        // However, we actually want to keep polling until it's finished.
                        // Check-Host MTR results are complete when they are no longer just nested nulls.
                        const isAllNull = (v: any): boolean => {
                            if (v === null) return true;
                            if (Array.isArray(v)) return v.length === 0 || v.every(isAllNull);
                            return false;
                        };

                        if (isAllNull(result)) return false;
                    }

                    return true;
                }
            );

            if (onProgress) {
                onProgress(results);
            }

            if (allComplete) {
                return results;
            }

            // Wait before next poll
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
            attempts++;
        }

        // Timeout - return partial results
        const results = await this.getResults(requestId);
        return results;
    }

    /**
     * Convenience method: initiate check and poll for results
     */
    async performCheck(
        type: CheckType,
        host: string,
        options: CheckOptions = {},
        onProgress?: (results: ResultsResponse) => void,
        onInit?: (response: CheckResponse) => void
    ): Promise<{ results: ResultsResponse; checkNodes: Record<string, any> }> {
        const checkResponse = await this.initiateCheck(type, host, options);
        if (onInit) {
            onInit(checkResponse);
        }
        const results = await this.pollResults(checkResponse.request_id, onProgress, type);
        return {
            results,
            checkNodes: checkResponse.nodes
        };
    }

    /**
     * Perform a comprehensive DNS lookup using the server-side DNS resolver.
     * This bypasses check-host.net and uses Node.js dns module for all record types.
     */
    async performDnsLookup(
        host: string,
        refresh = false
    ): Promise<any> {
        try {
            const response = await this.client.get(`/dns-lookup?domain=${encodeURIComponent(host)}${refresh ? '&refresh=true' : ''}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `DNS lookup failed: ${error.response?.data?.error || error.message}`
                );
            }
            throw error;
        }
    }
}

// Export singleton instance
export const checkHostAPI = new CheckHostAPI();

