import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    // Basic auth check
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${randomUUID()}-${file.name.replace(/\s+/g, '-')}`;

        // 1. Try Supabase Storage if configured
        if (isSupabaseConfigured) {
            try {
                // We use 'blog-images' as the default bucket
                const { data, error } = await supabase.storage
                    .from('blog-images')
                    .upload(filename, buffer, {
                        contentType: file.type,
                        upsert: true
                    });

                if (!error && data) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('blog-images')
                        .getPublicUrl(filename);
                    return NextResponse.json({ url: publicUrl });
                }
                console.warn('Supabase upload failed, falling back to local:', error);
            } catch (err) {
                console.warn('Supabase storage error, falling back to local:', err);
            }
        }

        // 2. Fallback to local storage (public/uploads)
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Directory might already exist
        }

        const filePath = join(uploadDir, filename);
        await writeFile(filePath, buffer);

        // Return the relative URL for the local file
        const url = `/uploads/${filename}`;
        return NextResponse.json({ url });

    } catch (error) {
        console.error('[Upload API] Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
