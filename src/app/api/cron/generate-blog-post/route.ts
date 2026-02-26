import { NextResponse } from 'next/server';
import pool, { isPostgresConfigured } from '@/lib/postgres';
import { getSiteSetting } from '@/lib/site-settings';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchWithBrowserSpoof } from '@/lib/ai/browser-client';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'debug-blog.log');

function logDebug(msg: string) {
    const time = new Date().toISOString();
    const line = `[${time}] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, line);
    console.log(`[AutoBlog] ${msg}`);
}

// All supported site locales
const SUPPORTED_LOCALES = ['en', 'uk', 'es', 'de', 'fr', 'ru', 'nl', 'pl', 'it'];

const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English', uk: 'Ukrainian', es: 'Spanish', de: 'German',
    fr: 'French', ru: 'Russian', nl: 'Dutch', pl: 'Polish', it: 'Italian',
};

const DEFAULT_PROMPT_TEMPLATE = `
You are a senior IT engineer, DevOps specialist, and expert SEO content writer.
Write a comprehensive, technically accurate, and SEO-optimized blog article about: "{{keyword}}".
The ENTIRE article (title, excerpt, and content) MUST be written in: {{language}}.

Return a valid JSON object with EXACTLY these keys: "title", "slug", "excerpt", "content".

Rules:
- "title": SEO-friendly H1 title in {{language}} (string).
- "slug": URL-friendly slug always in English (e.g. "how-to-check-ping") (string), regardless of language.
- "excerpt": 2-3 sentence meta description in {{language}} (string).
- "content": Full article body as RICH HTML 5, written in {{language}}. 
  Requirements for Professional UI/UX 2025 Standard:
  * DO NOT use long dashes "—" or "—". Use standard punctuation or ":" where appropriate.
  * USE strict HTML structure: <h2> for main sections, <h3> for sub-sections.
  * Sections must be concise, punchy, and professional. Avoid AI "throat-clearing" intros.
  * Use <ul> or <ol> with <li> for all lists and technical steps.
  * Use <strong> for emphasis on key terms.
  * Use <code> for technical commands, filenames, or config values.
  * Add proper spacing between sections (the prose CSS will handle this, but ensure logical flow).
  * Include at least one <img> tag with a technical illustration placeholder: "https://placehold.co/800x400/1e293b/818cf8?text=Technical+Flow". MANDATORY descriptive [alt] attribute.
  * Insert exactly two {{AD}} markers for optimal reader retention.
  * Naturally mention and link to CheckHost tools (Ping, DNS check, SSL check, etc.) using: [text](https://check-host.top/[tool]).
`;

function compilePrompt(template: string, keyword: string, language: string) {
    const raw = template || DEFAULT_PROMPT_TEMPLATE;
    return raw
        .replace(/{{keyword}}/g, keyword)
        .replace(/{{language}}/g, language);
}

async function getAiConfig() {
    try {
        const setting = await getSiteSetting('ai_config');
        return setting || {};
    } catch {
        return {};
    }
}

async function generateCoverImage(topic: string, openaiKey: string): Promise<{ url: string; alt: string } | null> {
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
                size: '1792x1024',
                quality: 'standard',
                response_format: 'url',
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('[AutoBlog] DALL-E image generation failed:', err);
            return null;
        }
        const data = await response.json();
        return {
            url: data.data[0]?.url || '',
            alt: `Illustration for the article about ${topic}`,
        };
    } catch (e: any) {
        console.error('[AutoBlog] DALL-E exception:', e.message);
        return null;
    }
}

async function generateArticleWithGemini(
    compiledPrompt: string,
    locale: string,
    geminiKey: string,
    geminiModel: string = 'gemini-2.0-flash'
): Promise<{ title: string; slug: string; excerpt: string; content: string } | null> {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.75 },
    });

    const langName = LANGUAGE_NAMES[locale] || 'English';
    logDebug(`Calling Gemini for locale: ${locale}`);

    return retryRequest(async () => {
        const result = await model.generateContent(compiledPrompt);
        const responseText = result.response.text();
        logDebug(`Gemini response received for ${locale}`);
        return JSON.parse(responseText);
    }, locale, 'Gemini');
}

async function retryRequest(
    fn: () => Promise<any>,
    locale: string,
    provider: string,
    maxRetries = 2
): Promise<any> {
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (e: any) {
            lastError = e;
            const msg = e.message || '';

            // Handle 429 (Quota)
            if (
                msg.includes('429') ||
                msg.toLowerCase().includes('quota exceeded') ||
                msg.toLowerCase().includes('too many requests') ||
                msg.toLowerCase().includes('insufficient_quota')
            ) {
                // Check for "Daily Quota" which won't reset soon
                if (msg.includes('limit: 0') || msg.toLowerCase().includes('daily limit reached')) {
                    logDebug(`[${provider}] Critical: Daily Quota exhausted for ${locale}. Skipping retries for this provider.`);
                    break;
                }

                // Try to parse retry delay from Gemini error (it often says "Please retry in 40s")
                let delayMs = Math.pow(6, attempt + 1) * 1000; // Increased base backoff (6s, 36s...)

                const retryMatch = msg.match(/retry in ([\d.]+)s/);
                if (retryMatch) {
                    delayMs = (parseFloat(retryMatch[1]) + 3) * 1000; // Add 3s safety buffer
                }

                logDebug(`[${provider}] Rate limit hit for ${locale} (Attempt ${attempt + 1}/${maxRetries + 1}). Waiting ${Math.round(delayMs / 1000)}s...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
            }

            // For other errors, don't retry unless transient
            logDebug(`[${provider}] Non-retryable error for ${locale}: ${msg}`);
            break;
        }
    }
    return null;
}

