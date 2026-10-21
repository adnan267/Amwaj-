import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Plus, X, Phone, Mail, Trash2 } from 'lucide-react';
import { api, waLink } from '../lib/api.js';
import { PageTitle, Badge, STATUS, timeAgo, Empty, useToast, useConfirm, Field } from './ui.jsx';
import { WhatsAppIcon } from '../components/ui.jsx';

function Drawer({ item, onClose, onChange, onDelete }) {
  const [note, setNote] = useState('');
  const toast = useToast();
  const confirm = useConfirm();
  if (!item) return null;

  const setStatus = async (status) => {
    try { onChange(await api.patch(`/enquiries/${item._id}`, { status })); toast(`Marked as ${STATUS[status].label.toLowerCase()}`); }
    catch (e) { toast(e.message, 'err'); }
  };
  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    try { onChange(await api.post(`/enquiries/${item._id}/notes`, { text: note })); setNote(''); }
    catch (e2) { toast(e2.message, 'err'); }
  };
  const del = async () => {
    if (!(await confirm({ title: 'Delete this enquiry?', text: `${item.name}'s enquiry and its notes will be removed permanently.`, action: 'Delete', danger: true }))) return;
    await api.del(`/enquiries/${item._id}`);
    toast('Enquiry deleted');
    onDelete(item._id);
  };

  return (
    <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-deep/40" onClick={onClose} />
      <motion.aside role="dialog" aria-modal="true" aria-label={`Enquiry from ${item.name}`} className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 38 }}>
        <div className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div><h2 className="text-2xl font-bold">{item.name}</h2><p className="mt-1 text-sm text-mute">Received {new Date(item.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} via {item.source}</p></div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-foam" aria-label="Close"><X /></button>
        </div>
        <div className="space-y-6 p-6">
          <div className="flex flex-wrap gap-2">
            {item.phone && <a className="btn-line !px-4 !py-2 text-sm" href={`tel:${item.phone}`}><Phone className="h-4 w-4" />Call</a>}
            {item.phone && <a className="btn !px-4 !py-2 bg-[#25D366] text-sm text-white" target="_blank" rel="noopener" href={waLink(item.phone.replace(/^0/, '971'), `Hello ${item.name.split(' ')[0]}, this is Al Amwaj Water Innovation regarding your enquiry${item.interest ? ` about ${item.interest}` : ''}.`)}><WhatsAppIcon className="h-4 w-4" />WhatsApp</a>}
            {item.email && <a className="btn-line !px-4 !py-2 text-sm" href={`mailto:${item.email}?subject=${encodeURIComponent('Your enquiry with Al Amwaj Water Innovation')}`}><Mail className="h-4 w-4" />Email</a>}
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[['Phone', item.phone], ['Email', item.email], ['Interested in', item.interest], ['Location', item.location]].map(([k, v]) => (
              <div key={k}><dt className="text-mute">{k}</dt><dd className="mt-0.5 break-words font-medium">{v || 'Not given'}</dd></div>
            ))}
          </dl>
          {item.message && <div><h3 className="mb-2 text-sm font-semibold text-mute">Message</h3><p className="whitespace-pre-wrap rounded-2xl bg-foam p-4">{item.message}</p></div>}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-mute">Status</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS).map(([k, v]) => (
                <button key={k} onClick={() => setStatus(k)} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${item.status === k ? 'border-navy bg-navy text-white' : 'border-line hover:border-navy'}`}>{v.label}</button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-mute">Notes</h3>
            <ul className="space-y-2">
              {(item.notes || []).map((n) => <li key={n._id} className="rounded-2xl border border-line p-3 text-sm"><p className="whitespace-pre-wrap">{n.text}</p><p className="mt-1 text-xs text-mute">{n.by}, {timeAgo(n.at)}</p></li>)}
            </ul>
            <form onSubmit={addNote} className="mt-3 flex gap-2">
              <input className="input !py-2.5" placeholder="e.g. Site visit booked for Sunday" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn-dark shrink-0 whitespace-nowrap !py-2">Add note</button>
            </form>
          </div>
          <button onClick={del} className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:underline"><Trash2 className="h-4 w-4" />Delete enquiry</button>
        </div>
      </motion.aside>
    </motion.div>
  );
}

function NewEnquiry({ onClose, onCreated }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', interest: '', location: '', message: '', source: 'phone' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post('/enquiries', f); onCreated(); } catch (e2) { setErr(e2.message); }
  };
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.form onSubmit={submit} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="grid w-full max-w-xl gap-4 rounded-3xl bg-white p-7 sm:grid-cols-2">
        <h2 className="text-2xl font-bold sm:col-span-2">Add an enquiry</h2>
        <p className="-mt-2 text-sm text-mute sm:col-span-2">Log a lead that came by phone, WhatsApp or a visit, so it is tracked with the others.</p>
        <Field label="Name"><input className="input" required value={f.name} onChange={set('name')} /></Field>
        <Field label="Came in by">
          <select className="input" value={f.source} onChange={set('source')}>{['phone', 'whatsapp', 'email', 'walk-in', 'referral', 'website'].map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="Phone"><input className="input" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Email"><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Interested in"><input className="input" value={f.interest} onChange={set('interest')} /></Field>
        <Field label="Location"><input className="input" value={f.location} onChange={set('location')} /></Field>
        <Field label="Details" className="sm:col-span-2"><textarea className="input min-h-[90px]" value={f.message} onChange={set('message')} /></Field>
        {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{err}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn-line !py-2.5" onClick={onClose}>Cancel</button><button className="btn-dark !py-2.5">Add enquiry</button></div>
      </motion.form>
    </motion.div>
  );
}

export default function Enquiries() {
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  const [adding, setAdding] = useState(false);
  const toast = useToast();

  const load = useCallback(() => {
    api.get(`/enquiries?status=${status}&q=${encodeURIComponent(q)}&page=${page}`).then(setData, (e) => toast(e.message, 'err'));
  }, [status, q, page, toast]);
  useEffect(() => { const t = setTimeout(load, q ? 250 : 0); return () => clearTimeout(t); }, [load, q]);

  const update = (doc) => { setSel(doc); setData((d) => ({ ...d, items: d.items.map((x) => (x._id === doc._id ? doc : x)) })); };

  return (
    <>
      <PageTitle title="Enquiries" text="Leads from the website form, plus any you log by hand.">
        <a className="btn-line !py-2.5" href="/api/enquiries/export.csv"><Download className="h-4 w-4" />Export CSV</a>
        <button className="btn-dark !py-2.5" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add enquiry</button>
      </PageTitle>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white p-1.5">
          {[['all', 'All'], ...Object.entries(STATUS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
            <button key={k} onClick={() => { setStatus(k); setPage(1); }} className={`relative rounded-xl px-4 py-2 text-sm font-medium ${status === k ? 'text-white' : 'text-mute hover:text-ink'}`}>
              {status === k && <motion.span layoutId="enq-tab" className="absolute inset-0 rounded-xl bg-navy" />}<span className="relative">{l}</span>
            </button>
          ))}
        </div>
        <label className="relative block lg:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
          <input className="input !pl-11" placeholder="Search name, phone, message" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search enquiries" />
        </label>
      </div>

      {!data ? <div className="h-96 animate-pulse rounded-3xl bg-white" /> : data.items.length === 0 ? (
        <Empty title={q || status !== 'all' ? 'No enquiries match' : 'No enquiries yet'} text={q || status !== 'all' ? 'Try another search or status.' : 'When someone sends the contact form, the enquiry appears here.'} />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-foam/60 text-mute">
              <tr><th className="px-5 py-3.5 font-semibold">Name</th><th className="hidden px-5 py-3.5 font-semibold md:table-cell">Interested in</th><th className="hidden px-5 py-3.5 font-semibold lg:table-cell">Contact</th><th className="px-5 py-3.5 font-semibold">Status</th><th className="hidden px-5 py-3.5 text-right font-semibold sm:table-cell">Received</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((e) => (
                <tr key={e._id} onClick={() => setSel(e)} className="cursor-pointer transition hover:bg-foam" tabIndex={0} onKeyDown={(k) => k.key === 'Enter' && setSel(e)}>
                  <td className="px-5 py-4"><p className="font-semibold">{e.name}</p>{e.location && <p className="text-mute">{e.location}</p>}</td>
                  <td className="hidden px-5 py-4 md:table-cell">{e.interest || <span className="text-mute">General</span>}</td>
                  <td className="hidden px-5 py-4 lg:table-cell"><p>{e.phone}</p><p className="text-mute">{e.email}</p></td>
                  <td className="px-5 py-4"><Badge tone={STATUS[e.status].tone}>{STATUS[e.status].label}</Badge></td>
                  <td className="hidden px-5 py-4 text-right text-mute sm:table-cell">{timeAgo(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
              <span className="text-mute">{data.total} enquiries</span>
              <div className="flex gap-2">
                <button className="btn-line !px-4 !py-1.5" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <span className="px-2 py-1.5">Page {page} of {data.pages}</span>
                <button className="btn-line !px-4 !py-1.5" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {sel && <Drawer key="d" item={sel} onClose={() => setSel(null)} onChange={update} onDelete={(id) => { setSel(null); setData((d) => ({ ...d, items: d.items.filter((x) => x._id !== id) })); }} />}
        {adding && <NewEnquiry key="n" onClose={() => setAdding(false)} onCreated={() => { setAdding(false); toast('Enquiry added'); load(); }} />}
      </AnimatePresence>
    </>
  );
}
