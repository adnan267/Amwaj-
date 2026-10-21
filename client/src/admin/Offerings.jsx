import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Reorder } from 'framer-motion';
import { Plus, GripVertical, ExternalLink, Trash2, X, Video } from 'lucide-react';
import { api } from '../lib/api.js';
import { OfferingIcon } from '../components/ui.jsx';
import { PageTitle, Card, Field, Toggle, Badge, ImageField, ListEditor, UploadButton, useToast, useConfirm, Empty } from './ui.jsx';

export const ICONS = {
  Drop: 'M24 5C16 16 12 22 12 29a12 12 0 0024 0C36 22 32 16 24 5zM18 30a6 6 0 006 6',
  Flame: 'M24 6c2 8 10 10 10 20a10 10 0 01-20 0c0-5 3-7 5-11 1 3 3 4 5 4 0-5-2-8 0-13z',
  Pump: 'M10 30a10 10 0 1020 0 10 10 0 10-20 0M30 30h10M20 20V10h10',
  Waterfall: 'M10 8h28M14 8v10M24 8v18M34 8v12M8 40q4-5 8 0t8 0 8 0 8 0',
  Plant: 'M24 40V22M24 28c-8 0-10-6-10-12 8 0 10 6 10 12zM24 24c6 0 9-5 9-10-7 0-9 5-9 10zM12 40h24',
  Sprinkler: 'M24 6v8M12 18h24l-4 6H16zM16 30v6M24 30v10M32 30v6',
  Waves: 'M6 18q4-5 9 0t9 0 9 0 9 0M6 28q4-5 9 0t9 0 9 0 9 0M6 38q4-5 9 0t9 0 9 0 9 0',
  Tiles: 'M8 8h14v14H8zM26 8h14v14H26zM8 26h14v14H8zM26 26h14v14H26z',
  Steam: 'M16 40c-4-5 4-8 0-13s4-8 0-13M24 40c-4-5 4-8 0-13s4-8 0-13M32 40c-4-5 4-8 0-13s4-8 0-13',
  Heat: 'M24 6v22M18 28a6 6 0 1012 0c0-2-1-3-2-4V8a4 4 0 00-8 0v16c-1 1-2 2-2 4z',
  Filter: 'M8 10h32L28 26v12l-8 4V26z',
  Wrench: 'M30 8a9 9 0 00-9 12L8 33a3.5 3.5 0 005 5l13-13a9 9 0 0012-9l-6 6-5-1-1-5z',
  Build: 'M6 40h36M10 40V20l14-10 14 10v20M20 40V28h8v12',
};

