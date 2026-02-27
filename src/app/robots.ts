import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin/',
                '/api/',
                '/_next/',
                '/auth/',
            ],
        },
        sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io'}/sitemap.xml`,
    };
}
