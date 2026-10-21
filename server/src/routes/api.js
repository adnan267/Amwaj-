import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User, Offering, GalleryItem, Brand, Testimonial, Enquiry, Setting } from '../models/index.js';
import { requireAuth, requireAdmin, signToken, setAuthCookie, COOKIE } from '../middleware/auth.js';
import mongoose from 'mongoose';
import { upload, saveFile, removeFile, STORAGE, IS_SERVERLESS, ALLOWED_TYPES, MAX_MB } from '../lib/upload.js';
import { runSeed } from '../lib/seed.js';
import { notifyEnquiry } from '../lib/mail.js';
import { crudRouter, wrap } from './crud.js';

const api = Router();

/* ================= Auth ================= */
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many sign-in attempts. Try again in 15 minutes.' } });

api.post('/auth/login', loginLimiter, wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Enter your email and password.' });
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  user.lastLoginAt = new Date();
  await user.save();
  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

api.post('/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

api.get('/auth/me', requireAuth, (req, res) => {
  const u = req.user;
  res.json({ user: { id: u._id, name: u.name, email: u.email, role: u.role } });
});

api.put('/auth/password', requireAuth, wrap(async (req, res) => {
  const { current, next } = req.body || {};
  if (!next || String(next).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(String(current || ''), user.passwordHash))) return res.status(400).json({ error: 'Current password is incorrect.' });
  user.passwordHash = await bcrypt.hash(String(next), 11);
  await user.save();
  res.json({ ok: true });
}));

/* ---- Team members (admins only) ---- */
api.get('/users', requireAuth, requireAdmin, wrap(async (_req, res) => {
  res.json(await User.find().sort({ createdAt: 1 }).lean());
}));
api.post('/users', requireAuth, requireAdmin, wrap(async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password || String(password).length < 8) return res.status(400).json({ error: 'Name, email and a password of at least 8 characters are required.' });
  if (await User.exists({ email: String(email).toLowerCase() })) return res.status(409).json({ error: 'A user with this email already exists.' });
  const u = await User.create({ name, email, role: role === 'admin' ? 'admin' : 'editor', passwordHash: await bcrypt.hash(String(password), 11) });
  res.status(201).json({ _id: u._id, name: u.name, email: u.email, role: u.role });
}));
api.delete('/users/:id', requireAuth, requireAdmin, wrap(async (req, res) => {
  if (String(req.user._id) === req.params.id) return res.status(400).json({ error: 'You cannot remove your own account.' });
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

/* ================= First-time setup ================= */
// Opening /api/setup once fills an empty database (handy on Vercel where you cannot run `npm run seed`).
// It refuses to run once any user exists.
api.get('/setup', wrap(async (_req, res) => {
  if (await User.exists({})) return res.status(403).json({ error: 'Setup has already been done. Sign in at /admin.' });
  const lines = [];
  await runSeed({ log: (m) => lines.push(m) });
  res.json({ ok: true, log: lines, next: 'Sign in at /admin with ADMIN_EMAIL and ADMIN_PASSWORD, then change the password.' });
}));

api.get('/health', wrap(async (_req, res) => {
  res.json({ ok: true, storage: STORAGE, db: mongoose.connection.readyState === 1 ? 'connected' : 'not connected' });
}));

/* ================= Uploads ================= */
api.get('/uploads/config', requireAuth, (_req, res) => res.json({ storage: STORAGE, maxMb: MAX_MB }));

// Vercel Blob: issues a short-lived token so the browser uploads directly to Blob storage.
api.post('/uploads/blob', wrap(async (req, res) => {
  if (STORAGE !== 'blob') return res.status(400).json({ error: 'Blob storage is not configured. Add BLOB_READ_WRITE_TOKEN.' });
  const { handleUpload } = await import('@vercel/blob/client');
  const isTokenRequest = req.body?.type === 'blob.generate-client-token';
  if (isTokenRequest && !signedIn(req)) return res.status(401).json({ error: 'Sign in to continue.' });
  const result = await handleUpload({
    body: req.body,
    request: req,
    onBeforeGenerateToken: async () => ({ allowedContentTypes: ALLOWED_TYPES, maximumSizeInBytes: MAX_MB * 1024 * 1024, addRandomSuffix: true }),
    onUploadCompleted: async () => {},
  });
  res.json(result);
}));

if (IS_SERVERLESS && STORAGE !== 'blob') {
  api.post('/uploads', requireAuth, (_req, res) => res.status(400).json({ error: 'Uploads need Vercel Blob storage on Vercel. In the Vercel project, open Storage, create a Blob store and connect it, then redeploy.' }));
}

api.post('/uploads', requireAuth, upload.array('files', 20), wrap(async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'Choose at least one file to upload.' });
  const saved = [];
  for (const f of req.files) saved.push({ ...(await saveFile(f)), name: f.originalname });
  res.status(201).json(saved);
}));