export function OfferingList() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('all');
  const toast = useToast();
  useEffect(() => { api.get('/offerings?all=1&lite=1').then(setItems, (e) => toast(e.message, 'err')); }, [toast]);

  const saveOrder = async (next) => {
    setItems(next);
    try { await api.put('/offerings/reorder', { ids: next.map((x) => x._id) }); } catch (e) { toast(e.message, 'err'); }
  };
  const togglePub = async (o) => {
    const doc = await api.put(`/offerings/${o._id}`, { published: !o.published });
    setItems((xs) => xs.map((x) => (x._id === o._id ? { ...x, published: doc.published } : x)));
    toast(doc.published ? `${o.title} is live` : `${o.title} is hidden from the website`);
  };

  const shown = (items || []).filter((o) => filter === 'all' || (filter === 'product' ? o.isProduct : o.isService));

  return (
    <>
      <PageTitle title="Products & services" text="Each item has its own page on the website. Drag to change the order.">
        <Link to="/admin/offerings/new" className="btn-dark !py-2.5"><Plus className="h-4 w-4" />New page</Link>
      </PageTitle>
      <div className="mb-5 flex gap-1.5">
        {[['all', 'All'], ['product', 'Products'], ['service', 'Services']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-4 py-2 text-sm font-medium ${filter === k ? 'bg-navy text-white' : 'bg-white text-mute hover:text-ink'}`}>{l}</button>
        ))}
      </div>
      {!items ? <div className="h-96 animate-pulse rounded-3xl bg-white" /> : items.length === 0 ? (
        <Empty title="No products or services yet" text="Add your first one to give it a page on the website."><Link to="/admin/offerings/new" className="btn-dark">New page</Link></Empty>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={filter === 'all' ? saveOrder : () => {}} className="space-y-2">
          {shown.map((o) => (
            <Reorder.Item key={o._id} value={o} dragListener={filter === 'all'} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-3 pr-5">
              {filter === 'all' && <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-mute active:cursor-grabbing" aria-label="Drag to reorder" />}
              <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-navy">
                {o.cover ? <img src={o.cover} alt="" className="h-full w-full object-cover" /> : <OfferingIcon path={o.icon} className="h-6 w-6 text-cyan-300" />}
              </div>
              <Link to={`/admin/offerings/${o._id}`} className="min-w-0 flex-1">
                <p className="truncate font-semibold hover:text-navy">{o.title}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">{o.isProduct && <Badge tone="blue">Product</Badge>}{o.isService && <Badge tone="gray">Service</Badge>}{!o.published && <Badge tone="amber">Hidden</Badge>}</div>
              </Link>
              <div className="hidden sm:block"><Toggle checked={o.published} onChange={() => togglePub(o)} label="Live" /></div>
              <Link to={`/admin/offerings/${o._id}`} className="btn-line !px-4 !py-2 text-sm">Edit</Link>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </>
  );
}

const BLANK = { title: '', slug: '', serviceTitle: '', isProduct: true, isService: false, summary: '', overview: '', included: [], note: '', cover: '', icon: ICONS.Drop, media: [], faqs: [], seoTitle: '', seoDescription: '', published: true };

export function OfferingForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [f, setF] = useState(id ? null : BLANK);
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? (v.target.type === 'checkbox' ? v.target.checked : v.target.value) : v }));

  useEffect(() => { if (id) api.get(`/offerings/id/${id}`).then((d) => setF({ ...BLANK, ...d }), (e) => toast(e.message, 'err')); }, [id, toast]);
  if (!f) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;

  async function save(e) {
    e.preventDefault();
    if (!f.isProduct && !f.isService) return toast('Choose whether this is a product, a service, or both.', 'err');
    setSaving(true);
    try {
      const doc = id ? await api.put(`/offerings/${id}`, f) : await api.post('/offerings', f);
      toast('Changes saved');
      if (!id) nav(`/admin/offerings/${doc._id}`, { replace: true });
      else setF({ ...BLANK, ...doc });
    } catch (e2) { toast(e2.message, 'err'); } finally { setSaving(false); }
  }
  async function remove() {
    if (!(await confirm({ title: `Delete ${f.title}?`, text: 'Its page will be removed from the website. This cannot be undone.', action: 'Delete page', danger: true }))) return;
    await api.del(`/offerings/${id}`);
    toast('Page deleted');
    nav('/admin/offerings');
  }
  const media = f.media || [];

  return (
    <form onSubmit={save}>
      <PageTitle title={id ? f.title || 'Edit page' : 'New product or service'} text={id && f.slug ? `alamwaj.ae/solutions/${f.slug}` : 'Fill in the details, then save.'}>
        {id && <a className="btn-line !py-2.5" href={`/solutions/${f.slug}`} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4" />View page</a>}
        <button className="btn-dark !py-2.5" disabled={saving}>{saving ? 'Saving' : 'Save changes'}</button>
      </PageTitle>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card className="grid gap-5 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2"><input className="input" required value={f.title} onChange={set('title')} /></Field>
            <Field label="Short name in the services list" hint="Optional, e.g. 'Swimming Pool' instead of the full title"><input className="input" value={f.serviceTitle || ''} onChange={set('serviceTitle')} /></Field>
            <Field label="Page address" hint="Letters, numbers and dashes. Left empty, it is made from the title."><input className="input" value={f.slug} onChange={set('slug')} placeholder="water-softening-plants" /></Field>
            <div className="flex flex-wrap gap-6 sm:col-span-2">
              <Toggle checked={f.isProduct} onChange={set('isProduct')} label="Show under Products" />
              <Toggle checked={f.isService} onChange={set('isService')} label="Show under Services" />
              <Toggle checked={f.published} onChange={set('published')} label="Live on the website" />
            </div>
            <Field label="One-line summary" hint="Shown on cards and in search results" className="sm:col-span-2"><input className="input" value={f.summary} onChange={set('summary')} maxLength={200} /></Field>
            <Field label="Overview" hint="The opening paragraph on the page" className="sm:col-span-2"><textarea className="input min-h-[140px]" value={f.overview} onChange={set('overview')} /></Field>
            <Field label="Good to know" className="sm:col-span-2"><textarea className="input min-h-[80px]" value={f.note} onChange={set('note')} /></Field>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-bold">What is included</h2>
            <ListEditor value={f.included} onChange={set('included')} placeholder="e.g. Installation and commissioning" />
          </Card>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Photos and videos</h2>
              <UploadButton multiple label="Add files" className="btn-line !py-2 text-sm" onDone={(files) => set('media')([...media, ...files.map((x) => ({ type: x.type, url: x.url, caption: '', fit: 'cover' }))])} />
            </div>
            {media.length === 0 ? <p className="text-sm text-mute">No photos or videos yet. They appear in a gallery on the page.</p> : (
              <Reorder.Group axis="y" values={media} onReorder={set('media')} className="space-y-2">
                {media.map((m, i) => (
                  <Reorder.Item key={m._id || m.url} value={m} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5">
                    <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-mute" />
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-foam">
                      {m.type === 'video' ? (m.poster ? <img src={m.poster} alt="" className="h-full w-full object-cover" /> : <Video className="m-auto mt-4 h-6 w-6 text-mute" />) : <img src={m.url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <input className="input !py-2 text-sm" placeholder="Caption" value={m.caption || ''} onChange={(e) => set('media')(media.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} aria-label="Caption" />
                    {m.type === 'image' && (
                      <select className="input !w-28 !py-2 text-sm" value={m.fit} onChange={(e) => set('media')(media.map((x, j) => (j === i ? { ...x, fit: e.target.value } : x)))} aria-label="Image fit">
                        <option value="cover">Fill</option><option value="contain">Fit</option>
                      </select>
                    )}
                    <button type="button" className="rounded-lg p-2 text-mute hover:bg-red-50 hover:text-red-600" onClick={() => set('media')(media.filter((_, j) => j !== i))} aria-label="Remove"><X className="h-4 w-4" /></button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-bold">Questions people ask</h2>
            <div className="space-y-3">
              {(f.faqs || []).map((q, i) => (
                <div key={i} className="grid gap-2 rounded-2xl border border-line p-3">
                  <div className="flex gap-2">
                    <input className="input !py-2" placeholder="Question" value={q.q} onChange={(e) => set('faqs')(f.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                    <button type="button" className="rounded-lg px-2 text-mute hover:text-red-600" onClick={() => set('faqs')(f.faqs.filter((_, j) => j !== i))} aria-label="Remove question"><X className="h-4 w-4" /></button>
                  </div>
                  <textarea className="input !py-2" placeholder="Answer" value={q.a} onChange={(e) => set('faqs')(f.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
                </div>
              ))}
              <button type="button" className="btn-line !py-2 text-sm" onClick={() => set('faqs')([...(f.faqs || []), { q: '', a: '' }])}><Plus className="h-4 w-4" />Add question</button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card><ImageField label="Main photo" value={f.cover} onChange={set('cover')} /></Card>
          <Card>
            <span className="label">Icon</span>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(ICONS).map(([name, p]) => (
                <button type="button" key={name} title={name} aria-label={name} aria-pressed={f.icon === p} onClick={() => set('icon')(p)}
                  className={`flex aspect-square items-center justify-center rounded-xl border transition ${f.icon === p ? 'border-navy bg-navy text-white' : 'border-line text-navy hover:border-navy'}`}>
                  <OfferingIcon path={p} className="h-6 w-6" />
                </button>
              ))}
            </div>
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg font-bold">Search engines</h2>
            <Field label="Page title" hint={`${(f.seoTitle || '').length}/60. Empty uses '${f.title} in Sharjah, UAE'`}><input className="input" value={f.seoTitle || ''} onChange={set('seoTitle')} /></Field>
            <Field label="Description" hint={`${(f.seoDescription || '').length}/160. Empty uses the summary`}><textarea className="input" value={f.seoDescription || ''} onChange={set('seoDescription')} /></Field>
          </Card>
          {id && <button type="button" onClick={remove} className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:underline"><Trash2 className="h-4 w-4" />Delete this page</button>}
        </div>
      </div>
    </form>
  );
}
