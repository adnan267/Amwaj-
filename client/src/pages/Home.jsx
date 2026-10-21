import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Phone } from 'lucide-react';
import PoolCanvas from '../components/PoolCanvas.jsx';
import { useSite, useFetch, usePageMeta } from '../lib/site.jsx';
import { waLink } from '../lib/api.js';
import { OfferingIcon, Reveal, WhatsAppIcon, MediaThumb, Lightbox, useLightbox } from '../components/ui.jsx';

function Hero() {
  const { s } = useSite();
  const words = (s.heroTitle || 'Engineering water. Empowering progress.').split(' ');
  return (
    <section className="relative flex min-h-[640px] flex-col overflow-hidden bg-deep text-white" style={{ height: '100svh', maxHeight: 980 }}>
      <div className="absolute inset-0"><PoolCanvas /></div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_100%,rgba(6,16,51,0.92)_0%,rgba(6,16,51,0.55)_45%,rgba(6,16,51,0.05)_80%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-deep/70 to-transparent" />

      <div className="wrap pointer-events-none relative mt-auto pb-16 sm:pb-20">
        <h1 className="h-xl max-w-[15ch] !text-white" aria-label={s.heroTitle}>
          {words.map((w, i) => (
            <span key={i} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden="true">
              <motion.span className="inline-block" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.25 + i * 0.09, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}>{w}</motion.span>
            </span>
          ))}
        </h1>
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7 }} className="mt-6 max-w-xl text-lg text-white/85 sm:text-xl">
          {s.heroText}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.7 }} className="pointer-events-auto mt-9 flex flex-wrap gap-3">
          <Link to="/contact" className="btn-primary">Get a quote</Link>
          {s.whatsapp && <a href={waLink(s.whatsapp, 'Hello, I would like to discuss a project.')} target="_blank" rel="noopener" className="btn-ghost"><WhatsAppIcon />Chat on WhatsApp</a>}
        </motion.div>
      </div>
      <div className="coping" />
    </section>
  );
}

