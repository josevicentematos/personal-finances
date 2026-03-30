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

### Task 1:
- [x] Allow the user to edit movements
- [x] Remove the type of change (tipo de cambio en español) in the form for movement creation
- [x] Show the result in USD dollar according to the conversion rate of the expense made (or income) in the movements table. Use the value setup to calculate it.
- [x] In the summary tab show the balance of the accounts. Add a new selector/toggle in the accounts table to allow them to be shown in the summary table. Only the selected/toggled one should be shown