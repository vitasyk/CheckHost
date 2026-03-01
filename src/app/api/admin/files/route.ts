
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const ALLOWED_REGEX = /^(robots\.txt|ads\.txt|security\.txt|google[a-z0-9]+\.html)$/;

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName || !ALLOWED_REGEX.test(fileName)) {
        return NextResponse.json({ error: 'Invalid file requested' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', fileName);

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return NextResponse.json({ content });
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return NextResponse.json({ content: '' }); // Return empty if file doesn't exist yet
        }
        return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { file, content } = await request.json();

        if (!file || !ALLOWED_REGEX.test(file)) {
            return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
        }

        const filePath = path.join(process.cwd(), 'public', file);

        // Ensure directory exists (though public/ usually does)
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        await fs.writeFile(filePath, content, 'utf-8');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('File write error:', error);
        return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
    }
}
