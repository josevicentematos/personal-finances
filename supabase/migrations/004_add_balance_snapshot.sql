-- Add balance_snapshot column to transactions table
ALTER TABLE transactions ADD COLUMN balance_snapshot NUMERIC(15, 2);