async function generateArticleWithOpenAI(
    compiledPrompt: string,
    locale: string,
    openaiKey: string
): Promise<{ title: string; slug: string; excerpt: string; content: string } | null> {
    logDebug(`Calling OpenAI for locale: ${locale}`);

    return retryRequest(async () => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: 'json_object' },
                temperature: 0.75,
                messages: [
                    {
                        role: 'system',
                        content: `You are a senior IT engineer and expert SEO content writer. Always respond with a valid JSON object only.`,
                    },
                    {
                        role: 'user',
                        content: compiledPrompt,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenAI error: ${response.status} - ${err}`);
        }
        const data = await response.json();
        const responseText = data.choices[0]?.message?.content || '{}';
        return JSON.parse(responseText);
    }, locale, 'OpenAI');
}

async function generateArticleWithBrowser(
    compiledPrompt: string,
    keyword: string,
    locale: string,
    config: any
): Promise<{ title: string; slug: string; excerpt: string; content: string } | null> {
    logDebug(`Calling Browser Auth for locale: ${locale} (Prompt: ${compiledPrompt.substring(0, 50)}...)`);

    // 1. Try Claude if session key provided
    if (config.claudeSessionKey) {
        try {
            // Placeholder: Claude browser auth logic
            console.log('[AutoBlog] Using Claude Browser Auth stub (requires complex flow)');
        } catch (e) { console.error('Claude Browser Auth failed', e); }
    }

    // 2. Try OpenAI Browser session
    if (config.openaiSessionToken) {
        try {
            console.log('[AutoBlog] Using OpenAI Browser Auth...');
            const sessionRes = await fetchWithBrowserSpoof('https://chatgpt.com/api/auth/session', {
                cookie: `__Secure-next-auth.session-token=${config.openaiSessionToken}`
            });

            if (sessionRes.ok) {
                const sessionData = await sessionRes.json();
                const accessToken = sessionData.accessToken;

                // Call ChatGPT conversation API
                // Note: Full implementation requires model selection and handling SSE
                // For now we keep this as a stub that logs success
                console.log('[AutoBlog] Successfully retrieved OpenAI Access Token');
            }
        } catch (e) { console.error('OpenAI Browser Auth failed', e); }
    }

    // 3. Try Claude Browser session
    if (config.claudeSessionKey) {
        try {
            console.log('[AutoBlog] Using Claude Browser Auth...');
            const orgsRes = await fetchWithBrowserSpoof('https://claude.ai/api/organizations', {
                cookie: `sessionKey=${config.claudeSessionKey}`
            });
            if (orgsRes.ok) {
                const orgs = await orgsRes.json();
                const orgId = orgs[0]?.uuid;
                console.log('[AutoBlog] Successfully retrieved Claude Org ID:', orgId);
            }
        } catch (e) { console.error('Claude Browser Auth failed', e); }
    }

    return null; // Fallback to official APIs if browser spoofing fails
}

async function getGoogleAccessToken(refreshToken: string) {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID || '',
                client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });
        const data = await response.json();
        return data.access_token;
    } catch { return null; }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Security Check
    const authHeader = request.headers.get('Authorization');
    const secretParam = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret) {
        if (authHeader !== `Bearer ${expectedSecret}` && secretParam !== expectedSecret) {
            return NextResponse.json({ error: 'Unauthorized CRON request' }, { status: 401 });
        }
    } else if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 403 });
    }

    if (!isPostgresConfigured) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Load AI Keys: prefer DB settings, fallback to env
    const aiConfig = await getAiConfig();
    logDebug(`Config loaded. useBrowser: ${aiConfig?.useBrowserAuth}`);

    const geminiKey = (aiConfig as any)?.geminiKey || process.env.GEMINI_API_KEY || '';
    const openaiKey = (aiConfig as any)?.openaiKey || process.env.OPENAI_API_KEY || '';
    // Use geminiModel from DB config, but reject known-bad values and default to gemini-2.0-flash
    const SAFE_GEMINI_MODEL = 'gemini-2.0-flash';
    const rawModel = (aiConfig as any)?.geminiModel || '';
    const geminiModel = (rawModel && rawModel !== 'gemini-flash-latest' && rawModel !== 'gemini-1.5-flash-latest') ? rawModel : SAFE_GEMINI_MODEL;
    logDebug(`Using Gemini model: ${geminiModel}`);

    const useBrowser = aiConfig.useBrowserAuth || aiConfig.browserEnabled;
    const preferredProvider = aiConfig.preferredProvider || 'gemini';

    try {
        // 1. Fetch next pending keyword
        const { rows: keywords } = await pool.query(
            `SELECT id, keyword FROM blog_keywords WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED`
        );

        if (keywords.length === 0) {
            return NextResponse.json({ message: 'No pending keywords. Add keywords to blog_keywords table.' });
        }

        const task = keywords[0];
        const keyword = task.keyword;

        // 2. Mark as processing
        await pool.query(
            `UPDATE blog_keywords SET status = 'processing', processed_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [task.id]
        );

        // 3. Generate cover image (optional, using OpenAI DALL-E)
        const coverImage = await generateCoverImage(keyword, openaiKey);

        // 4. Generate articles in each locale and save as DRAFT
        const results: Record<string, 'ok' | 'failed'> = {};
        let masterSlug = '';

        for (let i = 0; i < SUPPORTED_LOCALES.length; i++) {
            const locale = SUPPORTED_LOCALES[i];
            let articleData = null;

            // Add delay between locale requests to avoid rate limits (Gemini free tier: 15 RPM)
            if (i > 0) {
                logDebug(`Waiting 4s before next locale to respect rate limits...`);
                await new Promise(resolve => setTimeout(resolve, 4000));
            }

            // 4. Generate articles in each locale and save as DRAFT
            // We build an execution chain based on 'preferred' and 'enabled' settings
            const providerChain: string[] = [];
            const allProviders = ['gemini', 'openai', 'claude', 'browser'];

            // Add preferred first
            if (allProviders.includes(preferredProvider)) {
                providerChain.push(preferredProvider);
            }

            // Add others that are enabled and not already in chain
            if (aiConfig.geminiEnabled && !providerChain.includes('gemini')) providerChain.push('gemini');
            if (aiConfig.openaiEnabled && !providerChain.includes('openai')) providerChain.push('openai');
            if (aiConfig.claudeEnabled && !providerChain.includes('claude')) providerChain.push('claude');
            if (aiConfig.browserEnabled && !providerChain.includes('browser')) providerChain.push('browser');

            logDebug(`Provider chain for ${locale}: ${providerChain.join(' -> ')}`);

            const localePrompt = compilePrompt((aiConfig as any).masterPrompt, keyword, LANGUAGE_NAMES[locale] || 'English');

            for (const provider of providerChain) {
                if (articleData) break;

                try {
                    if (provider === 'gemini' && geminiKey) {
                        let activeGeminiKey = geminiKey;
                        // Gemini fallback to refresh token if enabled
                        if (aiConfig.browserEnabled && aiConfig.googleRefreshToken) {
                            const token = await getGoogleAccessToken(aiConfig.googleRefreshToken);
                            if (token) activeGeminiKey = token;
                        }
                        articleData = await generateArticleWithGemini(localePrompt, locale, activeGeminiKey, geminiModel);
                    }
                    else if (provider === 'openai' && openaiKey) {
                        articleData = await generateArticleWithOpenAI(localePrompt, locale, openaiKey);
                    }
                    else if (provider === 'claude' && (aiConfig.claudeKey || (aiConfig.browserEnabled && aiConfig.claudeSessionKey))) {
                        articleData = await generateArticleWithBrowser(localePrompt, keyword, locale, aiConfig);
                    }
                    else if (provider === 'browser' && (aiConfig.googleRefreshToken || aiConfig.openaiSessionToken || aiConfig.claudeSessionKey)) {
                        articleData = await generateArticleWithBrowser(localePrompt, keyword, locale, aiConfig);
                    }
                } catch (e: any) {
                    logDebug(`Provider ${provider} failed for ${locale}: ${e.message}`);
                }
            }


            if (!articleData) {
                results[locale] = 'failed';
                continue;
            }

            const { title, slug, excerpt, content } = articleData;

            // Build the slug: use base slug from first locale + locale suffix
            const baseSlug = slug
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            if (!masterSlug) masterSlug = baseSlug;

            // Locale-specific slug: all in english-slug-{locale} (except 'en' which stays as-is)
            const finalSlug = locale === 'en' ? baseSlug : `${baseSlug}-${locale}`;

            try {
                const cover = coverImage?.url || null;
                const coverAlt = coverImage?.alt || `${title} - CheckHost Blog`;

                // Inject cover alt as data attribute on cover_image for the frontend
                const coverData = cover ? JSON.stringify({ url: cover, alt: coverAlt }) : null;

                await pool.query(
                    `INSERT INTO posts (title, slug, excerpt, content, status, cover_image, author, ad_top, ad_bottom)
                     VALUES ($1, $2, $3, $4, 'draft', $5, $6, true, true)
                     ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, status = 'draft'`,
                    [title, finalSlug, excerpt, content, coverData ? cover : null, 'CheckHost Bot']
                );
                logDebug(`Locale ${locale} saved successfully to DB.`);
                results[locale] = 'ok';
            } catch (e: any) {
                logDebug(`DB insert failed for locale ${locale}: ${e.message}`);
                results[locale] = 'failed';
            }
        }

        // 5. Update keyword status based on results
        const successCount = Object.values(results).filter(v => v === 'ok').length;
        if (successCount > 0) {
            await pool.query(`UPDATE blog_keywords SET status = 'completed' WHERE id = $1`, [task.id]);
            logDebug(`Job finished. Success count: ${successCount}`);
        } else {
            await pool.query(`UPDATE blog_keywords SET status = 'failed' WHERE id = $1`, [task.id]);
            logDebug(`Job failed. All locales failed for keyword: "${keyword}"`);
        }

        return NextResponse.json({
            success: successCount > 0,
            keyword,
            slug: masterSlug,
            coverGenerated: !!coverImage,
            languagesGenerated: successCount,
            results,
        });

    } catch (error: any) {
        console.error('[AutoBlog] Error:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
