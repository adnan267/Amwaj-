import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import api from './routes/api.js';
import { UPLOAD_DIR } from './lib/upload.js';
import { metaFor, renderShell, sitemapXml, LEGACY } from './lib/seo.js';
import { Offering } from './models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../../client/dist');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Set it in server/.env (local) or in the Vercel project settings.');
}

/* ---- MongoDB: one cached connection, reused across serverless invocations ---- */
let conn = globalThis.__amwajMongo;
export function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!conn) {
    conn = globalThis.__amwajMongo = mongoose
      .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/alamwaj', { serverSelectionTimeoutMS: 10000 })
      .catch((e) => { conn = globalThis.__amwajMongo = null; throw e; });
  }
  return conn;
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        mediaSrc: ["'self'", 'blob:', 'https:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'data:'],
        frameSrc: ["'self'", 'https://www.google.com', 'https://maps.google.com'],
        connectSrc: ["'self'", 'https://*.vercel-storage.com', 'https://vercel.com'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use(['/api', '/sitemap.xml'], async (_req, res, next) => {
  try { await connectDB(); next(); }
  catch (e) {
    console.error('MongoDB connection failed:', e.message);
    res.status(503).json({ error: 'Database is not reachable. Check MONGODB_URI (on Vercel use a MongoDB Atlas URI and allow access from 0.0.0.0/0).' });
  }
});
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));
app.use('/api', api);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route.' }));

/* ---- SEO helpers ---- */
app.get('/robots.txt', (_req, res) => {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ''}`);
});
app.get('/sitemap.xml', async (_req, res, next) => {
  try { res.type('application/xml').send(await sitemapXml()); } catch (e) { next(e); }
});

/* ---- 301s from the old static site ---- */
app.get(/\.html$/, async (req, res, next) => {
  if (LEGACY[req.path]) return res.redirect(301, LEGACY[req.path]);
  const slug = req.path.slice(1, -5);
  if (/^[a-z0-9-]+$/.test(slug) && (await Offering.exists({ slug }))) return res.redirect(301, `/solutions/${slug}`);
  next();
});

/* ---- React app (production build) ---- */
// Vercel serves the built files itself; we only render the HTML shell (with SEO tags) for page routes.
const SHELL = ['_shell.html', 'index.html'].map((f) => path.join(DIST, f)).find((f) => fs.existsSync(f));
if (SHELL) {
  app.use(express.static(DIST, { index: false, maxAge: '1y', setHeaders: (res, p) => { if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } }));
  app.get('*', async (req, res, next) => {
    let meta = { tags: '<title>Al Amwaj Water Innovation</title>', status: 200 };
    try {
      await connectDB();
      meta = await metaFor(req.path);
    } catch (e) {
      console.error('SEO tags skipped:', e.message); // still serve the app so the page can show its own error
    }
    try { res.status(meta.status).type('html').send(renderShell(SHELL, meta.tags)); } catch (e) { next(e); }
  });
} else {
  app.get('/', (_req, res) => res.send('API is running. Build the client (npm run build) or run the Vite dev server on port 5173.'));
}

/* ---- Errors ---- */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join(' ') });
  if (err.name === 'CastError') return res.status(400).json({ error: 'That ID is not valid.' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: `File is too large. The limit is ${process.env.MAX_UPLOAD_MB || 80} MB.` });
  if (err.message?.startsWith('Only images')) return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server. Try again.' });
});


export default app;
