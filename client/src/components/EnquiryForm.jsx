import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { api, waLink } from '../lib/api.js';
import { useSite } from '../lib/site.jsx';
import { Spinner, WhatsAppIcon } from './ui.jsx';

export default function EnquiryForm({ defaultInterest = '', compact = false }) {
  const { s, offerings } = useSite();
  const [f, setF] = useState({ name: '', phone: '', email: '', interest: defaultInterest, location: '', message: '', website_url: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const waText = `Hello, my name is ${f.name}.${f.interest ? ` I am interested in ${f.interest}.` : ''}${f.location ? ` Location: ${f.location}.` : ''} ${f.message}`.trim();

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!f.phone && !f.email) return setErr('Add a phone number or email so we can reply.');
    setBusy(true);
    try {
      await api.post('/enquiries', f);
      setDone(true);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl bg-white p-8 text-center shadow-sm" role="status">
          <CheckCircle2 className="mx-auto h-14 w-14 text-cyan" />
          <h3 className="mt-4 text-2xl font-bold">Enquiry received</h3>
          <p className="mx-auto mt-2 max-w-sm text-mute">Thanks, {f.name.split(' ')[0]}. Our team will contact you within one working day.</p>
          {s.whatsapp && (
            <a className="btn mt-6 bg-[#25D366] text-white hover:brightness-105" href={waLink(s.whatsapp, waText)} target="_blank" rel="noopener">
              <WhatsAppIcon /> Also send on WhatsApp
            </a>
          )}
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={submit} className={`grid gap-4 rounded-3xl bg-white p-6 shadow-sm sm:p-8 ${compact ? '' : 'sm:grid-cols-2'}`} noValidate>
          <div className={compact ? '' : 'sm:col-span-2'}>
            <label className="label" htmlFor="ef-name">Your name</label>
            <input id="ef-name" className="input" required autoComplete="name" value={f.name} onChange={set('name')} />
          </div>
          <div>
            <label className="label" htmlFor="ef-phone">Phone or WhatsApp</label>
            <input id="ef-phone" className="input" type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="label" htmlFor="ef-email">Email</label>
            <input id="ef-email" className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label" htmlFor="ef-int">What do you need?</label>
            <select id="ef-int" className="input" value={f.interest} onChange={set('interest')}>
              <option value="">Choose a product or service</option>
              {offerings.map((o) => <option key={o._id} value={o.title}>{o.title}</option>)}
              <option value="Something else">Something else</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ef-loc">Project location</label>
            <input id="ef-loc" className="input" placeholder="e.g. Villa in Al Khan, Sharjah" value={f.location} onChange={set('location')} />
          </div>
          <div className={compact ? '' : 'sm:col-span-2'}>
            <label className="label" htmlFor="ef-msg">Project details</label>
            <textarea id="ef-msg" className="input min-h-[120px]" placeholder="Size, timeline, and anything else we should know" value={f.message} onChange={set('message')} />
          </div>
          <input type="text" name="website_url" tabIndex={-1} autoComplete="off" className="hidden" value={f.website_url} onChange={set('website_url')} aria-hidden="true" />
          {err && <p className={`rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ${compact ? '' : 'sm:col-span-2'}`} role="alert">{err}</p>}
          <div className={`flex flex-wrap items-center gap-4 ${compact ? '' : 'sm:col-span-2'}`}>
            <button className="btn-dark" disabled={busy}>{busy && <Spinner className="h-4 w-4" />}Send enquiry</button>
            <p className="text-sm text-mute">We reply within one working day.</p>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
