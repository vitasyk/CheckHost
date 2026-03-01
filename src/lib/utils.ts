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
