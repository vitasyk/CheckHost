import { NextRequest, NextResponse } from 'next/server';
import { getSnapshot } from '@/lib/snapshot';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolution = await params;
        const id = resolution.id;

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        const snapshot = await getSnapshot(id);

        if (!snapshot) {
            return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
        }

        if (snapshot.isExpired) {
            return NextResponse.json({ error: 'Snapshot expired' }, { status: 410 });
        }

        return NextResponse.json(snapshot);

    } catch (error) {
        console.error('Error fetching snapshot:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
