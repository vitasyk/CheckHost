import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detect client IP with priority order for proxies/CDN (especially Cloudflare)
 */
export function getRealIp(headers: Headers): string | null {
  return (
    headers.get('cf-connecting-ip') || // Cloudflare (most reliable behind CF)
    headers.get('x-real-ip') || // Caddy/Nginx
    headers.get('x-forwarded-for')?.split(',')[0].trim() || // Standard proxy chain
    null
  );
}
