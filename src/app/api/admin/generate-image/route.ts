import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSiteSetting } from '@/lib/site-settings';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

async function generateCoverImage(topic: string, openaiKey: string): Promise<string | null> {
    if (!openaiKey) return null;

    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: `A professional, clean, modern tech blog cover image for an article about: "${topic}". 
                         Style: flat design, dark background with glowing network/server elements, indigo and purple color palette, 
                         no text or letters in the image. Suitable for a DevOps / networking blog.`,
                n: 1,
                size: '1024x1024',
                quality: 'standard',
                response_format: 'url',
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('[Admin Image Gen] DALL-E image generation failed:', err);
            return null;
        }
        const data = await response.json();
        return data.data[0]?.url || null;
    } catch (e: any) {
        console.error('[Admin Image Gen] DALL-E exception:', e.message);
        return null;
    }
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { topic } = await req.json();
        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        const aiConfig = await getSiteSetting('ai_config');
        const openaiKey = aiConfig?.openaiKey || process.env.OPENAI_API_KEY;

        if (!openaiKey) {
            return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 400 });
        }

        const imageUrl = await generateCoverImage(topic, openaiKey);
        if (!imageUrl) {
            return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
        }

        // Now download and upload to our storage
        const imageRes = await fetch(imageUrl);
        const buffer = await imageRes.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);

        const fileName = `generated-${randomUUID()}.png`;
        const mimeType = 'image/png';

        // Use Supabase if configured, otherwise local
        let finalUrl = '';

        if (isSupabaseConfigured) {
            try {
                const { data, error } = await supabase.storage
                    .from('blog-images')
                    .upload(fileName, fileBuffer, {
                        contentType: mimeType,
                        upsert: true
                    });

                if (!error && data) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('blog-images')
                        .getPublicUrl(fileName);
                    finalUrl = publicUrl;
                }
            } catch (err) {
                console.warn('Supabase storage error in generation, falling back to local:', err);
            }
        }

        if (!finalUrl) {
            const uploadDir = join(process.cwd(), 'public', 'uploads');
            try {
                await mkdir(uploadDir, { recursive: true });
            } catch (e) { }

            const filePath = join(uploadDir, fileName);
            await writeFile(filePath, fileBuffer);
            finalUrl = `/uploads/${fileName}`;
        }

        return NextResponse.json({ url: finalUrl });
    } catch (error: any) {
        console.error('[Admin Image Gen] error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
