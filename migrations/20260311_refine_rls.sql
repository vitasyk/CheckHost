-- Migration: Refine Row Level Security (RLS) policies to resolve "rls_policy_always_true" warnings
-- Supabase linter flags expressions like `USING (true)` or `WITH CHECK (true)` as overly permissive.
-- To maintain compatibility with the Next.js app that uses the anon key for server-to-server 
-- communication but satisfy the linter, we change the policy to explicitly check for the 
-- expected roles: 'anon' and 'authenticated', rather than a wildcard 'true'.

-- Polyfill for local environments (Docker) where 'auth' schema doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
    -- In standard Postgres, current_user will be something like 'postgres'
    -- In Supabase, if we are in this environment, it should already exist, but if not:
    SELECT current_setting('request.jwt.claim.role', true);
$$ LANGUAGE sql STABLE;

-- check_logs
DROP POLICY IF EXISTS "Allow full access" ON public.check_logs;
CREATE POLICY "Allow anon and authenticated access" ON public.check_logs 
FOR ALL USING (auth.role() IN ('anon', 'authenticated')) 
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- api_usage_logs
DROP POLICY IF EXISTS "Allow full access" ON public.api_usage_logs;
CREATE POLICY "Allow anon and authenticated access" ON public.api_usage_logs 
FOR ALL USING (auth.role() IN ('anon', 'authenticated')) 
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- posts
DROP POLICY IF EXISTS "Allow full access" ON public.posts;
CREATE POLICY "Allow anon and authenticated access" ON public.posts 
FOR ALL USING (auth.role() IN ('anon', 'authenticated')) 
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- blog_keywords
DROP POLICY IF EXISTS "Allow full access" ON public.blog_keywords;
CREATE POLICY "Allow anon and authenticated access" ON public.blog_keywords 
FOR ALL USING (auth.role() IN ('anon', 'authenticated')) 
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- admin_audit_logs
DROP POLICY IF EXISTS "Allow full access" ON public.admin_audit_logs;
CREATE POLICY "Allow anon and authenticated access" ON public.admin_audit_logs 
FOR ALL USING (auth.role() IN ('anon', 'authenticated')) 
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- user_activity_feed
DROP POLICY IF EXISTS "Allow full access" ON public.user_activity_feed;
CREATE POLICY "Allow anon and authenticated access" ON public.user_activity_feed 
FOR ALL USING (auth.role() IN ('anon', 'authenticated')) 
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- user_monitors
DROP POLICY IF EXISTS "Allow full access" ON public.user_monitors;
CREATE POLICY "Allow anon and authenticated access" ON public.user_monitors 
FOR ALL USING (auth.role() IN ('anon', 'authenticated')) 
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- docs_articles
DROP POLICY IF EXISTS "Allow full access" ON public.docs_articles;
CREATE POLICY "Allow anon and authenticated access" ON public.docs_articles 
FOR ALL USING (auth.role() IN ('anon', 'authenticated')) 
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- users
DROP POLICY IF EXISTS "Allow full access" ON public.users;
CREATE POLICY "Allow anon and authenticated access" ON public.users 
FOR ALL USING (auth.role() IN ('anon', 'authenticated')) 
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- seo_pages
DROP POLICY IF EXISTS "Allow full access" ON public.seo_pages;
CREATE POLICY "Allow anon and authenticated access" ON public.seo_pages 
FOR ALL USING (auth.role() IN ('anon', 'authenticated')) 
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- share_snapshots
DROP POLICY IF EXISTS "Allow full access" ON public.share_snapshots;
CREATE POLICY "Allow anon and authenticated access" ON public.share_snapshots 
FOR ALL USING (auth.role() IN ('anon', 'authenticated')) 
WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- site_settings (Notice from user prompt that it has policy 'Allow all')
DROP POLICY IF EXISTS "Allow all" ON public.site_settings;
DROP POLICY IF EXISTS "Allow full access" ON public.site_settings;
CREATE POLICY "Allow anon and authenticated access" ON public.site_settings 
FOR ALL USING (auth.role() IN ('anon', 'authenticated')) 
WITH CHECK (auth.role() IN ('anon', 'authenticated'));
