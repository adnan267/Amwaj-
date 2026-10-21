# Al Amwaj Water Innovation — MERN website

The alamwaj.ae website rebuilt as a full-stack app:

- **client/** — React 18 + Vite + Tailwind CSS + Framer Motion. Public website and the admin dashboard (`/admin`).
- **server/** — Node.js + Express + MongoDB (Mongoose). REST API, sign-in, file uploads, SEO tags, sitemap.
- In production the Express server also serves the built React app, so you deploy **one** Node process.

## Run it on your computer

Requirements: Node.js 20 or newer, and MongoDB (local install or a free MongoDB Atlas cluster).

```bash
npm run install:all                 # installs root, server and client packages
cp server/.env.example server/.env  # then edit server/.env (MONGODB_URI, JWT_SECRET, admin login)
npm run seed                        # loads all content, photos and videos from the old site + creates the admin user
npm run dev                         # API on :5000, website on http://localhost:5173
```

Dashboard: http://localhost:5173/admin — sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`
(default `admin@alamwaj.ae` / `ChangeMe@2026`). **Change the password after the first sign-in** (Team & account).

`npm run seed -- --reset` (inside `server/`) wipes the content collections and reloads them. Users and enquiries are kept.

## Deploy on Vercel

The repo is ready for Vercel (`vercel.json` + `api/index.js`). The React site is served as static files and the Express API runs as one serverless function.

1. **Database:** create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas). In *Network Access* allow `0.0.0.0/0` (Vercel has no fixed IP). Copy the connection string, e.g. `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/alamwaj`.
2. **Import the repo** in Vercel. Leave **Root Directory empty** (the repo root, not `client/`) and set **Framework Preset: Other**. Build and output settings come from `vercel.json`.
3. **Environment variables** (Project → Settings → Environment Variables):
   | Name | Value |
   |---|---|
   | `MONGODB_URI` | your Atlas connection string |
   | `JWT_SECRET` | a long random string |
   | `SITE_URL` | `https://your-domain` (or the `.vercel.app` address) |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | the first dashboard login |
   | `NODE_ENV` | `production` |
4. **File uploads:** Project → Storage → Create → **Blob** → connect it to the project. This adds `BLOB_READ_WRITE_TOKEN` automatically. (Vercel's own disk is temporary, so photos uploaded from the dashboard must go to Blob.)
5. **Redeploy**, then open `https://your-domain/api/setup` **once**. It loads all the original content and creates the admin user. It refuses to run again after that.
6. Sign in at `/admin` and change the password.

Check `https://your-domain/api/health` any time: it shows whether the database is connected and which upload storage is active.

## Deploy (VPS, e.g. Hostinger / DigitalOcean / Contabo)

```bash
npm run install:all
npm run build                       # creates client/dist
# set NODE_ENV=production and SITE_URL=https://www.alamwaj.ae in server/.env
npm run seed                        # first time only
npm i -g pm2 && pm2 start ecosystem.config.cjs && pm2 save
```

Put Nginx (or the hosting panel's proxy) in front, pointing the domain to `http://127.0.0.1:5000`, and enable HTTPS (Let's Encrypt).
Allow uploads of at least 80 MB in Nginx: `client_max_body_size 100m;`

Back up two things: the MongoDB database and the `server/uploads/` folder (all photos and videos added from the dashboard live there).

> Shared cPanel hosting that only runs PHP will not run this. You need Node.js hosting or a VPS.
> Render / Railway also work, but their disks are temporary, so mount a persistent disk for `server/uploads`.

## What is in the dashboard

| Section | What it does |
|---|---|
| Overview | New / quoted / won enquiries, 30-day chart, pipeline, most requested services |
| Enquiries | Every contact-form lead. Status (New → Contacted → Quoted → Won/Lost), notes, one-click Call / WhatsApp / Email, search, CSV export, add phone leads by hand |
| Products & services | Create, edit, hide, reorder (drag) pages. Overview, included list, photos/videos, FAQs, icon, SEO title & description |
| Gallery | Multi-upload photos and videos, categories, captions, star items to show them on the home page |
| Brands / Testimonials | Logos and descriptions; client quotes (the home-page section appears once one exists) |
| Site settings | Logo, headline, about text, key facts, phone, WhatsApp, email, address, map, social links, terms, home SEO |
| Team & account | Add editors or admins, remove users, change password |

Uploaded images are resized to max 1920 px and converted to WebP automatically. Uploads go to `server/uploads/` on a VPS, or to Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set.
New enquiries can be emailed to the team: fill in the `SMTP_*` and `NOTIFY_EMAIL` values in `.env` (works with Gmail app passwords, Zoho, etc.).

## SEO

- Each page gets its own `<title>`, description, canonical URL and Open Graph tags from the server, so Google and WhatsApp previews see them without running JavaScript.
- `/sitemap.xml` is generated from the database; `/robots.txt` blocks `/admin`.
- Old URLs (`/jacuzzi.html`, `/about.html` …) redirect with **301** to the new ones (`/solutions/jacuzzi`, `/about`), so existing Google rankings carry over.

## API overview

Setup: `GET /api/setup` (only works on an empty database), `GET /api/health`.
Public: `GET /api/settings`, `GET /api/offerings`, `GET /api/offerings/:slug`, `GET /api/gallery`, `GET /api/brands`, `GET /api/testimonials`, `POST /api/enquiries` (rate-limited, honeypot spam trap).
Signed-in: `POST /api/auth/login|logout`, `GET /api/auth/me`, `PUT /api/auth/password`, `GET /api/stats`, `GET|PATCH|DELETE /api/enquiries…`, `GET /api/enquiries/export.csv`, CRUD on offerings / gallery / brands / testimonials, `PUT /api/settings`, `POST /api/uploads`, `/api/users` (admins).

## Project layout

```
server/
  src/index.js          Express app, security headers, static files, SEO shell
  src/routes/api.js     All API routes
  src/models/index.js   Mongoose models (User, Offering, GalleryItem, Brand, Testimonial, Enquiry, Setting)
  src/lib/              uploads (multer + sharp), email, SEO helpers
  seed/                 seed.js (CLI) and content extracted from the old site
  src/app.js            Express app (used by both the local server and Vercel)
api/index.js            Vercel serverless entry
vercel.json             Vercel build, function and routing config
client/
  src/pages/            Home, Listing, Detail, About, Brands, Gallery, Contact, Terms
  src/components/       PoolCanvas (animated hero water), Navbar, Layout, EnquiryForm, UI bits
  src/admin/            Dashboard screens
  public/media/         Original photos and videos from the old site
```
