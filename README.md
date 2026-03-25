# Personal Finance App

A personal web-based finance tracker built with React, TypeScript, and Supabase.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL)
- **Deployment:** Vercel

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings > API** and copy:
   - Project URL
   - `anon` public key

### 2. Run the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/schema.sql`
3. Run the SQL to create tables and seed data

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

### 6. Default Login

The default master password is: `admin`

To change it, update the `master_password_hash` in the `app_settings` table with the SHA-256 hash of your new password.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Deployment to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

The `vercel.json` file is already configured for SPA routing.

## Features

- **Transactions:** Track income and expenses with categories
- **Accounts:** Manage multiple bank accounts with balances
- **Categories:** Organize transactions by category
- **Recurring Payments:** Track recurring bills and calculate "real money"
- **Settings:** Configure USD/UYU exchange rate
- **Authentication:** Password-protected access
