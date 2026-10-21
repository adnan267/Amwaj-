import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X, Phone } from 'lucide-react';
import { useSite } from '../lib/site.jsx';
import { OfferingIcon } from './ui.jsx';

function Mega({ label, to, items, useServiceTitle, image, open, setOpen }) {
  const timer = useRef();
  const show = () => { clearTimeout(timer.current); setOpen(label); };
  const hide = () => { timer.current = setTimeout(() => setOpen(null), 140); };
  const isOpen = open === label;
  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <NavLink to={to} className={({ isActive }) => `flex items-center gap-1 rounded-full px-3.5 py-2 transition hover:bg-white/10 ${isActive ? 'text-cyan-300' : ''}`}
        aria-expanded={isOpen} onFocus={show}>
        {label}<ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
      </NavLink>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }}
            className="absolute left-1/2 top-full z-50 mt-3 w-[min(880px,92vw)] -translate-x-1/2" onMouseEnter={show} onMouseLeave={hide}>
            <div className="grid grid-cols-[1fr_250px] overflow-hidden rounded-3xl bg-white text-ink shadow-[0_30px_80px_-20px_rgba(6,16,51,0.45)]">
              <div className="grid grid-cols-2 gap-1 p-4">
                {items.map((o) => (
                  <Link key={o._id} to={`/solutions/${o.slug}`} onClick={() => setOpen(null)}
                    className="flex items-start gap-3 rounded-2xl p-3 transition hover:bg-foam focus-visible:bg-foam">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-navy"><OfferingIcon path={o.icon} className="h-5 w-5" /></span>
                    <span>
                      <span className="block font-semibold leading-snug">{useServiceTitle ? o.serviceTitle || o.title : o.title}</span>
                      {!useServiceTitle && <span className="mt-0.5 line-clamp-1 block text-sm text-mute">{o.summary}</span>}
                    </span>
                  </Link>
                ))}
              </div>
              <Link to="/contact" onClick={() => setOpen(null)} className="relative flex flex-col justify-end overflow-hidden p-6 text-white">
                <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-deep via-deep/60 to-deep/10" />
                <span className="relative font-display text-xl font-bold leading-tight">Plan your water project with us</span>
                <span className="relative mt-3 inline-flex w-fit rounded-full bg-cyan px-4 py-2 text-sm font-semibold text-deep">Get a quote</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar({ overHero }) {
  const { s, products, services } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(null);
  const [sub, setSub] = useState(null);
  const loc = useLocation();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setMobile(false); setOpen(null); setSub(null); }, [loc.pathname]);
  useEffect(() => { document.body.style.overflow = mobile ? 'hidden' : ''; }, [mobile]);

  const solid = !overHero || scrolled || mobile;
  const link = ({ isActive }) => `rounded-full px-3.5 py-2 transition hover:bg-white/10 ${isActive ? 'text-cyan-300' : ''}`;

  return (
    <header className={`fixed inset-x-0 top-0 z-50 text-white transition-all duration-300 ${solid ? 'bg-deep/92 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-md' : 'bg-transparent'}`}>
      <div className="wrap flex h-[76px] items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3" aria-label={`${s.companyName || 'Al Amwaj'} home`}>
          {s.logo && <img src={s.logo} alt="" className="h-11 w-11 rounded-xl bg-white object-contain p-0.5" />}
          <span className="font-display text-lg font-bold leading-none tracking-tight">{s.shortName || 'Al Amwaj Water'}</span>
        </Link>

        <nav className="hidden items-center gap-0.5 text-[15px] font-medium lg:flex" aria-label="Main">
          <NavLink to="/" end className={link}>Home</NavLink>
          <NavLink to="/about" className={link}>About</NavLink>
          <Mega label="Products" to="/products" items={products} image={products.find((p) => p.cover)?.cover} open={open} setOpen={setOpen} />
          <Mega label="Services" to="/services" items={services} useServiceTitle image={services.filter((p) => p.cover)[1]?.cover || services.find((p) => p.cover)?.cover} open={open} setOpen={setOpen} />
          <NavLink to="/brands" className={link}>Brands</NavLink>
          <NavLink to="/gallery" className={link}>Gallery</NavLink>
          <NavLink to="/contact" className={link}>Contact</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {s.phone && <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium hover:bg-white/10 xl:flex"><Phone className="h-4 w-4" />{s.phone}</a>}
          <Link to="/contact" className="btn-primary hidden !px-5 !py-2.5 text-sm sm:inline-flex">Get a quote</Link>
          <button className="rounded-full p-2.5 hover:bg-white/10 lg:hidden" onClick={() => setMobile((m) => !m)} aria-label={mobile ? 'Close menu' : 'Open menu'} aria-expanded={mobile}>
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobile && (
          <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'calc(100dvh - 76px)' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-y-auto border-t border-white/10 bg-deep lg:hidden" aria-label="Mobile">
            <div className="wrap flex flex-col py-4 text-lg font-medium">
              <NavLink to="/" end className="border-b border-white/10 py-3.5">Home</NavLink>
              <NavLink to="/about" className="border-b border-white/10 py-3.5">About</NavLink>
              {[['Products', products, false, '/products'], ['Services', services, true, '/services']].map(([label, list, st, to]) => (
                <div key={label} className="border-b border-white/10">
                  <button className="flex w-full items-center justify-between py-3.5" onClick={() => setSub(sub === label ? null : label)} aria-expanded={sub === label}>
                    {label}<ChevronDown className={`h-5 w-5 transition ${sub === label ? 'rotate-180' : ''}`} />
                  </button>
                  {sub === label && (
                    <div className="mb-3 grid gap-1 text-base">
                      <Link to={to} className="rounded-xl px-3 py-2 text-cyan-300">See all {label.toLowerCase()}</Link>
                      {list.map((o) => (
                        <Link key={o._id} to={`/solutions/${o.slug}`} className="flex items-center gap-3 rounded-xl px-3 py-2 text-white/85 hover:bg-white/5">
                          <OfferingIcon path={o.icon} className="h-5 w-5 text-cyan-300" />{st ? o.serviceTitle || o.title : o.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <NavLink to="/brands" className="border-b border-white/10 py-3.5">Brands</NavLink>
              <NavLink to="/gallery" className="border-b border-white/10 py-3.5">Gallery</NavLink>
              <NavLink to="/contact" className="border-b border-white/10 py-3.5">Contact</NavLink>
              <Link to="/contact" className="btn-primary mt-6">Get a quote</Link>
              {s.phone && <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="btn-ghost mt-3"><Phone className="h-4 w-4" />{s.phone}</a>}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
