-- Add show_in_summary column to accounts table
-- This column controls whether an account is displayed in the summary page
ALTER TABLE accounts ADD COLUMN show_in_summary BOOLEAN NOT NULL DEFAULT FALSE;
