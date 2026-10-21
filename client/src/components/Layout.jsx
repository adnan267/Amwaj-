import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Mail, MapPin, Phone } from 'lucide-react';
import Navbar from './Navbar.jsx';
import PoolCanvas from './PoolCanvas.jsx';
import { useSite } from '../lib/site.jsx';
import { waLink } from '../lib/api.js';
import { WhatsAppIcon } from './ui.jsx';

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return <motion.div className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-cyan" style={{ scaleX: x }} aria-hidden="true" />;
}

function Footer() {
  const { s, products, services } = useSite();
  return (
    <footer className="bg-deep text-white/75">
      <div className="coping" />
      <div className="wrap grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            {s.logo && <img src={s.logo} alt="" className="h-12 w-12 rounded-xl bg-white object-contain p-0.5" />}
            <span className="font-display text-xl font-bold text-white">{s.companyName}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{s.tagline}</p>
        </div>
        <div>
          <h3 className="mb-4 text-base font-semibold text-white">Products</h3>
          <ul className="space-y-2 text-sm">{products.slice(0, 6).map((o) => <li key={o._id}><Link className="hover:text-cyan-300" to={`/solutions/${o.slug}`}>{o.title}</Link></li>)}</ul>
        </div>
        <div>
          <h3 className="mb-4 text-base font-semibold text-white">Services</h3>
          <ul className="space-y-2 text-sm">{services.slice(0, 6).map((o) => <li key={o._id}><Link className="hover:text-cyan-300" to={`/solutions/${o.slug}`}>{o.serviceTitle || o.title}</Link></li>)}</ul>
        </div>
        <div className="space-y-3 text-sm">
          <h3 className="mb-4 text-base font-semibold text-white">Contact</h3>
          {s.phone && <a className="flex gap-3 hover:text-cyan-300" href={`tel:${s.phone.replace(/\s/g, '')}`}><Phone className="h-4 w-4 shrink-0 translate-y-0.5" />{s.phone}</a>}
          {s.email && <a className="flex gap-3 break-all hover:text-cyan-300" href={`mailto:${s.email}`}><Mail className="h-4 w-4 shrink-0 translate-y-0.5" />{s.email}</a>}
          {s.address && <p className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 translate-y-0.5" />{s.address}</p>}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-3 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {s.companyName}. All rights reserved.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-1" aria-label="Footer">
            <Link className="hover:text-white" to="/about">About</Link>
            <Link className="hover:text-white" to="/gallery">Gallery</Link>
            <Link className="hover:text-white" to="/brands">Brands</Link>
            <Link className="hover:text-white" to="/terms">Terms</Link>
            <a className="hover:text-white" href="/sitemap.xml">Sitemap</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function PageHeader({ title, text, back, children }) {
  return (
    <section className="relative overflow-hidden bg-deep pt-[76px] text-white">
      <div className="absolute inset-0 opacity-70"><PoolCanvas lanes={false} splash={false} intensity={0.8} /></div>
      <div className="absolute inset-0 bg-gradient-to-r from-deep via-deep/80 to-deep/20" />
      <div className="wrap relative py-16 sm:py-24">
        {back && <Link to={back.to} className="mb-6 inline-block text-sm font-semibold text-cyan-300 hover:text-white">{back.label}</Link>}
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="h-lg max-w-4xl !text-white">{title}</motion.h1>
        {text && <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mt-5 max-w-2xl text-lg text-white/80">{text}</motion.p>}
        {children && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-8 flex flex-wrap gap-3">{children}</motion.div>}
      </div>
      <div className="coping" />
    </section>
  );
}

export default function Layout() {
  const { s, error } = useSite();
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only z-[90] rounded bg-white px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <ScrollProgress />
      <Navbar overHero />
      {error && <div className="fixed inset-x-0 top-[76px] z-40 bg-red-600 px-4 py-2 text-center text-sm text-white">{error}</div>}
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
      {s.whatsapp && (
        <motion.a href={waLink(s.whatsapp, 'Hello, I would like to ask about a project.')} target="_blank" rel="noopener"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: 'spring' }}
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_rgba(37,211,102,0.45)] transition hover:scale-105"
          aria-label="Chat with us on WhatsApp">
          <WhatsAppIcon className="h-7 w-7" />
        </motion.a>
      )}
    </div>
  );
}
