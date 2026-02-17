const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            let value = valueParts.join('=');
            value = value.trim().replace(/^["'](.*)["']$/, '$1');
            process.env[key.trim()] = value;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndMigrate() {
    console.log('--- Supabase Connection Test ---');
    console.log('URL:', supabaseUrl);

    // 1. Check if table exists by trying a select
    const { data: testData, error: testError } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1);

    if (testError) {
        if (testError.message.includes('relation "site_settings" does not exist')) {
            console.error('CRITICAL: Table "site_settings" does NOT exist in Supabase.');
            console.log('\nPlease run this SQL in your Supabase Dashboard SQL Editor:\n');
            console.log(`
CREATE TABLE site_settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read (optional, or restricted to admin)
CREATE POLICY "Public read access" ON site_settings FOR SELECT USING (true);

-- Create policy for service role / authenticated update
CREATE POLICY "Allow all for service role" ON site_settings USING (true) WITH CHECK (true);
            `);
            return;
        } else {
            console.error('Supabase Error:', testError);
            return;
        }
    }

    console.log('Successfully connected to Supabase "site_settings" table.');

    // 2. Migration: Sync local file to DB
    const SETTINGS_FILE = path.join(process.cwd(), 'site-settings.json');
    if (fs.existsSync(SETTINGS_FILE)) {
        console.log('Found local site-settings.json. Migrating...');
        try {
            const content = fs.readFileSync(SETTINGS_FILE, 'utf8');
            const allSettings = JSON.parse(content);

            for (const [key, value] of Object.entries(allSettings)) {
                if (value === null || value === undefined) {
                    console.log(`Skipping key: ${key} (value is null/undefined)`);
                    continue;
                }
                console.log(`Migrating key: ${key}...`);
                const { error } = await supabase
                    .from('site_settings')
                    .upsert({
                        key,
                        value,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'key' });

                if (error) {
                    console.error(`Failed to migrate ${key}:`, error.message);
                } else {
                    console.log(`Successfully migrated ${key}`);
                }
            }
            console.log('Migration complete.');
        } catch (err) {
            console.error('Migration failed:', err.message);
        }
    } else {
        console.log('No local site-settings.json found to migrate.');
    }
}

checkAndMigrate();
