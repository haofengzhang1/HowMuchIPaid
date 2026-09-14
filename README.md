# How Much I Paid

A small spending notebook: log in, record what you and others spend, and see totals in charts.

Data lives in **Supabase Postgres**. Prisma talks to it from the Next.js app.

## Connect Supabase

1. Open your project at [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **Project Settings → Database → Connect**.
3. Copy the two URIs into `.env`:

```bash
cp .env.example .env
```

- **Transaction pooler** (port `6543`) → `DATABASE_URL`  
  Add `?pgbouncer=true&sslmode=require` if they are not already on the URI.
- **Direct connection** (port `5432`) → `DIRECT_URL`  
  Add `?sslmode=require` if needed.

The password is the database password for the `postgres` user (reset it under Database settings if you forgot it).

4. Create the tables and generate the client:

```bash
npx prisma db push
```

5. Optional: copy existing local SQLite rows into Supabase:

```bash
node --experimental-sqlite scripts/copy-sqlite-to-postgres.mjs
```

6. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
