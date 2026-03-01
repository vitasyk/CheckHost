import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSiteSetting } from '@/lib/site-settings';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const SUPPORTED_MODELS = ['dall-e-3', 'dall-e-2', 'gpt-image-1'] as const;
type ImageModel = typeof SUPPORTED_MODELS[number];

// Model-specific constraints
const MODEL_CONFIG: Record<ImageModel, { size: string; quality?: string; response_format?: string }> = {
    'dall-e-3': { size: '1024x1024', quality: 'standard', response_format: 'url' },
    'dall-e-2': { size: '1024x1024', response_format: 'url' },
    'gpt-image-1': { size: '1024x1024', quality: 'standard' }, // gpt-image-1 returns b64_json only
};

async function generateCoverImage(topic: string, openaiKey: string, model: ImageModel): Promise<string | null> {
    if (!openaiKey) return null;

    const config = MODEL_CONFIG[model];

    try {
        const body: Record<string, unknown> = {
            model,
            prompt: `A professional, clean, modern tech blog cover image for an article about: "${topic}". \
Style: flat design, dark background with glowing network/server elements, indigo and purple color palette, \
no text or letters in the image. Suitable for a DevOps / networking blog.`,
            n: 1,
            size: config.size,
        };

        if (config.quality) body.quality = config.quality;
        if (config.response_format) body.response_format = config.response_format;

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`[Admin Image Gen] ${model} image generation failed:`, err);
            return null;
        }

        const data = await response.json();

        // gpt-image-1 returns base64, others return URL
        if (model === 'gpt-image-1') {
            const b64 = data.data[0]?.b64_json;
            return b64 ? `data:image/png;base64,${b64}` : null;
        }

        return data.data[0]?.url || null;
    } catch (e: any) {
        console.error(`[Admin Image Gen] ${model} exception:`, e.message);
        return null;
    }
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { topic, model: rawModel } = await req.json();
        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        // Validate model, fallback to dall-e-3
        const model: ImageModel = SUPPORTED_MODELS.includes(rawModel) ? rawModel : 'dall-e-3';

        const aiConfig = await getSiteSetting('ai_config');
        const openaiKey = aiConfig?.openaiKey || process.env.OPENAI_API_KEY;

        if (!openaiKey) {
            return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 400 });
        }

        const imageUrl = await generateCoverImage(topic, openaiKey, model);
        if (!imageUrl) {
            return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
        }

        // gpt-image-1 returns base64 data URL — return as-is (no download needed)
        if (imageUrl.startsWith('data:')) {
            return NextResponse.json({ url: imageUrl, model });
        }

        // Download URL and upload to storage
        const imageRes = await fetch(imageUrl);
        const buffer = await imageRes.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);

        const fileName = `generated-${randomUUID()}.png`;
        const mimeType = 'image/png';

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
            } catch {
                // Directory already exists, ignore
            }

            const filePath = join(uploadDir, fileName);
            await writeFile(filePath, fileBuffer);
            finalUrl = `/uploads/${fileName}`;
        }

        return NextResponse.json({ url: finalUrl, model });
    } catch (error: any) {
        console.error('[Admin Image Gen] error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
