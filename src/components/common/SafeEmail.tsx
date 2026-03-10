'use client';

import React, { useState, useEffect } from 'react';

interface SafeEmailProps {
    email: string;
    className?: string;
    showIcon?: boolean;
}

/**
 * A component that renders an email address only on the client side.
 * This prevents Cloudflare's server-side email obfuscation from finding the email
 * in the initial HTML, which can trigger 404 errors for /cdn-cgi/l/email-protection
 * when crawled by bots or search engines.
 */
export function SafeEmail({ email, className = "", showIcon = false }: SafeEmailProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Create a safe version for SSR: "support [at] domain.com"
    const safeDisplay = email.replace('@', ' [at] ');

    if (!mounted) {
        return (
            <span className={`text-slate-500/70 ${className}`}>
                {safeDisplay}
            </span>
        );
    }

    return (
        <a
            href={`mailto:${email}`}
            className={`hover:underline transition-colors ${className}`}
        >
            {email}
        </a>
    );
}
