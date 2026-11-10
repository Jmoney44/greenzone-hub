# Greenzone Learning Hub

Video learning site for Greenzone Academy.

- **Parents Hub** – one big video library. Parents create an account, pay a yearly subscription on Selar, then watch any video in any order. Finished videos are marked as watched.
- **Teachers Hub** – free for teachers. Training is organised into courses and modules; finishing one course unlocks the next. Teacher accounts are created by the admin.
- **Admin panel** – upload and organise videos, manage courses, parents, teachers, payments and settings.

## Run it on your computer

Needs Node.js 20 or newer.

```bash
npm install
npm run setup
npm run dev
```

Open http://localhost:3000. Sign in as the admin with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` (copy `.env.example` to `.env` first if it is missing), then change the password on the Account page.

## Settings in `.env`

| Name | What it is |
|---|---|
| `DATABASE_URL` | Where the database file lives |
| `SELAR_WEBHOOK_KEY` | Secret that must be in the Selar webhook address. Use a long random value |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First admin account, created by `npm run seed` |
| `SITE_URL` | Public address of the site, used in emails and shown on the Settings page |
| `STORAGE_DIR` | Optional. Folder for uploaded video files (default `storage/videos`) |
| `RESEND_API_KEY`, `MAIL_FROM` | Optional. Needed for "forgot password" emails. Without them the reset link is only printed in the server log |

## Connecting Selar

1. Admin panel → Settings: enter the yearly price and the Selar product link.
2. On Selar, set the product's redirect link to `SITE_URL/subscribe/return`.
3. Send Selar's payment notification to `SITE_URL/api/selar/webhook?key=SELAR_WEBHOOK_KEY`.

The webhook accepts any JSON or form notice that contains the buyer's email, and gives that account 12 months. If the buyer has no account yet, the payment waits and is applied when they sign up with the same email. The admin can also grant access by hand.

## Putting it online

Run it on a server with a permanent disk (a VPS, Railway or Render with a volume), because the database file and uploaded videos are stored on disk:

```bash
npm install
npm run setup
npm run build
npm start
```

Back up `prisma/dev.db` (or wherever `DATABASE_URL` points) and the video storage folder.

## Where things are

- `prisma/schema.prisma` – database tables
- `src/lib/access.ts` – who may watch what, course unlocking, subscriptions
- `src/app/api/selar/webhook` – Selar payment notice
- `src/components/Player.tsx` – video player, resume and "watched" detection
- `src/app/admin` – admin panel
