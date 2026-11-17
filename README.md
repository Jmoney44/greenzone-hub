# Greenzone Learning Hub

Video learning site for Greenzone Academy.

- **Parents Hub**: one video library. Parents create an account, pay a yearly subscription on Selar, then watch any video in any order. Finished videos are marked as watched.
- **Teachers Hub**: free for teachers. Training is organised into courses and modules; finishing one course unlocks the next.
- **Admin panel**: upload and organise videos, manage courses, parents, teachers, payments and settings.

## How it is built

A plain website (React + Vite), like the attendance site. It is built into ordinary files that go in `public_html` on any shared hosting, so no Node.js app runs on the server. Sign-in, the database and the video files are in **Supabase**. Database rules decide who may see what, so the public key in `config.js` cannot be used to read anything it should not.

| Folder | What it is |
|---|---|
| `src/` | The website |
| `supabase/setup.sql` | Creates the tables, the security rules and the private `videos` storage bucket |
| `supabase/functions/selar-webhook/` | Receives Selar's payment notice and opens the library for 12 months |
| `public/config.js` | Supabase address and public key, edited on the server |

## Setting it up

### 1. Supabase
1. Create a project at supabase.com.
2. Open `supabase/setup.sql`, put your email on the line `admin_email text := '...'` near the end, paste the whole file into **SQL Editor** and click **Run**.
3. **Authentication > Sign In / Providers > Email**: turn **Confirm email** off, so parents can sign in straight after signing up. (Supabase's built-in email service only sends to your own team.)
4. **Authentication > URL Configuration**: set **Site URL** to `https://greenzonelearninghub.com` and add `https://greenzonelearninghub.com/**` under **Redirect URLs**.
5. Optional, for "forgot password" emails: **Authentication > Emails > SMTP Settings**. You can use an email account from cPanel (host `mail.greenzonelearninghub.com`, port 465). Without it the admin can still set a new password for anyone on the Parents and teachers page.

### 2. Selar payments
1. **Edge Functions > Deploy a new function > Via editor**. Name it `selar-webhook`, paste `supabase/functions/selar-webhook/index.ts`, and click **Deploy**.
2. In the function's settings turn **Verify JWT** off (Selar does not send one).
3. **Edge Functions > Secrets**: add `SELAR_WEBHOOK_KEY` with any long random text.
4. On Selar, set the redirect link to `https://greenzonelearninghub.com/subscribe/return` and the webhook to the address shown in the admin panel under Settings.

### 3. Upload the site
1. Build it with `npm install` then `npm run package`. This makes `greenzone-hub-upload.zip`.
2. In cPanel **File Manager**, open the domain's folder (`public_html`, or the `greenzonelearninghub.com` folder), upload the zip and **Extract** it there.
3. Edit `config.js` in that folder: paste the **Project URL** and the public **anon** (or publishable) key from Supabase > Project Settings > API. Never put the secret / service_role key there.
4. Open the site, click **Sign up** with the administrator email from step 1, and you land in the admin panel.

### Video files
Uploaded videos go straight from the admin's browser to the private Supabase bucket and are played through links that expire after six hours, only for people allowed to watch them. Supabase's free plan accepts files up to 50 MB each and 1 GB in total; for longer videos use an unlisted YouTube link or upgrade Supabase.

### Teachers
In the admin panel, **Parents and teachers > Add a teacher**: enter their name and email, then ask them to sign up with that email. Their account opens the Teachers Hub, free.

## Working on the code

```bash
cp .env.example .env   # fill in the Supabase URL and public key
npm install
npm run dev
```

`npm run build` checks the types and builds `dist/`. `npm run package` also zips it for upload.
