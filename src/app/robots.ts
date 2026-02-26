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
                '/share/', // Disallow private shared results from general search
            ],
        },
        sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://check-host.top'}/sitemap.xml`,
    };
}
