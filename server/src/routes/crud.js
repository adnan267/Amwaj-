import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Small CRUD router used for gallery, brands and testimonials.
 * GET is public (optionally filtered by `publicFilter`); writes need a signed-in user.
 */
export function crudRouter(Model, { fields, sort = { order: 1, createdAt: -1 }, publicFilter = {}, onDelete } = {}) {
  const r = Router();
  const pick = (body) => Object.fromEntries(Object.entries(body || {}).filter(([k]) => fields.includes(k)));

  r.get('/', wrap(async (req, res) => {
    const filter = req.query.all === '1' ? {} : publicFilter;
    res.json(await Model.find(filter).sort(sort).lean());
  }));

  r.post('/', requireAuth, wrap(async (req, res) => {
    const last = await Model.findOne().sort({ order: -1 }).lean();
    const doc = await Model.create({ order: (last?.order ?? -1) + 1, ...pick(req.body) });
    res.status(201).json(doc);
  }));

  r.put('/reorder', requireAuth, wrap(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    await Promise.all(ids.map((id, i) => Model.updateOne({ _id: id }, { order: i })));
    res.json({ ok: true });
  }));

  r.put('/:id', requireAuth, wrap(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: 'Item not found.' });
    res.json(doc);
  }));

  r.delete('/:id', requireAuth, wrap(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Item not found.' });
    if (onDelete) await onDelete(doc);
    res.json({ ok: true });
  }));

  return r;
}

export { wrap };
