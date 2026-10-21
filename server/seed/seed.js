/**
 * Seeds MongoDB with the content of the original alamwaj.ae static site.
 *   npm run seed            -> fills empty collections, creates the admin user if missing
 *   npm run seed -- --reset -> wipes content collections first (users and enquiries are kept)
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Offering, GalleryItem, Brand, Setting, Testimonial } from '../src/models/index.js';
import { UPLOAD_DIR } from '../src/lib/upload.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(await fs.readFile(path.join(here, 'extracted.json'), 'utf8'));
const reset = process.argv.includes('--reset');

// Longer copy for each page (the old site only had one line per page). Edit any of it from the dashboard.
const OVERVIEW = {
  'swimming-pool-systems': 'We design, supply and install complete pool systems for villas, hotels and residential towers: pumps, filters, heating, lighting, chlorination and controls, sized together so the pool is easy to run. We work from your architect\'s drawings or prepare the layout with you.',
  'water-softening-plants': 'Hard water leaves scale in pipes, heaters, showers and appliances. A softener removes the calcium and magnesium that cause it, then cleans itself automatically. We size the unit from your water source and daily use, install it with a bypass, and supply resin and salt afterwards.',
  'ro-water-treatment': 'Reverse osmosis pushes water through a fine membrane to remove dissolved salts and impurities. We supply RO units for drinking water at home, and larger plants with pre-filtration and storage for buildings, farms and industry.',
  'fire-protection': 'We supply and install fire pump sets, pipework, valves and hose reels, and support the system design so it can be approved by the authorities. After handover we test and service the system and keep spare parts available.',
  'boosting-pumping': 'Booster sets keep water pressure steady on every floor, even at peak use. We select pumps, pressure vessels and controls for the building, install them and service them, including transfer and drainage pumps.',
  'fountains': 'A fountain gives a pool, garden or building entrance a focal point. We supply the nozzles, pumps, lighting and controls, and build the basin or integrate the fountain into an existing pool.',
  'waterfalls-water-features': 'Sheer descents, rock waterfalls and water walls add movement and the sound of water to a space. We design the feature with you and size the pump and filtration so the water stays clear.',
  'landscape-irrigation': 'Drip lines, sprinklers and timers deliver water where plants need it and nowhere else. We design the layout zone by zone, install the pipework and controllers, and adjust it as the landscape grows.',
  'sprinklers-spray-heads': 'We supply and install sprinklers and spray heads for three uses: fire protection in buildings, irrigation of lawns and planting, and decorative spray in fountains and water features.',
  'jacuzzi': 'We supply and install jacuzzis for homes, villas and hotels, either as standalone spas or built into a pool, with the heating, circulation and water treatment they need, finished in the tiling of your choice.',
  'mosaic-tile': 'Mosaic tile is the finish people see and touch. We lay glass and ceramic mosaic in pools, spas and water features, including custom patterns, step edges and waterline bands.',
  'steam-sauna': 'We build steam rooms and saunas for homes, hotels and wellness areas, with the heater or steam generator, controls, lighting and finishes, and service them after handover.',
  'construction': 'We build pools, balancing tanks, plant rooms and water structures to approved drawings and specifications, covering excavation, concrete, waterproofing, plumbing and finishes.',
  'heating-system': 'Heat pumps, heat exchangers and electric heaters keep pools and spas at a comfortable temperature through the winter months. We size the heater for the water volume and how you use the pool.',
  'filtration-system': 'The right filter, pump and turnover rate keep pool water clear and safe. We supply sand, glass and cartridge filtration, and upgrade older systems that struggle to keep up.',
  'renovation-maintenance': 'We renovate tired pools and water systems, from re-tiling and new equipment to leak repairs, and offer regular maintenance visits for water balance, cleaning and equipment checks.',
  'fiberglass-pool': 'Fiberglass pools are made as a single shell, so installation is quick and the smooth surface is easy to keep clean. We handle the excavation, installation, plumbing and equipment.',
};

const STATS = [
  { value: '2007', label: 'Established in Sharjah' },
  { value: '17', label: 'Products and services' },
  { value: 'GCC', label: 'Established presence' },
  { value: 'Pakistan', label: 'Expanding into' },
];

const BRANDS = [
  { name: 'Elecro Engineering', description: 'Pool and spa heat pumps, heat exchangers and electric heaters.', category: 'Heating' },
  { name: 'AstralPool', description: 'Pool equipment: pumps, filters, lighting and fittings.', category: 'Pool equipment' },
  { name: 'Power World', description: '', category: '' },
  { name: 'Harvia', description: 'Sauna heaters, steam generators and sauna controls.', category: 'Sauna & steam' },
  { name: 'Colorado USA', description: '', category: '' },
];

const TERMS = `<h2>1. About these terms</h2><p>These terms apply to your use of the Al Amwaj Water Innovation website (www.alamwaj.ae) and to enquiries or quotations you request through it. By using the website you agree to these terms. If you do not agree, please do not use the website.</p>
<h2>2. Information on this website</h2><p>We try to keep the information on this website accurate and up to date. Product descriptions, images and videos are for general information only and may not show the exact product, specification or availability. Please confirm details with us before you rely on them.</p>
<h2>3. Quotations and services</h2><p>Enquiries sent through the website, WhatsApp, phone or email are requests for information and do not form a contract. A contract exists only when we issue a written quotation or agreement that you accept. Prices, scope, timelines and warranties are set out in that document.</p>
<h2>4. Intellectual property</h2><p>The Al Amwaj name, logo and website design belong to Al Amwaj Water Innovation. Other brand names, logos, images and videos shown on this website belong to their respective owners and are shown for identification or illustration only. You may not copy or reuse our content without written permission.</p>
<h2>5. Third-party brands and links</h2><p>We refer to products and brands made by other companies. We are not responsible for the content, availability or policies of third-party websites or brands linked from or mentioned on this website.</p>
<h2>6. Your enquiries and personal data</h2><p>When you contact us through the website form, WhatsApp, phone or email, we use the details you give (such as your name, phone number and project information) to reply to you and to prepare quotations. We do not sell your personal data.</p>
<h2>7. Limitation of liability</h2><p>To the extent allowed by law, Al Amwaj Water Innovation is not liable for any loss arising from your use of this website or from relying on its content. This does not limit any rights you have under a written agreement with us or under applicable law.</p>
<h2>8. Changes</h2><p>We may update this website and these terms from time to time. The version on this page is the current one.</p>
<h2>9. Governing law and contact</h2><p>These terms are governed by the laws of the United Arab Emirates. For questions about these terms, contact us at alamwajinnovation@gmail.com or +971 58 683 9100.</p>`;

async function copyAsset(name) {
  if (!name) return undefined;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const target = path.join(UPLOAD_DIR, name);
  await fs.copyFile(path.join(here, 'assets', name), target).catch(() => {});
  return `/uploads/${name}`;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/alamwaj');

  if (reset) {
    await Promise.all([Offering.deleteMany({}), GalleryItem.deleteMany({}), Brand.deleteMany({}), Setting.deleteMany({}), Testimonial.deleteMany({})]);
    console.log('Cleared content collections.');
  }

  if (!(await Setting.exists({ key: 'site' }))) {
    await Setting.create({
      key: 'site',
      companyName: 'Al Amwaj Water Innovation',
      shortName: 'Al Amwaj Water',
      tagline: 'Intelligent water solutions. Engineered for excellence.',
      heroTitle: 'Engineering water. Empowering progress.',
      heroText: 'Since 2007 we have designed, built and serviced swimming pools, water treatment plants, pumping and fire protection systems across the UAE.',
      aboutTitle: 'Engineered for excellence. Built on trust.',
      aboutText: [
        'We are a specialized engineering and project execution company delivering integrated solutions in irrigation, water treatment, swimming pools, pumping and fire protection systems.',
        'With an established presence across the GCC, we are expanding into Pakistan, bringing international standards, technical expertise and quality workmanship to every project.',
        'We execute projects in accordance with architects’ designs, approved technical drawings and engineering specifications, ensuring precision, reliability and lasting performance.',
      ],
      phone: '+971 58 683 9100',
      whatsapp: '971586839100',
      email: 'alamwajinnovation@gmail.com',
      website: 'www.alamwaj.ae',
      address: 'ABBCO Tower, 24th Floor, Office 2402, Bukhara Street, Al Nahda First, Sharjah, UAE',
      hours: 'Saturday to Thursday, 9:00 to 18:00',
      logo: await copyAsset('logo.jpg'),
      foundedYear: 2007,
      stats: STATS,
      termsHtml: TERMS,
      seoTitle: 'Al Amwaj Water Innovation | Pools & Water Systems, Sharjah UAE',
      seoDescription: 'Swimming pools, water softening, RO plants, fire protection, pumping, fountains and irrigation systems. Engineering water solutions since 2007 in Sharjah, UAE.',
    });
    console.log('Created site settings.');
  }

  if (!(await Offering.exists({}))) {
    for (const o of data.offerings) {
      const media = [];
      for (const m of o.media) media.push({ type: m.type, url: await copyAsset(m.url), poster: await copyAsset(m.poster), caption: m.caption, fit: m.fit || 'cover' });
      await Offering.create({
        title: o.title, slug: o.slug, serviceTitle: o.serviceTitle || undefined, isProduct: o.isProduct, isService: o.isService,
        summary: o.summary, overview: OVERVIEW[o.slug] || '', included: o.included, note: o.note,
        cover: await copyAsset(o.cover), icon: o.icon, media, order: o.order, published: true,
      });
    }
    console.log(`Added ${data.offerings.length} products and services.`);
  }

  if (!(await GalleryItem.exists({}))) {
    let i = 0;
    for (const g of data.gallery) {
      await GalleryItem.create({ type: g.type, url: await copyAsset(g.url), poster: await copyAsset(g.poster), caption: g.caption, category: g.category, fit: g.fit || 'cover', featured: ['pool.jpg', 'pool2.jpg', 'fnt.jpg', 'ro.jpg', 'soft.jpg'].includes(g.url), order: i++ });
    }
    await copyAsset('hero.mp4');
    console.log(`Added ${data.gallery.length} gallery items.`);
  }

  if (!(await Brand.exists({}))) {
    await Brand.insertMany(BRANDS.map((b, i) => ({ ...b, order: i })));
    console.log('Added brands.');
  }

  const email = (process.env.ADMIN_EMAIL || 'admin@alamwaj.ae').toLowerCase();
  if (!(await User.exists({ email }))) {
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe@2026';
    await User.create({ name: process.env.ADMIN_NAME || 'Admin', email, role: 'admin', passwordHash: await bcrypt.hash(password, 11) });
    console.log(`Created admin user ${email}. Sign in at /admin and change the password.`);
  }

  await mongoose.disconnect();
  console.log('Seed finished.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
