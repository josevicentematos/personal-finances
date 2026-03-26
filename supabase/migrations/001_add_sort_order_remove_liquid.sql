-- Migration: Add sort_order columns and remove liquid field
-- Run this on existing databases to update the schema

-- Add sort_order to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Add sort_order to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Add sort_order to recurring_payments
ALTER TABLE recurring_payments ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Remove liquid column from transactions (if it exists)
ALTER TABLE transactions DROP COLUMN IF EXISTS liquid;

-- Initialize sort_order based on created_at for existing rows
WITH ranked_accounts AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
  FROM accounts
)
UPDATE accounts SET sort_order = ranked_accounts.new_order
FROM ranked_accounts WHERE accounts.id = ranked_accounts.id;

WITH ranked_categories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
  FROM categories
)
UPDATE categories SET sort_order = ranked_categories.new_order
FROM ranked_categories WHERE categories.id = ranked_categories.id;

WITH ranked_recurring AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
  FROM recurring_payments
)
UPDATE recurring_payments SET sort_order = ranked_recurring.new_order
FROM ranked_recurring WHERE recurring_payments.id = ranked_recurring.id;
