-- Add last_recurring_reset column to app_settings table
-- This column stores the month (YYYY-MM) when recurring payments were last reset
ALTER TABLE app_settings ADD COLUMN last_recurring_reset TEXT;
