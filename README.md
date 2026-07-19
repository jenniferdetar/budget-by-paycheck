# Budget by Paycheck

A budgeting app built around how you actually get paid: every pay period gets its own
Income, Bills, Expenses, Savings, and Debt sections, each tracked as Budget vs. Actual —
based on the "Budget by Paycheck" Excel template.

## Features

- Unlimited pay periods (not capped at a fixed number of paychecks)
- Income, Bills, Expenses, Savings, and Debt sections per period, each with Budget vs. Actual
- Expense Tracker that logs individual purchases and rolls them up into the matching
  expense category's Actual total (mirrors the spreadsheet's `SUMIF` behavior)
- Reusable References list of recurring bills/expenses/savings/debts with default
  amounts, auto-filled when you add a matching line item to a pay period
- Per-period summary (Income vs. total planned/actual outflow, and what's left over)
- Cloud sync via Supabase, with email/password auth and per-user row-level security

## Stack

- [Vite](https://vitejs.dev/) + React + React Router
- [Supabase](https://supabase.com/) (Postgres + Auth) for data storage
- Deployed on [Vercel](https://vercel.com/)

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon/publishable key
npm run dev
```

## Database schema

See `supabase/schema.sql` for the full schema (`pay_periods`, `line_items`,
`expense_entries`, `reference_items`), all with row-level security scoped to
`auth.uid()`.
