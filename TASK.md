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


### Task 2:
- [x] Ability to edit recurrent payments
- [x] Being able to select a recurrent payment from the create movement form, if selected automatically add the amount of the recurrent payment, the name as description and check it as payed automatically once the movement is created
- [x] Reset recurrent payments each new month

### Task 3:
- [x] Whenever you edit a movement it gets put at the bottom again, as if it had a new date set. Editing a movement should not move it around the table, whatever timestamp you save in the DB should not be modified when editing a movement.
- [x] Under "total balance"/"saldo total" in the summary tab, in the balance of the accounts add a new balance that would be the amount of the main account minus the total of the recurrent payments that have not been checked yet. Name this balance "Real balance" in English.


### Task 4:
- [x] The automatic monthly reset of the recurrent payments cannot be done via localStorage as I will also use this website on my phone. It needs to work across devices.
- [x] Add a separator by month in the Categories tab as well, just like the Movements tab. That way I can see how much was spent or how much income I had in the categories across the months.