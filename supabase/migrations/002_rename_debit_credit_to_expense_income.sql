-- Rename debit and credit columns to expense and income
ALTER TABLE transactions RENAME COLUMN debit TO expense;
ALTER TABLE transactions RENAME COLUMN credit TO income;
