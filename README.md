# How Much I Paid

Log spending for yourself and other people. Accounts and expenses are stored in Supabase Postgres.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill `DATABASE_URL` and `DIRECT_URL` from Supabase → Database → Connect.
3. Set `AUTH_SECRET` to a long random string.
4. `npx prisma db push`
5. `npm run dev`

Sign up at http://localhost:3000. New accounts show up in Supabase **Table Editor → users** (`email` and `password_hash`).
