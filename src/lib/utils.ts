import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detect client IP with priority order for proxies/CDN (especially Cloudflare)
 */
export function getRealIp(headers: Headers): string | null {
  const cf = headers.get('cf-connecting-ip');
  const xReal = headers.get('x-real-ip');
  const xForwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();

  // Diagnostic log (Force visible for now to debug VPN)
  console.log(`[IP Detection] CF: ${cf}, X-Real: ${xReal}, X-Forwarded: ${xForwarded}`);

  return cf || xReal || xForwarded || null;
}

/**
 * Checks if a string is structurally an IPv6 address
 */
export function isIPv6(ip: string): boolean {
  if (!ip) return false;
  const clean = ip.trim();
  const colons = (clean.match(/:/g) || []).length;
  return colons >= 2 && /^[a-fA-F0-9:.]+$/.test(clean);
}

/**
 * Extracts the clean host/domain/IP from a URL or input string.
 * Safely handles IPv6 literals like [2001:db8::1] without breaking them.
 */
export function extractHost(input: string): string {
  if (!input) return '';

  let cleaned = input.trim();

  // Remove protocol
  cleaned = cleaned.replace(/^https?:\/\//i, '');

  // Remove path and query
  cleaned = cleaned.split('/')[0];

  // Handle IPv6 enclosed in brackets: e.g. [2001:db8::1]:8080 or [2001:db8::1]
  const ipv6Match = cleaned.match(/^\[([a-fA-F0-9:.]+)\]/);
  if (ipv6Match) {
    return ipv6Match[1].toLowerCase();
  }

  // If no brackets, check if it's potentially a raw IPv6 by counting colons.
  const colons = (cleaned.match(/:/g) || []).length;
  if (colons >= 2) {
    return cleaned.toLowerCase();
  }

  // Otherwise, safe to split by colon to remove port.
  cleaned = cleaned.split(':')[0];

  return cleaned.replace(/\.$/, '').toLowerCase();
}
