import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Upload, X, ImageIcon } from 'lucide-react';
import { api } from '../lib/api.js';

/* ---------------- Toasts ---------------- */
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, kind = 'ok') => {
    const id = Math.random();
    setItems((x) => [...x, { id, text, kind }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }}
              className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-xl ${t.kind === 'err' ? 'bg-red-600 text-white' : 'bg-deep text-white'}`}>
              {t.kind === 'err' ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-300" />}{t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ---------------- Confirm dialog ---------------- */
const ConfirmCtx = createContext(async () => false);
export function ConfirmProvider({ children }) {
  const [st, setSt] = useState(null);
  const ask = useCallback((opts) => new Promise((resolve) => setSt({ ...opts, resolve })), []);
  const close = (v) => { st?.resolve(v); setSt(null); };
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      <AnimatePresence>
        {st && (
          <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-deep/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => close(false)}>
            <motion.div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl" initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold">{st.title}</h2>
              {st.text && <p className="mt-2 text-mute">{st.text}</p>}
              <div className="mt-7 flex justify-end gap-3">
                <button className="btn-line !py-2.5" onClick={() => close(false)} autoFocus>Cancel</button>
                <button className={`btn !py-2.5 text-white ${st.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-navy hover:bg-navy-600'}`} onClick={() => close(true)}>{st.action || 'Confirm'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmCtx.Provider>
  );
}
export const useConfirm = () => useContext(ConfirmCtx);

/* ---------------- Building blocks ---------------- */
export function PageTitle({ title, text, children }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {text && <p className="mt-1.5 text-mute">{text}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-3xl border border-line bg-white p-6 ${className}`}>{children}</div>;
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-3">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${checked ? 'bg-cyan' : 'bg-line'}`}>
        <motion.span layout className="absolute top-1 h-5 w-5 rounded-full bg-white shadow" style={{ left: checked ? 24 : 4 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
      </button>
      {label && <span className="text-sm font-medium">{label}</span>}
    </label>
  );
}

export function Badge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-slate-100 text-slate-700', blue: 'bg-cyan-100 text-navy', green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800', red: 'bg-red-100 text-red-700', navy: 'bg-navy text-white',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export const STATUS = {
  new: { label: 'New', tone: 'blue' }, contacted: { label: 'Contacted', tone: 'amber' }, quoted: { label: 'Quoted', tone: 'navy' },
  won: { label: 'Won', tone: 'green' }, lost: { label: 'Lost', tone: 'red' },
};

export function Empty({ title, text, children }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-line bg-white/60 px-6 py-16 text-center">
      <h3 className="text-xl font-bold">{title}</h3>
      {text && <p className="mx-auto mt-2 max-w-md text-mute">{text}</p>}
      {children && <div className="mt-6 flex justify-center gap-2">{children}</div>}
    </div>
  );
}

/** Upload one or many files; calls onDone with [{url,type,name}]. */
export function UploadButton({ onDone, multiple = false, accept = 'image/*,video/*', label = 'Upload', className = 'btn-dark !py-2.5' }) {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function pick(e) {
    const files = e.target.files;
    if (!files?.length) return;
    setBusy(true);
    try {
      onDone(await api.upload(files));
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }
  return (
    <>
      <input ref={ref} type="file" className="hidden" multiple={multiple} accept={accept} onChange={pick} />
      <button type="button" className={className} onClick={() => ref.current.click()} disabled={busy}>
        {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Upload className="h-4 w-4" />}{busy ? 'Uploading' : label}
      </button>
    </>
  );
}

/** A single image picker with preview. */
export function ImageField({ value, onChange, label = 'Image', aspect = 'aspect-[4/3]', contain = false }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className={`relative overflow-hidden rounded-2xl border border-line bg-foam ${aspect}`}>
        {value ? (
          <>
            <img src={value} alt="" className={`h-full w-full ${contain ? 'object-contain p-3' : 'object-cover'}`} />
            <button type="button" onClick={() => onChange('')} className="absolute right-2 top-2 rounded-full bg-deep/70 p-1.5 text-white hover:bg-deep" aria-label="Remove image"><X className="h-4 w-4" /></button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-mute"><ImageIcon className="h-8 w-8" /><span className="text-sm">No image yet</span></div>
        )}
      </div>
      <div className="mt-3"><UploadButton accept="image/*" label={value ? 'Replace image' : 'Upload image'} className="btn-line !py-2 text-sm" onDone={(f) => onChange(f[0].url)} /></div>
    </div>
  );
}

/** Editable list of short strings. */
export function ListEditor({ value = [], onChange, placeholder = 'Add an item' }) {
  const [draft, setDraft] = useState('');
  const add = () => { const v = draft.trim(); if (!v) return; onChange([...value, v]); setDraft(''); };
  return (
    <div className="space-y-2">
      {value.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input className="input !py-2.5" value={v} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Item ${i + 1}`} />
          <button type="button" className="rounded-xl px-3 text-mute hover:bg-red-50 hover:text-red-600" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove item"><X className="h-4 w-4" /></button>
        </div>
      ))}
      <div className="flex gap-2">
        <input className="input !py-2.5" placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" className="btn-line !py-2" onClick={add}>Add</button>
      </div>
    </div>
  );
}

export function timeAgo(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
