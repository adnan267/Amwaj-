import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { PageHeader } from '../components/Layout.jsx';
import EnquiryForm from '../components/EnquiryForm.jsx';
import { MediaThumb, Lightbox, useLightbox, Reveal, OfferingIcon, WhatsAppIcon } from '../components/ui.jsx';
import { useFetch, useSite, usePageMeta } from '../lib/site.jsx';
import { waLink } from '../lib/api.js';

export function About() {
  const { s, products } = useSite();
  usePageMeta('About us', s.aboutText?.[0]);
  return (
    <>
      <PageHeader title={s.aboutTitle || 'About us'} text={s.tagline}><Link to="/contact" className="btn-primary">Start your project</Link></PageHeader>
      <section className="wrap grid gap-14 py-20 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {(s.aboutText || []).map((p, i) => <Reveal key={i}><p className={i === 0 ? 'text-2xl leading-relaxed text-ink' : 'lead'}>{p}</p></Reveal>)}
        </div>
        <dl className="grid h-fit grid-cols-2 gap-px overflow-hidden rounded-3xl bg-line">
          {(s.stats || []).map((st, i) => (
            <div key={i} className="bg-white p-7"><dd className="font-display text-3xl font-extrabold text-navy">{st.value}</dd><dt className="mt-1 text-sm text-mute">{st.label}</dt></div>
          ))}
        </dl>
      </section>
      <section className="bg-white py-20">
        <div className="wrap">
          <h2 className="h-lg">What we do</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((o) => (
              <Link key={o._id} to={`/solutions/${o.slug}`} className="flex gap-4 rounded-2xl border border-line p-6 transition hover:border-navy">
                <OfferingIcon path={o.icon} className="h-7 w-7 shrink-0 text-cyan" />
                <span><span className="block font-semibold">{o.title}</span><span className="mt-1 block text-sm text-mute">{o.summary}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function Brands() {
  const { data } = useFetch('/brands');
  usePageMeta('Brands we work with', 'Equipment brands we supply and install.');
  return (
    <>
      <PageHeader title="Brands we work with" text="We supply, install and service equipment from these manufacturers." />
      <section className="wrap py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(data || []).map((b, i) => (
            <Reveal key={b._id} delay={(i % 3) * 0.06}>
              <div className="flex h-full flex-col rounded-3xl bg-white p-8">
                <div className="flex h-16 items-center">{b.logo ? <img src={b.logo} alt={b.name} className="max-h-16 w-auto object-contain" /> : <span className="font-display text-3xl font-bold tracking-tight text-navy">{b.name}</span>}</div>
                {b.logo && <h2 className="mt-4 text-xl font-bold">{b.name}</h2>}
                {b.category && <p className="mt-4 text-sm font-semibold text-cyan">{b.category}</p>}
                <p className="mt-2 flex-1 text-mute">{b.description || 'Ask us about availability and pricing.'}</p>
                {b.website && <a href={b.website} target="_blank" rel="noopener" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline">Manufacturer website<ExternalLink className="h-3.5 w-3.5" /></a>}
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

export function Gallery() {
  const { data } = useFetch('/gallery');
  const [cat, setCat] = useState('All');
  const lb = useLightbox();
  usePageMeta('Gallery', 'Photos and videos of our pools, fountains and water treatment work.');
  const cats = useMemo(() => ['All', ...new Set((data || []).map((g) => g.category))], [data]);
  const items = (data || []).filter((g) => cat === 'All' || g.category === cat);

  return (
    <>
      <PageHeader title="Gallery" text="Our work, the equipment we install and how it works." />
      <section className="wrap py-16">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter gallery">
          {cats.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
              className={`relative rounded-full px-5 py-2.5 font-medium transition ${cat === c ? 'text-white' : 'bg-white text-navy hover:bg-cyan-100'}`}>
              {cat === c && <motion.span layoutId="gal-pill" className="absolute inset-0 rounded-full bg-navy" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative">{c}</span>
            </button>
          ))}
        </div>
        <motion.div layout className="mt-10 grid auto-rows-[240px] grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {items.map((g, i) => (
              <motion.div key={g._id} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.3 }}
                className={g.featured && cat === 'All' && i % 7 === 0 ? 'col-span-2 row-span-2' : ''}>
                <MediaThumb item={g} onClick={() => lb.open(i)} className="h-full" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
      <Lightbox items={items} index={lb.index} onClose={lb.close} onIndex={lb.setIndex} />
    </>
  );
}

export function Contact() {
  const { s } = useSite();
  usePageMeta('Contact us', 'Tell us about your project and we will reply with next steps and a quote.');
  const rows = [
    s.phone && { icon: Phone, label: 'Phone', value: s.phone, href: `tel:${s.phone.replace(/\s/g, '')}` },
    s.email && { icon: Mail, label: 'Email', value: s.email, href: `mailto:${s.email}` },
    s.address && { icon: MapPin, label: 'Office', value: s.address },
    s.hours && { icon: Clock, label: 'Working hours', value: s.hours },
  ].filter(Boolean);
  return (
    <>
      <PageHeader title="Contact us" text="Tell us about your project and we will reply with next steps and a quote.">
        {s.whatsapp && <a href={waLink(s.whatsapp, 'Hello, I would like to discuss a project.')} target="_blank" rel="noopener" className="btn bg-[#25D366] text-white hover:brightness-105"><WhatsAppIcon />Chat on WhatsApp</a>}
      </PageHeader>
      <section className="wrap grid gap-10 py-20 lg:grid-cols-[1.4fr_1fr]">
        <div><h2 className="h-md mb-6">Send us your enquiry</h2><EnquiryForm /></div>
        <div className="space-y-6">
          <h2 className="h-md">{s.companyName}</h2>
          <ul className="space-y-5">
            {rows.map(({ icon: I, label, value, href }) => (
              <li key={label} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-navy"><I className="h-5 w-5" /></span>
                <span><span className="block text-sm text-mute">{label}</span>{href ? <a href={href} className="font-semibold hover:text-navy">{value}</a> : <span className="font-semibold">{value}</span>}</span>
              </li>
            ))}
          </ul>
          {s.address && (
            <iframe title="Office location map" className="h-72 w-full rounded-3xl border-0 bg-white" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              src={s.mapUrl || `https://www.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed`} />
          )}
        </div>
      </section>
    </>
  );
}

export function Terms() {
  const { s } = useSite();
  usePageMeta('Terms & conditions');
  return (
    <>
      <PageHeader title="Terms and conditions" />
      <section className="wrap py-16"><div className="prose-site max-w-3xl" dangerouslySetInnerHTML={{ __html: s.termsHtml || '' }} /></section>
    </>
  );
}
