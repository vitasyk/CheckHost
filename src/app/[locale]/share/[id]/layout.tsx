import { Metadata } from 'next';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import pool, { isPostgresConfigured } from '@/lib/postgres';

async function getSnapshot(id: string) {
    try {
        if (isPostgresConfigured) {
            const res = await pool.query('SELECT target_host, check_type FROM result_snapshots WHERE id = $1', [id]);
            if (res.rows.length > 0) return res.rows[0];
        }
        if (isSupabaseConfigured) {
            const { data } = await supabase
                .from('result_snapshots')
                .select('target_host, check_type')
                .eq('id', id)
                .single();
            return data;
        }
    } catch (e) {
        console.error('Failed to fetch snapshot for metadata:', e);
    }
    return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string, locale: string }> }): Promise<Metadata> {
    const { id } = await params;
    const snapshot = await getSnapshot(id);
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'checknode.io';

    if (!snapshot) {
        return {
            title: `Result Not Found | ${siteName}`,
        };
    }

    const title = `${snapshot.target_host} - ${snapshot.check_type.toUpperCase()} Check`;
    const description = `View real-time ${snapshot.check_type} check results for ${snapshot.target_host} from multiple global locations. Free network diagnostics by ${siteName}.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        }
    };
}

export default function ShareLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
