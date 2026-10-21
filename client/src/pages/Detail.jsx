import { Link, useParams } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../components/Layout.jsx';
import EnquiryForm from '../components/EnquiryForm.jsx';
import { OfferingIcon, MediaThumb, Lightbox, useLightbox, Reveal, WhatsAppIcon, Spinner } from '../components/ui.jsx';
import { useFetch, useSite, usePageMeta } from '../lib/site.jsx';
import { waLink } from '../lib/api.js';
import NotFound from './NotFound.jsx';

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button className="flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-semibold" onClick={() => setOpen(!open)} aria-expanded={open}>
        {q}<ChevronDown className={`h-5 w-5 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-5 text-mute">{a}</motion.p>}
      </AnimatePresence>
    </div>
  );
}

export default function Detail() {
  const { slug } = useParams();
  const { data: o, loading, error } = useFetch(`/offerings/${slug}`);
  const { s, offerings } = useSite();
  const lb = useLightbox();
  usePageMeta(o?.title, o?.summary);

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center bg-deep pt-20 text-cyan"><Spinner className="h-10 w-10" /></div>;
  if (error?.status === 404 || !o) return <NotFound />;

  const media = o.media || [];
  const related = offerings.filter((x) => x._id !== o._id && (o.isProduct ? x.isProduct : x.isService)).slice(0, 6);

  return (
    <>
      <PageHeader title={o.title} text={o.summary} back={{ to: o.isProduct ? '/products' : '/services', label: o.isProduct ? 'All products' : 'All services' }}>
        <a href="#enquire" className="btn-primary">Ask for a quote</a>
        {s.whatsapp && <a href={waLink(s.whatsapp, `Hello, I am interested in: ${o.title}`)} target="_blank" rel="noopener" className="btn-ghost"><WhatsAppIcon />WhatsApp us</a>}
      </PageHeader>

      <section className="wrap grid gap-14 py-20 lg:grid-cols-[1.35fr_1fr]">
        <div>
          {o.overview && <Reveal><p className="text-xl leading-relaxed text-ink sm:text-2xl">{o.overview}</p></Reveal>}
          {o.included?.length > 0 && (
            <Reveal className="mt-14">
              <h2 className="h-md">What is included</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {o.included.map((it) => (
                  <li key={it} className="flex gap-3 rounded-2xl bg-white p-4">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan text-deep"><Check className="h-4 w-4" strokeWidth={3} /></span>{it}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
          {o.faqs?.length > 0 && (
            <Reveal className="mt-14"><h2 className="h-md">Questions people ask</h2><div className="mt-4 border-t border-line">{o.faqs.map((f, i) => <Faq key={i} {...f} />)}</div></Reveal>
          )}
        </div>
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-3xl bg-white">
            {o.cover ? <img src={o.cover} alt={o.title} className="h-64 w-full object-cover" />
              : <div className="mosaic flex h-48 items-center justify-center"><OfferingIcon path={o.icon} className="h-16 w-16 text-cyan-300" /></div>}
            {o.note && <div className="p-7"><h2 className="text-xl font-bold">Good to know</h2><p className="mt-2 text-mute">{o.note}</p></div>}
          </div>
        </aside>
      </section>

      {media.length > 0 && (
        <section className="bg-white py-20">
          <div className="wrap">
            <h2 className="h-md">Photos and videos</h2>
            <div className="mt-8 grid auto-rows-[220px] grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {media.map((m, i) => <MediaThumb key={m._id || i} item={m} onClick={() => lb.open(i)} className="bg-foam" />)}
            </div>
          </div>
          <Lightbox items={media} index={lb.index} onClose={lb.close} onIndex={lb.setIndex} />
        </section>
      )}

      <section id="enquire" className="wrap grid gap-10 py-20 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="h-lg">Get a quote for {o.serviceTitle || o.title}</h2>
          <p className="lead mt-4">Tell us about the site and what you need. We will suggest the right system and send a quotation.</p>
        </div>
        <EnquiryForm defaultInterest={o.title} />
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-white py-16">
          <div className="wrap">
            <h2 className="text-2xl font-bold">{o.isProduct ? 'Other products' : 'Other services'}</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {related.map((r) => (
                <Link key={r._id} to={`/solutions/${r.slug}`} className="flex items-center gap-2 rounded-full border border-line px-5 py-2.5 font-medium text-navy transition hover:border-navy hover:bg-navy hover:text-white">
                  <OfferingIcon path={r.icon} className="h-4 w-4" />{o.isProduct ? r.title : r.serviceTitle || r.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
