import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { PageHeader } from '../components/Layout.jsx';
import { OfferingIcon, Reveal } from '../components/ui.jsx';
import { useSite, usePageMeta } from '../lib/site.jsx';

const COPY = {
  product: { title: 'Products and systems', text: 'Equipment we supply, install and service across the UAE.' },
  service: { title: 'Our services', text: 'Design, construction, finishing and care for pools, spas and water systems.' },
};

export default function Listing({ kind }) {
  const { products, services, ready } = useSite();
  const list = kind === 'product' ? products : services;
  const c = COPY[kind];
  usePageMeta(c.title, c.text);

  return (
    <>
      <PageHeader title={c.title} text={c.text}><Link to="/contact" className="btn-primary">Get a quote</Link></PageHeader>
      <section className="wrap py-20">
        {!ready && <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="h-80 animate-pulse rounded-3xl bg-white" />)}</div>}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((o, i) => (
            <Reveal key={o._id} delay={(i % 3) * 0.06}>
              <Link to={`/solutions/${o.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white transition hover:shadow-[0_24px_60px_-24px_rgba(10,31,107,0.35)]">
                <div className="relative h-52 overflow-hidden bg-navy">
                  {o.cover ? <img src={o.cover} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    : <div className="mosaic flex h-full items-center justify-center"><OfferingIcon path={o.icon} className="h-16 w-16 text-cyan-300" /></div>}
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <h2 className="text-2xl font-bold">{kind === 'service' ? o.serviceTitle || o.title : o.title}</h2>
                  <p className="mt-2 flex-1 text-mute">{o.summary}</p>
                  <span className="mt-5 inline-flex items-center gap-1 font-semibold text-navy">View details<ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
