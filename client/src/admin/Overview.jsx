import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../lib/api.js';
import { Card, PageTitle, Badge, STATUS, timeAgo, Empty } from './ui.jsx';
import { useAuth } from './AdminApp.jsx';

function Count({ to }) {
  const v = useMotionValue(0);
  const r = useTransform(v, (x) => Math.round(x));
  useEffect(() => { const c = animate(v, to, { duration: 0.9, ease: 'easeOut' }); return c.stop; }, [to, v]);
  return <motion.span>{r}</motion.span>;
}

export default function Overview() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get('/stats').then(setD, (e) => setErr(e.message)); }, []);

  if (err) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-white" />)}</div>;

  const last30 = d.days.reduce((a, x) => a + x.n, 0);
  const kpis = [
    ['New enquiries', d.status.new, 'Waiting for a first reply', '/admin/enquiries'],
    ['Last 30 days', last30, 'Enquiries received', '/admin/enquiries'],
    ['Quoted', d.status.quoted, 'Quotation sent', '/admin/enquiries'],
    ['Won', d.status.won, 'Converted to projects', '/admin/enquiries'],
  ];
  const totalStatus = Object.values(d.status).reduce((a, b) => a + b, 0) || 1;
  const maxInt = Math.max(1, ...d.byInterest.map((x) => x.n));

  return (
    <>
      <PageTitle title={`Hello, ${user.name.split(' ')[0]}`} text="Here is what is happening with enquiries and the website." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, n, sub, to], i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={to} className={`block rounded-3xl p-6 transition hover:-translate-y-0.5 ${i === 0 ? 'bg-navy text-white' : 'border border-line bg-white'}`}>
              <p className={`text-sm font-medium ${i === 0 ? 'text-white/75' : 'text-mute'}`}>{label}</p>
              <p className="mt-2 font-display text-4xl font-extrabold"><Count to={n} /></p>
              <p className={`mt-1 text-sm ${i === 0 ? 'text-cyan-300' : 'text-mute'}`}>{sub}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="text-lg font-bold">Enquiries, last 30 days</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.days} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00A3E0" stopOpacity={0.35} /><stop offset="100%" stopColor="#00A3E0" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#E4ECF2" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(8)} tick={{ fontSize: 12, fill: '#4B5675' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#4B5675' }} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} formatter={(v) => [v, 'Enquiries']} contentStyle={{ borderRadius: 12, border: '1px solid #D3E0EA' }} />
                <Area type="monotone" dataKey="n" stroke="#0A1F6B" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Pipeline</h2>
          <ul className="mt-5 space-y-4">
            {Object.entries(STATUS).map(([k, v]) => (
              <li key={k}>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{v.label}</span><span className="text-mute">{d.status[k]}</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-foam">
                  <motion.div className={`h-full rounded-full ${k === 'won' ? 'bg-emerald-500' : k === 'lost' ? 'bg-red-400' : k === 'new' ? 'bg-cyan' : k === 'quoted' ? 'bg-navy' : 'bg-amber-400'}`}
                    initial={{ width: 0 }} animate={{ width: `${(d.status[k] / totalStatus) * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="!p-0">
          <div className="flex items-center justify-between p-6 pb-3"><h2 className="text-lg font-bold">Latest enquiries</h2><Link to="/admin/enquiries" className="text-sm font-semibold text-navy hover:underline">See all</Link></div>
          {d.latest.length === 0 ? <div className="p-6 pt-0"><Empty title="No enquiries yet" text="Enquiries from the website contact form will appear here." /></div> : (
            <ul className="divide-y divide-line">
              {d.latest.map((e) => (
                <li key={e._id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0"><p className="truncate font-semibold">{e.name}</p><p className="truncate text-sm text-mute">{e.interest || 'General enquiry'}{e.location ? `, ${e.location}` : ''}</p></div>
                  <div className="flex shrink-0 items-center gap-3"><span className="hidden text-sm text-mute sm:inline">{timeAgo(e.createdAt)}</span><Badge tone={STATUS[e.status].tone}>{STATUS[e.status].label}</Badge></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold">Most requested</h2>
            {d.byInterest.length === 0 ? <p className="mt-3 text-sm text-mute">Appears once enquiries name a product or service.</p> : (
              <ul className="mt-4 space-y-3">
                {d.byInterest.map((x) => (
                  <li key={x.name} className="text-sm">
                    <div className="mb-1 flex justify-between gap-2"><span className="truncate">{x.name}</span><span className="text-mute">{x.n}</span></div>
                    <div className="h-2 rounded-full bg-foam"><div className="h-full rounded-full bg-cyan" style={{ width: `${(x.n / maxInt) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="text-lg font-bold">Website content</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              {[['Products', d.totals.products, 'offerings'], ['Services', d.totals.services, 'offerings'], ['Gallery items', d.totals.gallery, 'gallery'], ['Brands', d.totals.brands, 'brands']].map(([l, n, to]) => (
                <Link key={l} to={`/admin/${to}`} className="rounded-2xl bg-foam p-4 hover:bg-cyan-100"><dd className="font-display text-2xl font-bold">{n}</dd><dt className="text-mute">{l}</dt></Link>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
