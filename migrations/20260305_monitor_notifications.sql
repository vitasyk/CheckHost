-- Migration: Add notification fields to user_monitors
-- Date: 2026-03-05

ALTER TABLE user_monitors
    ADD COLUMN IF NOT EXISTS notify_email TEXT,
    ADD COLUMN IF NOT EXISTS notify_telegram TEXT;

COMMENT ON COLUMN user_monitors.notify_email IS 'Email address that receives alert/recovery notifications for this monitor';
COMMENT ON COLUMN user_monitors.notify_telegram IS 'Telegram chat_id (or username) for Telegram notifications — future use';
