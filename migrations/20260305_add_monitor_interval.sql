-- Migration: Add check_interval_hours to user_monitors
-- Date: 2026-03-05

ALTER TABLE user_monitors
    ADD COLUMN IF NOT EXISTS check_interval_hours INTEGER DEFAULT 24;

COMMENT ON COLUMN user_monitors.check_interval_hours IS 'Interval in hours between automatic checks for this monitor';

-- Update existing records to 24h as a safe default
UPDATE user_monitors SET check_interval_hours = 24 WHERE check_interval_hours IS NULL;
