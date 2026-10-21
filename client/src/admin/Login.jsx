import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PoolCanvas from '../components/PoolCanvas.jsx';
import { api } from '../lib/api.js';
import { useAuth } from './AdminApp.jsx';

export default function Login() {
  const { setUser } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const r = await api.post('/auth/login', f);
      setUser(r.user);
      nav('/admin', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-deep p-4">
      <div className="absolute inset-0 opacity-80"><PoolCanvas splash={false} /></div>
      <div className="absolute inset-0 bg-deep/40" />
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl sm:p-10">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="mt-1.5 text-mute">Manage the Al Amwaj website and enquiries.</p>
        <label className="mt-8 block"><span className="label">Email</span>
          <input className="input" type="email" autoComplete="username" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="mt-4 block"><span className="label">Password</span>
          <input className="input" type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        {err && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{err}</p>}
        <button className="btn-dark mt-7 w-full" disabled={busy}>{busy ? 'Signing in' : 'Sign in'}</button>
        <a href="/" className="mt-5 block text-center text-sm text-mute hover:text-navy">Back to the website</a>
      </motion.form>
    </div>
  );
}
