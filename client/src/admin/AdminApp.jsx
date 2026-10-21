import { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Inbox, Droplets, Images, BadgeCheck, MessageSquareQuote, Settings as Cog, Users, LogOut, ExternalLink, Menu, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { ToastProvider, ConfirmProvider } from './ui.jsx';
import Login from './Login.jsx';
import Overview from './Overview.jsx';
import Enquiries from './Enquiries.jsx';
import { OfferingList, OfferingForm } from './Offerings.jsx';
import Gallery from './Gallery.jsx';
import { Brands, Testimonials } from './Collections.jsx';
import Settings from './Settings.jsx';
import Team from './Team.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const NAV = [
  ['', 'Overview', LayoutDashboard],
  ['enquiries', 'Enquiries', Inbox],
  ['offerings', 'Products & services', Droplets],
  ['gallery', 'Gallery', Images],
  ['brands', 'Brands', BadgeCheck],
  ['testimonials', 'Testimonials', MessageSquareQuote],
  ['settings', 'Site settings', Cog],
  ['team', 'Team & account', Users],
];

function Shell({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Dashboard">
      {NAV.map(([to, label, Icon]) => (
        <NavLink key={to} to={`/admin/${to}`} end={to === ''}
          className={({ isActive }) => `relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition ${isActive ? 'text-deep' : 'text-white/75 hover:bg-white/5 hover:text-white'}`}>
          {({ isActive }) => (
            <>
              {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-cyan" transition={{ type: 'spring', stiffness: 450, damping: 35 }} />}
              <Icon className="relative h-[18px] w-[18px]" /><span className="relative">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const side = (
    <div className="flex h-full flex-col bg-deep py-6 text-white">
      <Link to="/admin" className="mb-8 flex items-center gap-3 px-6">
        <span className="mosaic flex h-10 w-10 items-center justify-center rounded-xl font-display text-lg font-bold">A</span>
        <span className="leading-tight"><span className="block font-display font-bold">Al Amwaj</span><span className="text-xs text-white/60">Dashboard</span></span>
      </Link>
      {nav}
      <div className="mt-6 space-y-1 border-t border-white/10 px-3 pt-5">
        <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"><ExternalLink className="h-4 w-4" />View website</a>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" />Sign out</button>
        <p className="px-3.5 pt-3 text-xs text-white/50">Signed in as {user.name}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-foam lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{side}</aside>
      <div className="sticky top-0 z-40 flex items-center justify-between bg-deep px-4 py-3 text-white lg:hidden">
        <span className="font-display font-bold">Al Amwaj dashboard</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-white/10"><Menu /></button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-deep/60" onClick={() => setOpen(false)} />
            <motion.div className="absolute inset-y-0 left-0 w-72" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
              {side}
              <button onClick={() => setOpen(false)} className="absolute right-3 top-5 rounded-lg p-2 text-white hover:bg-white/10" aria-label="Close menu"><X /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
        <motion.div key={loc.pathname.split('/')[2] || 'home'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export default function AdminApp() {
  const [user, setUser] = useState(undefined);
  const nav = useNavigate();

  useEffect(() => {
    document.title = 'Dashboard | Al Amwaj';
    api.get('/auth/me').then((r) => setUser(r.user), () => setUser(null));
  }, []);

  const logout = async () => { await api.post('/auth/logout').catch(() => {}); setUser(null); nav('/admin/login'); };

  if (user === undefined) return <div className="flex min-h-screen items-center justify-center bg-deep"><span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" /></div>;

  return (
    <AuthCtx.Provider value={{ user, setUser, logout }}>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
            <Route path="login" element={user ? <Navigate to="/admin" replace /> : <Login />} />
            <Route path="*" element={!user ? <Navigate to="/admin/login" replace /> : (
              <Shell>
                <Routes>
                  <Route index element={<Overview />} />
                  <Route path="enquiries" element={<Enquiries />} />
                  <Route path="offerings" element={<OfferingList />} />
                  <Route path="offerings/new" element={<OfferingForm />} />
                  <Route path="offerings/:id" element={<OfferingForm />} />
                  <Route path="gallery" element={<Gallery />} />
                  <Route path="brands" element={<Brands />} />
                  <Route path="testimonials" element={<Testimonials />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="team" element={<Team />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </Shell>
            )} />
          </Routes>
        </ConfirmProvider>
      </ToastProvider>
    </AuthCtx.Provider>
  );
}
