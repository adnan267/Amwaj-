import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/* ---------- Admin users ---------- */
const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'editor'], default: 'editor' },
    lastLoginAt: Date,
  },
  { timestamps: true }
);
export const User = model('User', UserSchema);

/* ---------- Media item (used inside offerings) ---------- */
const MediaSchema = new Schema(
  {
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    url: { type: String, required: true },
    poster: String,
    caption: { type: String, default: '' },
    fit: { type: String, enum: ['cover', 'contain'], default: 'cover' },
  },
  { _id: true }
);

/* ---------- Products & services ---------- */
const OfferingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    serviceTitle: { type: String, trim: true }, // shorter name shown in the services list
    isProduct: { type: Boolean, default: false },
    isService: { type: Boolean, default: false },
    summary: { type: String, default: '' },
    overview: { type: String, default: '' },
    included: [{ type: String }],
    note: { type: String, default: '' },
    cover: String,
    icon: String, // SVG path data on a 48x48 grid
    media: [MediaSchema],
    faqs: [{ q: String, a: String }],
    seoTitle: String,
    seoDescription: String,
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);
OfferingSchema.pre('validate', function (next) {
  if (!this.slug && this.title) this.slug = slugify(this.title);
  else if (this.slug) this.slug = slugify(this.slug);
  next();
});
export const Offering = model('Offering', OfferingSchema);

/* ---------- Gallery ---------- */
const GallerySchema = new Schema(
  {
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    url: { type: String, required: true },
    poster: String,
    caption: { type: String, default: '' },
    category: { type: String, default: 'Projects' },
    fit: { type: String, enum: ['cover', 'contain'], default: 'cover' },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);
export const GalleryItem = model('GalleryItem', GallerySchema);

/* ---------- Brands ---------- */
const BrandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: String,
    description: { type: String, default: '' },
    website: String,
    category: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);
export const Brand = model('Brand', BrandSchema);

/* ---------- Testimonials ---------- */
const TestimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: '' },
    quote: { type: String, required: true },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);
export const Testimonial = model('Testimonial', TestimonialSchema);

/* ---------- Enquiries (leads from the contact form) ---------- */
const EnquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 40 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    interest: { type: String, trim: true, maxlength: 160 },
    location: { type: String, trim: true, maxlength: 160 },
    message: { type: String, trim: true, maxlength: 4000 },
    source: { type: String, default: 'website' },
    status: { type: String, enum: ['new', 'contacted', 'quoted', 'won', 'lost'], default: 'new', index: true },
    notes: [{ text: String, by: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);
export const Enquiry = model('Enquiry', EnquirySchema);

/* ---------- Site settings (single document) ---------- */
const SettingSchema = new Schema(
  {
    key: { type: String, default: 'site', unique: true },
    companyName: String,
    shortName: String,
    tagline: String,
    heroTitle: String,
    heroText: String,
    aboutTitle: String,
    aboutText: [String],
    phone: String,
    whatsapp: String, // digits only, international format
    email: String,
    website: String,
    address: String,
    mapUrl: String,
    hours: String,
    logo: String,
    foundedYear: Number,
    stats: [{ value: String, label: String }],
    social: { instagram: String, facebook: String, linkedin: String, youtube: String, tiktok: String },
    termsHtml: String,
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true }
);
export const Setting = model('Setting', SettingSchema);

export { slugify };
