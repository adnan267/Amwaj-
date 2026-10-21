import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { api } from '../lib/api.js';
import { PageTitle, Card, Field, ImageField, Toggle, useToast, useConfirm, Empty, Badge } from './ui.jsx';

/** Generic list + modal editor for small collections. */
function Collection({ endpoint, title, text, noun, blank, render, form, emptyText }) {
  const [items, setItems] = useState(null);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  useEffect(() => { api.get(`${endpoint}?all=1`).then(setItems, (e) => toast(e.message, 'err')); }, [endpoint, toast]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const doc = edit._id ? await api.put(`${endpoint}/${edit._id}`, edit) : await api.post(endpoint, edit);
      setItems((x) => (edit._id ? x.map((y) => (y._id === doc._id ? doc : y)) : [...x, doc]));
      setEdit(null);
      toast(`${noun} saved`);
    } catch (e2) { toast(e2.message, 'err'); } finally { setSaving(false); }
  };
  const remove = async (it) => {
    if (!(await confirm({ title: `Delete this ${noun.toLowerCase()}?`, action: 'Delete', danger: true }))) return;
    await api.del(`${endpoint}/${it._id}`);
    setItems((x) => x.filter((y) => y._id !== it._id));
    toast(`${noun} deleted`);
  };

  return (
    <>
      <PageTitle title={title} text={text}><button className="btn-dark !py-2.5" onClick={() => setEdit({ ...blank })}><Plus className="h-4 w-4" />Add {noun.toLowerCase()}</button></PageTitle>
      {!items ? <div className="h-64 animate-pulse rounded-3xl bg-white" /> : items.length === 0 ? (
        <Empty title={`No ${noun.toLowerCase()}s yet`} text={emptyText}><button className="btn-dark" onClick={() => setEdit({ ...blank })}>Add {noun.toLowerCase()}</button></Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => (
            <Card key={it._id} className="flex flex-col">
              <div className="flex-1">{render(it)}</div>
              <div className="mt-5 flex gap-2 border-t border-line pt-4">
                <button className="btn-line !px-4 !py-1.5 text-sm" onClick={() => setEdit({ ...it })}><Pencil className="h-3.5 w-3.5" />Edit</button>
                <button className="ml-auto rounded-lg px-2 text-mute hover:bg-red-50 hover:text-red-600" onClick={() => remove(it)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <AnimatePresence>
        {edit && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEdit(null)}>
            <motion.form onSubmit={save} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }}
              className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl bg-white p-7">
              <h2 className="text-2xl font-bold">{edit._id ? `Edit ${noun.toLowerCase()}` : `Add ${noun.toLowerCase()}`}</h2>
              {form(edit, (k, v) => setEdit((x) => ({ ...x, [k]: v })))}
              <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn-line !py-2.5" onClick={() => setEdit(null)}>Cancel</button><button className="btn-dark !py-2.5" disabled={saving}>{saving ? 'Saving' : 'Save'}</button></div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function Brands() {
  return (
    <Collection endpoint="/brands" title="Brands" text="Manufacturers shown on the Brands page and the home page." noun="Brand"
      blank={{ name: '', logo: '', description: '', website: '', category: '' }}
      emptyText="Add the equipment brands you supply and install."
      render={(b) => (
        <>
          <div className="flex h-14 items-center">{b.logo ? <img src={b.logo} alt="" className="max-h-14 object-contain" /> : <span className="font-display text-2xl font-bold text-navy">{b.name}</span>}</div>
          {b.logo && <p className="mt-2 font-semibold">{b.name}</p>}
          {b.category && <p className="mt-2 text-sm font-semibold text-cyan">{b.category}</p>}
          <p className="mt-1 text-sm text-mute">{b.description || 'No description yet.'}</p>
        </>
      )}
      form={(b, set) => (
        <>
          <Field label="Name"><input className="input" required value={b.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <ImageField label="Logo" aspect="aspect-[3/1]" contain value={b.logo} onChange={(v) => set('logo', v)} />
          <Field label="What we supply from them" hint="e.g. Pool heat pumps and heat exchangers"><textarea className="input" value={b.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category"><input className="input" value={b.category} onChange={(e) => set('category', e.target.value)} /></Field>
            <Field label="Website"><input className="input" type="url" placeholder="https://" value={b.website || ''} onChange={(e) => set('website', e.target.value)} /></Field>
          </div>
        </>
      )}
    />
  );
}

export function Testimonials() {
  return (
    <Collection endpoint="/testimonials" title="Testimonials" text="Client quotes. The section appears on the home page once at least one is live." noun="Testimonial"
      blank={{ name: '', role: '', quote: '', published: true }}
      emptyText="Ask happy clients for a sentence or two about working with you, then add them here."
      render={(t) => (
        <>
          <p className="leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
          <p className="mt-4 font-semibold">{t.name}</p>
          <p className="text-sm text-mute">{t.role}</p>
          {!t.published && <div className="mt-2"><Badge tone="amber">Hidden</Badge></div>}
        </>
      )}
      form={(t, set) => (
        <>
          <Field label="Quote"><textarea className="input min-h-[120px]" required value={t.quote} onChange={(e) => set('quote', e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client name"><input className="input" required value={t.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Role or project" hint="e.g. Villa owner, Sharjah"><input className="input" value={t.role} onChange={(e) => set('role', e.target.value)} /></Field>
          </div>
          <Toggle checked={t.published} onChange={(v) => set('published', v)} label="Show on the website" />
        </>
      )}
    />
  );
}
