# Personal Finance App — PRD

## Overview

A personal web-based finance tracker to replace a Google Spreadsheet workflow. Built with React + TypeScript on the frontend, Supabase as the database and auth backend, deployed on Vercel. Single-user app protected by a master password. All monetary values are in Uruguayan Pesos (UYU) unless noted.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth)
- **Deployment:** Vercel
- **Package manager:** npm

## Validation Commands

- build: `npm run build`
- typecheck: `npm run typecheck`
- lint: `npm run lint`
- dev: `npm run dev`

## History
Commit every change you make properly. Do not attribute anything to Claude.

## File Structure

```
src/
├── components/       # Reusable UI components
├── pages/            # Page-level components (Transactions, Accounts, Categories, Recurrents, Settings)
├── lib/              # Supabase client, helpers, types
├── hooks/            # Custom React hooks
└── types/            # TypeScript interfaces
```

---

## Tasks

### Phase 1: Project Setup

- [ ] Initialize Vite + React + TypeScript project with Tailwind CSS configured
- [ ] Install and configure Supabase JS client; add `.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Set up ESLint + TypeScript strict mode; add `typecheck`, `lint`, and `build` scripts to `package.json`
- [ ] Create folder structure: `src/components`, `src/pages`, `src/lib`, `src/hooks`, `src/types`
- [ ] Define all TypeScript interfaces in `src/types/index.ts`: `Transaction`, `Account`, `Category`, `RecurringPayment`, `AppSettings`

### Phase 2: Supabase Schema

- [ ] Write `supabase/schema.sql` with table definitions for: `accounts`, `categories`, `transactions`, `recurring_payments`, `app_settings`
- [ ] Add the `accounts` table: `id`, `name`, `balance` (numeric), `created_at`
- [ ] Add the `categories` table: `id`, `name`, `created_at`
- [ ] Add the `transactions` table: `id`, `date`, `description`, `category_id` (FK), `account_id` (FK), `debit` (numeric, nullable), `credit` (numeric, nullable), `liquid` (boolean), `dollar_rate` (numeric), `created_at`
- [ ] Add the `recurring_payments` table: `id`, `name`, `amount` (numeric), `is_paid` (boolean), `created_at`
- [ ] Add the `app_settings` table: single-row table with `id`, `dollar_rate` (numeric), `master_password_hash` (text)
- [ ] Add seed SQL for default categories: Income, Recurrents, Groceries, Takeout, Misc, Cash, Savings
- [ ] Add seed SQL for default accounts: Main Bank Account, Second Bank Account, Savings, Cash

### Phase 3: Authentication

- [ ] Build `src/pages/LoginPage.tsx` — a simple password input form; on submit, hash the input and compare against `app_settings.master_password_hash` from Supabase
- [ ] Implement auth state in `src/lib/auth.ts` using `localStorage` to store a session token (hashed password match); export `isAuthenticated()`, `login()`, `logout()`
- [ ] Add a route guard component `src/components/ProtectedRoute.tsx` that redirects to `/login` if not authenticated
- [ ] Wire up React Router with routes: `/login`, `/` (transactions), `/accounts`, `/categories`, `/recurrents`, `/settings`

### Phase 4: Layout & Navigation

- [ ] Build `src/components/Layout.tsx` — sidebar navigation with links to all sections, app title, and a logout button
- [ ] Build `src/components/Sidebar.tsx` — nav items: Transactions, Accounts, Categories, Recurring Payments, Settings
- [ ] Make layout responsive: sidebar collapses to a bottom nav on mobile

### Phase 5: Accounts Page

- [x] Build `src/pages/AccountsPage.tsx` — displays a list of all accounts with their current balance
- [x] Add an "Add Account" form (name + initial balance) that inserts into Supabase `accounts` table
- [x] Add a "Delete Account" button per row with a confirmation dialog; deletes from Supabase
- [x] Add an "Edit Balance" inline input per account row that updates the balance directly in Supabase
- [x] Add an "Edit Account" button per row with a confirmation dialog

### Phase 6: Categories Page

- [x] Build `src/pages/CategoriesPage.tsx` — displays all categories
- [x] For each category, calculate and display the total credited and debited from the `transactions` table
- [x] Add an "Add Category" form (name only) that inserts into Supabase
- [x] Add a "Delete Category" button per row (with warning if transactions reference it)
- [x] Add an "Edit Category" button per row (with warning if transactions reference it)

### Phase 7: Dollar Rate Settings

- [ ] Build `src/pages/SettingsPage.tsx` — shows a single editable input for the current UYU/USD conversion rate
- [ ] On save, update the `dollar_rate` field in `app_settings` in Supabase
- [ ] Display the current rate prominently; include a "last updated" timestamp

### Phase 8: Recurring Payments

- [ ] Build `src/pages/RecurringPage.tsx` — displays all recurring payments as a checklist table with columns: Name, Amount, Paid
- [ ] Add a "Mark as Paid" toggle (checkbox) per row that updates `is_paid` in Supabase
- [ ] Add an "Add Recurring Payment" form: name + amount, inserts into Supabase with `is_paid = false`
- [ ] Add a "Delete" button per recurring payment row
- [ ] Display a "Real Money" calculation at the bottom: `Main Account Balance − sum of unpaid recurring payments`; pull main account balance from `accounts` and unpaid amounts from `recurring_payments where is_paid = false`

### Phase 9: Transactions Page

- [ ] Build `src/pages/TransactionsPage.tsx` — displays all transactions in a table sorted by date descending
- [ ] Table columns: Date, Description, Category, Account, Debit, Credit, Liquid, Dollar Rate
- [ ] Add an "Add Transaction" button that opens a modal/drawer form
- [ ] Build `src/components/TransactionForm.tsx` — form fields: date (date picker), description (text), category (dropdown from `categories`), account (dropdown from `accounts`), debit (number, optional), credit (number, optional), liquid (checkbox), dollar rate (pre-filled from `app_settings.dollar_rate`)
- [ ] On form submit, insert transaction into Supabase and update the referenced account's balance: add `credit`, subtract `debit`
- [ ] Add row-level delete for transactions with a confirmation prompt; reverse the balance change on delete
- [ ] Add basic filters on the transactions table: filter by month/year, by account, by category

### Phase 10: Polish & Deployment

- [ ] Add loading spinners and empty states for all pages
- [ ] Add error boundary component to catch and display Supabase errors gracefully
- [ ] Ensure all number fields display with 2 decimal places and use locale formatting (UYU)
- [ ] Add a `vercel.json` with SPA redirect rule so React Router works on Vercel
- [ ] Add `README.md` with setup instructions: Supabase project creation, running the schema SQL, environment variables, and Vercel deployment steps


### Phase 11: Allow to edit accounts and categories
- [x] Add an "Edit Account" button per row with a confirmation dialog
- [x] Add an "Edit Category" button per row (with warning if transactions reference it)


### Phase 12: More changes
- [x] Add a functionality that would allow the user to select an account as their main account
- [x] Recurring payments should be calculated against this account marked as the main account
- [x] Total balance should be calculated only from those accounts marked as Main


### Phase 13: Localization
- [x] Add spanish language to the whole app


### Phase 14: More changes again
- [x] In the movements tab there should be tabs that separates the movements by month
- [x] The order of movements should be least recent (from that month) to more recent on the top
- [x] Remove the liquid field, it's not necessary anymore
- [x] Accounts table should be reordable
- [x] Categories table should be reordable
- [x] Recurrent payments table should be reordable


### Phase 15: Summary tab
- [x] Add a summary tab, this tab should be the first one in the left menu
- [x] This tab should include a graphic that summarizes all expenses for that month, it should also show a table with the last 5 movements


### Phase 16: SQL Schema
- [x] The schema should not have any default categories or accounts