function Intro() {
  const { s } = useSite();
  return (
    <section className="wrap grid gap-12 py-24 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
      <Reveal>
        <h2 className="h-lg max-w-[18ch]">{s.aboutTitle}</h2>
        {(s.aboutText || []).slice(0, 2).map((p, i) => <p key={i} className="lead mt-6">{p}</p>)}
        <Link to="/about" className="btn-line mt-8">About the company</Link>
      </Reveal>
      <Reveal delay={0.1}>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-line">
          {(s.stats || []).map((st, i) => (
            <div key={i} className="bg-white p-6 sm:p-8">
              <dt className="sr-only">{st.label}</dt>
              <dd className="font-display text-3xl font-extrabold text-navy sm:text-4xl">{st.value}</dd>
              <dd className="mt-1 text-sm text-mute">{st.label}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

function ProductIndex() {
  const { products } = useSite();
  const [hover, setHover] = useState(null);
  const box = useRef(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 300, damping: 30 }), y = useSpring(my, { stiffness: 300, damping: 30 });
  const onMove = (e) => { const r = box.current.getBoundingClientRect(); mx.set(e.clientX - r.left); my.set(e.clientY - r.top); };
  const cover = products.find((p) => p._id === hover)?.cover;

  return (
    <section className="bg-white py-24">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal><h2 className="h-lg">Products and systems</h2><p className="lead mt-4">Equipment we supply, install and service, sized for villas, hotels, towers and industry.</p></Reveal>
          <Link to="/products" className="btn-line">All products</Link>
        </div>
        <div ref={box} onMouseMove={onMove} onMouseLeave={() => setHover(null)} className="relative mt-12 border-t border-line">
          {products.map((p) => (
            <Link key={p._id} to={`/solutions/${p.slug}`} onMouseEnter={() => setHover(p._id)} onFocus={() => setHover(p._id)}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-line py-6 transition-colors hover:bg-foam sm:gap-8 sm:px-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-navy transition group-hover:bg-navy group-hover:text-white"><OfferingIcon path={p.icon} className="h-6 w-6" /></span>
              <span className="min-w-0">
                <span className="block font-display text-xl font-bold tracking-tight sm:text-3xl">{p.title}</span>
                <span className="mt-1 block max-w-2xl text-mute">{p.summary}</span>
              </span>
              <ArrowUpRight className="h-6 w-6 text-navy/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-navy" />
            </Link>
          ))}
          <AnimatePresence>
            {cover && (
              <motion.img key={cover} src={cover} alt="" style={{ x, y }} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-none absolute left-0 top-0 z-10 hidden h-48 w-64 -translate-x-1/2 -translate-y-[115%] rounded-2xl object-cover shadow-2xl lg:block" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function ServiceTiles() {
  const { services } = useSite();
  return (
    <section className="py-24">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal><h2 className="h-lg">Services</h2><p className="lead mt-4">From the first excavation to the last mosaic tile, and the maintenance visits after.</p></Reveal>
          <Link to="/services" className="btn-line">All services</Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-[6px] rounded-3xl bg-sand p-[6px] sm:grid-cols-3 lg:grid-cols-4">
          {services.map((o, i) => (
            <Link key={o._id} to={`/solutions/${o.slug}`}
              className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-[18px] p-5 text-white sm:aspect-[5/4] sm:p-6"
              style={{ backgroundColor: ['#0a5c8f', '#0b4f86', '#0d6aa0', '#0a3f7a'][i % 4] }}>
              {o.cover ? <img src={o.cover} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-700 group-hover:scale-105 group-hover:opacity-55" />
                : <span className="mosaic absolute inset-0 opacity-60 transition group-hover:opacity-90" style={{ backgroundColor: 'transparent' }} />}
              <span className="absolute inset-0 bg-gradient-to-t from-deep/85 via-deep/20 to-transparent" />
              <OfferingIcon path={o.icon} className="relative h-8 w-8 text-cyan-300 transition duration-300 group-hover:-translate-y-1" />
              <span className="relative font-display text-lg font-bold leading-tight sm:text-2xl">{o.serviceTitle || o.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    ['Site visit', 'We visit, listen to what you need and take measurements.'],
    ['Design and quote', 'Drawings, equipment selection and a clear, itemised quotation.'],
    ['Build and install', 'Our own team builds and commissions the system on schedule.'],
    ['Service', 'Maintenance visits, spare parts and support after handover.'],
  ];
  return (
    <section className="bg-deep py-24 text-white">
      <div className="wrap">
        <Reveal><h2 className="h-lg !text-white">How a project runs</h2></Reveal>
        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          <motion.span aria-hidden="true" className="absolute left-0 right-0 top-7 hidden h-[3px] origin-left rounded bg-gradient-to-r from-cyan to-cyan-300 md:block"
            initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 1.6, ease: 'easeInOut' }} />
          {steps.map(([t, d], i) => (
            <li key={t} className="relative">
              <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-cyan bg-deep font-display text-xl font-bold">{i + 1}</span>
              <h3 className="mt-5 text-2xl font-bold !text-white">{t}</h3>
              <p className="mt-2 max-w-xs text-white/70">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function GalleryStrip() {
  const { data } = useFetch('/gallery');
  const items = (data || []).filter((g) => g.featured).slice(0, 5);
  const lb = useLightbox();
  if (!items.length) return null;
  return (
    <section className="py-24">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal><h2 className="h-lg">Recent work</h2></Reveal>
          <Link to="/gallery" className="btn-line">Open the gallery</Link>
        </div>
        <div className="mt-12 grid auto-rows-[220px] grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((g, i) => <MediaThumb key={g._id} item={g} onClick={() => lb.open(i)} className={i === 0 ? 'col-span-2 row-span-2' : ''} />)}
        </div>
      </div>
      <Lightbox items={items} index={lb.index} onClose={lb.close} onIndex={lb.setIndex} />
    </section>
  );
}

function Testimonials() {
  const { data } = useFetch('/testimonials');
  if (!data?.length) return null;
  return (
    <section className="bg-white py-24">
      <div className="wrap">
        <Reveal><h2 className="h-lg">What clients say</h2></Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((t) => (
            <figure key={t._id} className="rounded-3xl border border-line p-8">
              <blockquote className="text-lg leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-6"><span className="font-semibold">{t.name}</span>{t.role && <span className="block text-sm text-mute">{t.role}</span>}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Brands() {
  const { data } = useFetch('/brands');
  if (!data?.length) return null;
  return (
    <section className="border-y border-line bg-white py-14">
      <div className="wrap flex flex-col gap-8 lg:flex-row lg:items-center">
        <h2 className="shrink-0 text-xl font-bold lg:w-56">Brands we install</h2>
        <ul className="flex flex-1 flex-wrap items-center gap-x-10 gap-y-5">
          {data.map((b) => (
            <li key={b._id}>
              <Link to="/brands" className="block text-mute transition hover:text-navy">
                {b.logo ? <img src={b.logo} alt={b.name} className="h-10 w-auto object-contain grayscale transition hover:grayscale-0" /> : <span className="font-display text-2xl font-bold tracking-tight">{b.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Cta() {
  const { s } = useSite();
  return (
    <section className="py-24">
      <div className="wrap">
        <div className="relative overflow-hidden rounded-[32px] bg-navy px-6 py-16 text-white sm:px-14">
          <div className="absolute inset-0 opacity-40"><PoolCanvas lanes={false} splash={false} intensity={0.7} /></div>
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-transparent" />
          <div className="relative max-w-2xl">
            <h2 className="h-lg !text-white">Tell us about your project</h2>
            <p className="mt-5 text-lg text-white/80">Share the location, size and timeline. We reply with next steps and a quotation.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact" className="btn-primary">Send an enquiry</Link>
              {s.phone && <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="btn-ghost"><Phone className="h-4 w-4" />Call {s.phone}</a>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta(null);
  return (
    <>
      <Hero />
      <Intro />
      <ProductIndex />
      <ServiceTiles />
      <Process />
      <GalleryStrip />
      <Testimonials />
      <Brands />
      <Cta />
    </>
  );
}
