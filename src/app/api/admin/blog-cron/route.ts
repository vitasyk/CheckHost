import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSiteSetting, saveSiteSetting } from '@/lib/site-settings';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const config = await getSiteSetting('blog_cron_config');
    return NextResponse.json(config || {});
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    await saveSiteSetting('blog_cron_config', body);
    return NextResponse.json({ success: true });
}
