-- Add dark mode color variant to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color_dark TEXT DEFAULT NULL;

-- Add color support (light + dark) to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS color_dark TEXT DEFAULT NULL;
