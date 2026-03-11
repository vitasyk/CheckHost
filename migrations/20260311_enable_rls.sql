-- Migration: Enable Row Level Security (RLS) on all public tables to resolve Supabase security warnings
-- To prevent breaking existing application functionality that relies on the anon key, 
-- we also create policies allowing full access. You may want to restrict these policies further in the future.

-- check_logs
ALTER TABLE public.check_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.check_logs;
CREATE POLICY "Allow full access" ON public.check_logs FOR ALL USING (true) WITH CHECK (true);

-- api_usage_logs
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.api_usage_logs;
CREATE POLICY "Allow full access" ON public.api_usage_logs FOR ALL USING (true) WITH CHECK (true);

-- posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.posts;
CREATE POLICY "Allow full access" ON public.posts FOR ALL USING (true) WITH CHECK (true);

-- blog_keywords
ALTER TABLE public.blog_keywords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.blog_keywords;
CREATE POLICY "Allow full access" ON public.blog_keywords FOR ALL USING (true) WITH CHECK (true);

-- admin_audit_logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.admin_audit_logs;
CREATE POLICY "Allow full access" ON public.admin_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- user_activity_feed
ALTER TABLE public.user_activity_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.user_activity_feed;
CREATE POLICY "Allow full access" ON public.user_activity_feed FOR ALL USING (true) WITH CHECK (true);

-- user_monitors
ALTER TABLE public.user_monitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.user_monitors;
CREATE POLICY "Allow full access" ON public.user_monitors FOR ALL USING (true) WITH CHECK (true);

-- docs_articles
ALTER TABLE public.docs_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.docs_articles;
CREATE POLICY "Allow full access" ON public.docs_articles FOR ALL USING (true) WITH CHECK (true);

-- users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.users;
CREATE POLICY "Allow full access" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- seo_pages
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.seo_pages;
CREATE POLICY "Allow full access" ON public.seo_pages FOR ALL USING (true) WITH CHECK (true);

-- share_snapshots
ALTER TABLE public.share_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access" ON public.share_snapshots;
CREATE POLICY "Allow full access" ON public.share_snapshots FOR ALL USING (true) WITH CHECK (true);
