import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { PageTitle, Card, Field, ImageField, useToast } from './ui.jsx';

export default function Settings() {
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  useEffect(() => { api.get('/settings').then((s) => setF({ aboutText: [], stats: [], social: {}, ...s }), (e) => toast(e.message, 'err')); }, [toast]);
  if (!f) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;

  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e });
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { setF({ ...f, ...(await api.put('/settings', f)) }); toast('Settings saved. Refresh the website to see them.'); }
    catch (e2) { toast(e2.message, 'err'); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={save}>
      <PageTitle title="Site settings" text="Company details, home page text and contact information used across the website.">
        <button className="btn-dark !py-2.5" disabled={saving}>{saving ? 'Saving' : 'Save settings'}</button>
      </PageTitle>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card className="grid gap-5 sm:grid-cols-2">
            <h2 className="text-lg font-bold sm:col-span-2">Company</h2>
            <Field label="Company name"><input className="input" value={f.companyName || ''} onChange={set('companyName')} /></Field>
            <Field label="Short name" hint="Shown next to the logo"><input className="input" value={f.shortName || ''} onChange={set('shortName')} /></Field>
            <Field label="Tagline" className="sm:col-span-2"><input className="input" value={f.tagline || ''} onChange={set('tagline')} /></Field>
            <Field label="Year established"><input className="input" type="number" value={f.foundedYear || ''} onChange={set('foundedYear')} /></Field>
          </Card>

          <Card className="space-y-5">
            <h2 className="text-lg font-bold">Home page</h2>
            <Field label="Headline"><input className="input" value={f.heroTitle || ''} onChange={set('heroTitle')} /></Field>
            <Field label="Text under the headline"><textarea className="input" value={f.heroText || ''} onChange={set('heroText')} /></Field>
            <div>
              <span className="label">Key facts</span>
              <div className="space-y-2">
                {f.stats.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="input !w-36 !py-2.5" placeholder="2007" value={s.value} onChange={(e) => set('stats')(f.stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} aria-label="Value" />
                    <input className="input !py-2.5" placeholder="Established in Sharjah" value={s.label} onChange={(e) => set('stats')(f.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label="Label" />
                    <button type="button" className="rounded-lg px-2 text-mute hover:text-red-600" onClick={() => set('stats')(f.stats.filter((_, j) => j !== i))} aria-label="Remove"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <button type="button" className="btn-line !py-2 text-sm" onClick={() => set('stats')([...f.stats, { value: '', label: '' }])}><Plus className="h-4 w-4" />Add fact</button>
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            <h2 className="text-lg font-bold">About</h2>
            <Field label="About headline"><input className="input" value={f.aboutTitle || ''} onChange={set('aboutTitle')} /></Field>
            <Field label="About text" hint="Leave an empty line between paragraphs">
              <textarea className="input min-h-[200px]" value={(f.aboutText || []).join('\n\n')} onChange={(e) => set('aboutText')(e.target.value.split(/\n\s*\n/))} />
            </Field>
          </Card>

          <Card className="space-y-5">
            <h2 className="text-lg font-bold">Terms and conditions</h2>
            <Field label="Content (HTML)" hint="Use <h2> for headings and <p> for paragraphs"><textarea className="input min-h-[240px] font-mono text-sm" value={f.termsHtml || ''} onChange={set('termsHtml')} /></Field>
          </Card>
        </div>

        <div className="space-y-6">
          <Card><ImageField label="Logo" aspect="aspect-square" contain value={f.logo} onChange={set('logo')} /></Card>
          <Card className="space-y-4">
            <h2 className="text-lg font-bold">Contact</h2>
            <Field label="Phone"><input className="input" value={f.phone || ''} onChange={set('phone')} /></Field>
            <Field label="WhatsApp number" hint="With country code, e.g. 971586839100"><input className="input" value={f.whatsapp || ''} onChange={set('whatsapp')} /></Field>
            <Field label="Email"><input className="input" type="email" value={f.email || ''} onChange={set('email')} /></Field>
            <Field label="Address"><textarea className="input" value={f.address || ''} onChange={set('address')} /></Field>
            <Field label="Working hours"><input className="input" value={f.hours || ''} onChange={set('hours')} /></Field>
            <Field label="Google Maps embed link" hint="Optional. Empty shows a map of the address."><input className="input" value={f.mapUrl || ''} onChange={set('mapUrl')} /></Field>
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg font-bold">Social media</h2>
            {['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok'].map((k) => (
              <Field key={k} label={k[0].toUpperCase() + k.slice(1)}><input className="input" type="url" placeholder="https://" value={f.social?.[k] || ''} onChange={(e) => setF({ ...f, social: { ...f.social, [k]: e.target.value } })} /></Field>
            ))}
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg font-bold">Search engines</h2>
            <Field label="Home page title" hint={`${(f.seoTitle || '').length}/60`}><input className="input" value={f.seoTitle || ''} onChange={set('seoTitle')} /></Field>
            <Field label="Home page description" hint={`${(f.seoDescription || '').length}/160`}><textarea className="input" value={f.seoDescription || ''} onChange={set('seoDescription')} /></Field>
          </Card>
        </div>
      </div>
    </form>
  );
}