/* ================= Settings ================= */
const SETTING_FIELDS = ['companyName', 'shortName', 'tagline', 'heroTitle', 'heroText', 'aboutTitle', 'aboutText', 'phone', 'whatsapp', 'email', 'website', 'address', 'mapUrl', 'hours', 'logo', 'foundedYear', 'stats', 'social', 'termsHtml', 'seoTitle', 'seoDescription'];

api.get('/settings', wrap(async (_req, res) => {
  res.json((await Setting.findOne({ key: 'site' }).lean()) || {});
}));
api.put('/settings', requireAuth, wrap(async (req, res) => {
  const patch = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => SETTING_FIELDS.includes(k)));
  if (patch.whatsapp) patch.whatsapp = String(patch.whatsapp).replace(/\D/g, '');
  const doc = await Setting.findOneAndUpdate({ key: 'site' }, patch, { new: true, upsert: true });
  res.json(doc);
}));

/* ================= Offerings (products & services) ================= */
const OFFER_FIELDS = ['title', 'slug', 'serviceTitle', 'isProduct', 'isService', 'summary', 'overview', 'included', 'note', 'cover', 'icon', 'media', 'faqs', 'seoTitle', 'seoDescription', 'order', 'published'];
const pickOffer = (b) => Object.fromEntries(Object.entries(b || {}).filter(([k]) => OFFER_FIELDS.includes(k)));

api.get('/offerings', wrap(async (req, res) => {
  const filter = req.query.all === '1' ? {} : { published: true };
  if (req.query.kind === 'product') filter.isProduct = true;
  if (req.query.kind === 'service') filter.isService = true;
  const lite = req.query.lite === '1';
  const q = Offering.find(filter).sort({ order: 1, title: 1 });
  if (lite) q.select('title slug serviceTitle isProduct isService summary cover icon order published');
  res.json(await q.lean());
}));

api.get('/offerings/:slug', wrap(async (req, res) => {
  const doc = await Offering.findOne({ slug: req.params.slug, published: true }).lean();
  if (!doc) return res.status(404).json({ error: 'This page does not exist.' });
  res.json(doc);
}));

api.get('/offerings/id/:id', requireAuth, wrap(async (req, res) => {
  const doc = await Offering.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Item not found.' });
  res.json(doc);
}));

api.post('/offerings', requireAuth, wrap(async (req, res) => {
  const body = pickOffer(req.body);
  if (!body.title) return res.status(400).json({ error: 'Give the product or service a title.' });
  const last = await Offering.findOne().sort({ order: -1 }).lean();
  try {
    const doc = await Offering.create({ order: (last?.order ?? -1) + 1, ...body });
    res.status(201).json(doc);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Another page already uses this URL slug. Choose a different one.' });
    throw e;
  }
}));

api.put('/offerings/reorder', requireAuth, wrap(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  await Promise.all(ids.map((id, i) => Offering.updateOne({ _id: id }, { order: i })));
  res.json({ ok: true });
}));

api.put('/offerings/:id', requireAuth, wrap(async (req, res) => {
  const doc = await Offering.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Item not found.' });
  doc.set(pickOffer(req.body));
  try {
    await doc.save();
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Another page already uses this URL slug. Choose a different one.' });
    throw e;
  }
  res.json(doc);
}));

api.delete('/offerings/:id', requireAuth, wrap(async (req, res) => {
  const doc = await Offering.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Item not found.' });
  res.json({ ok: true });
}));

/* ================= Gallery / brands / testimonials ================= */
api.use('/gallery', crudRouter(GalleryItem, {
  fields: ['type', 'url', 'poster', 'caption', 'category', 'fit', 'featured', 'order'],
  onDelete: async (d) => { await removeFile(d.url); await removeFile(d.poster); },
}));
api.use('/brands', crudRouter(Brand, { fields: ['name', 'logo', 'description', 'website', 'category', 'order'], onDelete: (d) => removeFile(d.logo) }));
api.use('/testimonials', crudRouter(Testimonial, { fields: ['name', 'role', 'quote', 'published', 'order'], publicFilter: { published: true } }));

/* ================= Enquiries ================= */
const signedIn = (req) => {
  try { return Boolean(jwt.verify(req.cookies?.[COOKIE] || '', process.env.JWT_SECRET)); } catch { return false; }
};
const enquiryLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 8, skip: signedIn, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many enquiries from this connection. Please call or WhatsApp us instead.' } });

