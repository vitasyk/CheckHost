import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your-anon-key';

if (!isConfigured) {
    console.warn('Supabase credentials are missing or placeholders. Analytics logging will be disabled.');
}

export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as any);
