GREENZONE LEARNING HUB - cPanel (Upperlink) package
====================================================

This zip is already built. Do NOT upload it into public_html.

1. cPanel > File Manager: create a folder next to public_html, e.g.  greenzone-hub
   Upload this zip into it and Extract. (app.js must sit directly inside the folder.)
   Do not create a node_modules folder yourself.

2. cPanel > Setup Node.js App > Create Application
     Node.js version:      20 or newer (18.18 is the minimum)
     Application mode:     Production
     Application root:     greenzone-hub
     Application URL:      your domain or subdomain
     Application startup file:  app.js

3. In the same screen add these Environment variables:
     ADMIN_EMAIL        the email the admin signs in with
     ADMIN_PASSWORD     a strong password, 8+ characters
     SELAR_WEBHOOK_KEY  any long random text (keep it secret)
     SITE_URL           https://your-domain

4. Click "Run NPM Install", wait until it finishes, then click "Restart".

5. Make sure SSL (https) is on for the domain: sign-in only works over https.

6. Open the site, click Sign in, and use the admin email and password.

Your data lives in the  data  folder (database: data/hub.db, uploaded videos: data/videos).
Back that folder up. When you install a newer version of the site, replace everything
EXCEPT the data folder.

If the site shows an error, open the app in Setup Node.js App and check the log file
(stderr.log in the application folder) - the last lines say what went wrong.