api.post('/enquiries', enquiryLimiter, wrap(async (req, res) => {
  const b = req.body || {};
  if (b.website_url) return res.status(201).json({ ok: true }); // honeypot: bots fill hidden fields
  if (!b.name || String(b.name).trim().length < 2) return res.status(400).json({ error: 'Enter your name.' });
  if (!b.phone && !b.email) return res.status(400).json({ error: 'Add a phone number or email so we can reply.' });
  if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) return res.status(400).json({ error: 'Check the email address.' });
  const doc = await Enquiry.create({
    name: b.name, phone: b.phone, email: b.email || undefined, interest: b.interest, location: b.location, message: b.message,
    source: ['website', 'whatsapp', 'phone', 'email', 'walk-in', 'referral'].includes(b.source) ? b.source : 'website',
  });
  notifyEnquiry(doc);
  res.status(201).json({ ok: true, id: doc._id });
}));

api.get('/enquiries', requireAuth, wrap(async (req, res) => {
  const { status, q, page = 1, limit = 25 } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }, { interest: rx }, { message: rx }, { location: rx }];
  }
  const lim = Math.min(100, Math.max(1, Number(limit)));
  const skip = (Math.max(1, Number(page)) - 1) * lim;
  const [items, total] = await Promise.all([
    Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
    Enquiry.countDocuments(filter),
  ]);
  res.json({ items, total, page: Number(page), pages: Math.max(1, Math.ceil(total / lim)) });
}));

api.get('/enquiries/export.csv', requireAuth, wrap(async (_req, res) => {
  const rows = await Enquiry.find().sort({ createdAt: -1 }).lean();
  const cols = ['createdAt', 'name', 'phone', 'email', 'interest', 'location', 'status', 'source', 'message'];
  const cell = (v) => `"${String(v instanceof Date ? v.toISOString() : v ?? '').replace(/"/g, '""')}"`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="enquiries.csv"');
  res.send('﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n'));
}));

api.patch('/enquiries/:id', requireAuth, wrap(async (req, res) => {
  const patch = {};
  if (req.body?.status) patch.status = req.body.status;
  for (const k of ['name', 'phone', 'email', 'interest', 'location', 'message']) if (k in (req.body || {})) patch[k] = req.body[k];
  const doc = await Enquiry.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
  if (!doc) return res.status(404).json({ error: 'Enquiry not found.' });
  res.json(doc);
}));

api.post('/enquiries/:id/notes', requireAuth, wrap(async (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Write a note first.' });
  const doc = await Enquiry.findByIdAndUpdate(req.params.id, { $push: { notes: { text, by: req.user.name } } }, { new: true });
  if (!doc) return res.status(404).json({ error: 'Enquiry not found.' });
  res.json(doc);
}));

api.delete('/enquiries/:id', requireAuth, wrap(async (req, res) => {
  await Enquiry.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

/* ================= Dashboard stats ================= */
api.get('/stats', requireAuth, wrap(async (_req, res) => {
  const since = new Date(Date.now() - 29 * 864e5);
  since.setHours(0, 0, 0, 0);
  const [byStatus, perDay, byInterest, counts, latest] = await Promise.all([
    Enquiry.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Enquiry.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, n: { $sum: 1 } } },
    ]),
    Enquiry.aggregate([{ $match: { interest: { $nin: [null, ''] } } }, { $group: { _id: '$interest', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }]),
    Promise.all([Offering.countDocuments({ isProduct: true }), Offering.countDocuments({ isService: true }), GalleryItem.countDocuments(), Brand.countDocuments(), Enquiry.countDocuments()]),
    Enquiry.find().sort({ createdAt: -1 }).limit(6).lean(),
  ]);
  const days = [];
  const map = Object.fromEntries(perDay.map((d) => [d._id, d.n]));
  for (let i = 0; i < 30; i++) {
    const d = new Date(since.getTime() + i * 864e5);
    const k = d.toISOString().slice(0, 10);
    days.push({ date: k, n: map[k] || 0 });
  }
  const status = Object.fromEntries(['new', 'contacted', 'quoted', 'won', 'lost'].map((s) => [s, byStatus.find((x) => x._id === s)?.n || 0]));
  res.json({
    totals: { products: counts[0], services: counts[1], gallery: counts[2], brands: counts[3], enquiries: counts[4] },
    status, days, byInterest: byInterest.map((x) => ({ name: x._id, n: x.n })), latest,
  });
}));

export default api;
