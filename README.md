# Greenzone Learning Hub

Video learning site for Greenzone Academy.

- **Parents Hub** – one big video library. Parents create an account, pay a yearly subscription on Selar, then watch any video in any order. Finished videos are marked as watched.
- **Teachers Hub** – free for teachers. Training is organised into courses and modules; finishing one course unlocks the next. Teacher accounts are created by the admin.
- **Admin panel** – upload and organise videos, manage courses, parents, teachers, payments and settings.

## Run it on your computer

Needs Node.js 20 or newer and a Supabase project (the database and the uploaded videos live there).

```bash
cp .env.example .env   # then fill in the Supabase values
npm install
npm run setup
npm run dev
```

Open http://localhost:3000. Sign in as the admin with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`, then change the password on the Account page.

## Settings

| Name | What it is |
|---|---|
| `DATABASE_URL` | Supabase pooled connection (port 6543, ends with `?pgbouncer=true&connection_limit=1`). Used by the running site |
| `DIRECT_URL` | Supabase session pooler connection (port 5432). Used to create and update the tables |
| `SUPABASE_URL` | Project URL, like `https://abcd.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Secret (service role) key. Lets the site upload, play and delete video files. Keep it private |
| `SUPABASE_BUCKET` | Optional. Storage bucket for video files (default `videos`, created automatically) |
| `SELAR_WEBHOOK_KEY` | Secret that must be in the Selar webhook address. Use a long random value |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First admin account. Created on the first deploy; the password is never overwritten afterwards |
| `SITE_URL` | Public address of the site, used in emails and shown on the Settings page |
| `RESEND_API_KEY`, `MAIL_FROM` | Optional. Needed for "forgot password" emails. Without them the reset link is only printed in the server log |

## Connecting Selar

1. Admin panel → Settings: enter the yearly price and the Selar product link.
2. On Selar, set the product's redirect link to `SITE_URL/subscribe/return`.
3. Send Selar's payment notification to `SITE_URL/api/selar/webhook?key=SELAR_WEBHOOK_KEY`.

The webhook accepts any JSON or form notice that contains the buyer's email, and gives that account 12 months. If the buyer has no account yet, the payment waits and is applied when they sign up with the same email. The admin can also grant access by hand.

## Putting it online

The site runs on Vercel, with the database and video files in Supabase.

1. Create a Supabase project and copy the two connection strings (Connect > ORMs) and the project URL and secret key (Project Settings > API).
2. Import this repository in Vercel and add the settings from the table above as Environment Variables.
3. Deploy. Each deploy creates or updates the tables, makes sure the admin account exists, then builds the site (`npm run build:vercel`).
4. Add your domain in Vercel (Project > Settings > Domains) and point it there from your registrar.

Video files are uploaded from the browser straight to a private Supabase bucket, and are only played through short-lived links after the site has checked the viewer may watch. The largest file you can upload is set by your Supabase plan.

## Where things are

- `prisma/schema.prisma` – database tables
- `src/lib/access.ts` – who may watch what, course unlocking, subscriptions
- `src/app/api/selar/webhook` – Selar payment notice
- `src/lib/storage.ts` – video files in Supabase Storage
- `src/components/Player.tsx` – video player, resume and "watched" detection
- `src/app/admin` – admin panel
