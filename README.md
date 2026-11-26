# Invoice Builder

A web app for creating, cloning and downloading PDF invoices, with admin-approved accounts, invoice history and yearly totals.

## Features

- **Accounts with approval.** Anyone can sign up, but new accounts wait on a "pending approval" screen until an admin approves them on the **Users** page. Admins can also reject or revoke access and promote other admins.
- **Invoice editor with live preview.** Business and client details, invoice number, issue and due dates, PO number, currency, line items with optional details, per-line taxable flag, tax (name and rate), percent or fixed discount, shipping/fees, amount already paid, notes, terms and payment details. Column labels can be renamed.
- **Templates:** Blank, Software Developer, Web Development, Travel Agency, Consulting Agency and IT Service. Each sets its own column labels, extra fields (for example Destination and Travel dates for travel, or Project and Sprint for developers), sample items and accent colour.
- **Clone** any invoice into a new draft with the next number and today's date.
- **PDF download**, generated on the server so it matches the preview.
- **History** with search and filters for status and year, and a **dashboard** with the current year's total invoiced, paid, outstanding and a monthly chart. Drafts and cancelled invoices are not counted in totals.
- **Business settings** (company details, logo, tax number, default currency and tax rate, numbering prefix, default terms and payment details) prefill every new invoice. Clients are remembered for next time.

## Tech stack

Next.js 15 (App Router, TypeScript, Server Actions) · Tailwind CSS 4 · PostgreSQL with Prisma · @react-pdf/renderer · cookie sessions signed with `jose`, passwords hashed with bcrypt.

## Run it locally

Requirements: Node.js 20+ and either Docker or a local PostgreSQL.

```bash
cp .env.example .env          # then edit AUTH_SECRET and ADMIN_EMAIL
docker compose up -d          # starts PostgreSQL on localhost:5432
npm install
npm run db:migrate            # creates the tables
npm run dev                   # http://localhost:3000
```

Sign up with the email you put in `ADMIN_EMAIL`. That account is the admin and is approved automatically. Everyone else waits for your approval.

## Deploy for free (Vercel + Supabase)

1. **Supabase** (database): create a free project at supabase.com. Click **Connect** at the top of the project and copy two connection strings:
   - *Transaction pooler* (port 6543): use it for `DATABASE_URL` and add `?pgbouncer=true` at the end.
   - *Session pooler* or *Direct connection* (port 5432): use it for `DIRECT_URL`.

   Replace `[YOUR-PASSWORD]` in both with your database password.
2. **Vercel** (hosting): at vercel.com choose **Add New → Project**, import `oramirez1/invoice-builder`, and under **Environment Variables** add `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (run `openssl rand -base64 32` to make one) and `ADMIN_EMAIL`. Click **Deploy**.

   The `vercel-build` script runs the database migrations automatically on every deploy.
3. Open the site and sign up with your `ADMIN_EMAIL`.

Free-tier note: Supabase pauses free projects after a week with no activity. Open the Supabase dashboard and click **Restore** if that happens.

## Project layout

```
app/(auth)        login and signup
app/pending       waiting-for-approval page
app/(app)         signed-in pages: dashboard, invoices, settings, admin
app/api/.../pdf   PDF download route
components/       editor, preview and shared UI
lib/templates.ts  invoice template profiles (edit here to add one)
lib/calc.ts       totals maths shared by preview, server and PDF
lib/pdf.tsx       PDF layout
prisma/           database schema and migrations
```
