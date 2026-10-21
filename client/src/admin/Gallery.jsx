import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, Play } from 'lucide-react';
import { api } from '../lib/api.js';
import { PageTitle, UploadButton, useToast, useConfirm, Empty } from './ui.jsx';

export default function Gallery() {
  const [items, setItems] = useState(null);
  const [cat, setCat] = useState('All');
  const [uploadCat, setUploadCat] = useState('Projects');
  const toast = useToast();
  const confirm = useConfirm();
  useEffect(() => { api.get('/gallery').then(setItems, (e) => toast(e.message, 'err')); }, [toast]);

  const cats = useMemo(() => [...new Set(['Projects', ...(items || []).map((g) => g.category)])], [items]);
  const shown = (items || []).filter((g) => cat === 'All' || g.category === cat);

  const added = async (files) => {
    const created = [];
    for (const f of files) created.push(await api.post('/gallery', { type: f.type, url: f.url, caption: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), category: f.type === 'video' ? 'Videos' : uploadCat }));
    setItems((x) => [...x, ...created]);
    toast(`${created.length} ${created.length === 1 ? 'file' : 'files'} added to the gallery`);
  };
  const patch = async (g, body) => {
    setItems((x) => x.map((y) => (y._id === g._id ? { ...y, ...body } : y)));
    try { await api.put(`/gallery/${g._id}`, body); } catch (e) { toast(e.message, 'err'); }
  };
  const remove = async (g) => {
    if (!(await confirm({ title: 'Remove from the gallery?', text: 'The file is deleted from the server.', action: 'Remove', danger: true }))) return;
    await api.del(`/gallery/${g._id}`);
    setItems((x) => x.filter((y) => y._id !== g._id));
    toast('Removed from the gallery');
  };

  return (
    <>
      <PageTitle title="Gallery" text="Starred items also appear in 'Recent work' on the home page.">
        <label className="flex items-center gap-2 text-sm"><span className="text-mute">New photos go in</span>
          <input list="gal-cats" className="input !w-44 !py-2" value={uploadCat} onChange={(e) => setUploadCat(e.target.value)} aria-label="Category for new uploads" />
          <datalist id="gal-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <UploadButton multiple label="Upload photos or videos" onDone={added} />
      </PageTitle>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {['All', ...cats].map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-2 text-sm font-medium ${cat === c ? 'bg-navy text-white' : 'bg-white text-mute hover:text-ink'}`}>{c}</button>
        ))}
      </div>

      {!items ? <div className="h-96 animate-pulse rounded-3xl bg-white" /> : shown.length === 0 ? (
        <Empty title="Nothing here yet" text="Upload photos of finished projects. Real work builds trust faster than anything else on the site." />
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence>
            {shown.map((g) => (
              <motion.div layout key={g._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="relative aspect-[4/3] bg-foam">
                  <img src={g.type === 'video' ? g.poster || '' : g.url} alt="" className={`h-full w-full ${g.fit === 'contain' ? 'object-contain p-2' : 'object-cover'}`} />
                  {g.type === 'video' && <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-deep/70 px-2 py-1 text-xs text-white"><Play className="h-3 w-3" />Video</span>}
                  <button onClick={() => patch(g, { featured: !g.featured })} aria-pressed={g.featured} aria-label={g.featured ? 'Remove from home page' : 'Show on home page'}
                    className={`absolute right-2 top-2 rounded-full p-2 backdrop-blur transition ${g.featured ? 'bg-amber-400 text-deep' : 'bg-white/80 text-mute hover:text-ink'}`}>
                    <Star className="h-4 w-4" fill={g.featured ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="space-y-2 p-3">
                  <input className="input !rounded-lg !px-3 !py-1.5 text-sm" value={g.caption} placeholder="Caption" aria-label="Caption"
                    onChange={(e) => setItems((x) => x.map((y) => (y._id === g._id ? { ...y, caption: e.target.value } : y)))} onBlur={(e) => patch(g, { caption: e.target.value })} />
                  <div className="flex gap-2">
                    <input list="gal-cats" className="input !rounded-lg !px-3 !py-1.5 text-sm" defaultValue={g.category} aria-label="Category" onBlur={(e) => e.target.value !== g.category && patch(g, { category: e.target.value || 'Projects' })} />
                    <button onClick={() => remove(g)} className="rounded-lg px-2 text-mute hover:bg-red-50 hover:text-red-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}
