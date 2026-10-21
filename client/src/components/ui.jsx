import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/** Icon drawn from the SVG path stored with each product or service. */
export function OfferingIcon({ path, className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path || 'M24 5C16 16 12 22 12 29a12 12 0 0024 0C36 22 32 16 24 5z'} />
    </svg>
  );
}

export function WhatsAppIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2z" />
    </svg>
  );
}

/** Media lightbox for images and videos. */
export function Lightbox({ items, index, onClose, onIndex }) {
  const open = index !== null && index !== undefined && items[index];
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, index, items.length, onClose, onIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-deep/95 p-4" role="dialog" aria-modal="true" aria-label={items[index].caption || 'Media viewer'}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" onClick={onClose} aria-label="Close"><X /></button>
          {items.length > 1 && (
            <>
              <button className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Previous"
                onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + items.length) % items.length); }}><ChevronLeft /></button>
              <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Next"
                onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % items.length); }}><ChevronRight /></button>
            </>
          )}
          <motion.figure key={index} className="max-h-full max-w-5xl" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()}>
            {items[index].type === 'video' ? (
              <video src={items[index].url} poster={items[index].poster} controls autoPlay playsInline className="max-h-[80vh] rounded-xl bg-black" />
            ) : (
              <img src={items[index].url} alt={items[index].caption || ''} className="max-h-[80vh] rounded-xl bg-white object-contain" />
            )}
            {items[index].caption && <figcaption className="mt-3 text-center text-white/80">{items[index].caption}</figcaption>}
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Thumbnail for an image or video item. */
export function MediaThumb({ item, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} className={`group relative block w-full overflow-hidden rounded-2xl bg-white text-left ${className}`}>
      <img src={item.type === 'video' ? item.poster || item.url : item.url} alt={item.caption || ''} loading="lazy"
        className={`h-full w-full transition duration-500 group-hover:scale-[1.04] ${item.fit === 'contain' ? 'object-contain p-4' : 'object-cover'}`} />
      {item.type === 'video' && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-deep/70 text-white backdrop-blur transition group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
      )}
      {item.caption && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-deep/80 to-transparent px-4 pb-3 pt-8 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">{item.caption}</span>}
    </button>
  );
}

export function Spinner({ className = 'h-6 w-6' }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} role="status" aria-label="Loading" />;
}

/** Fade the children in once when they scroll into view. Used sparingly. */
export function Reveal({ children, delay = 0, className = '', as = 'div' }) {
  const M = motion[as];
  return (
    <M className={className} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </M>
  );
}

export function useLightbox() {
  const [index, setIndex] = useState(null);
  return { index, open: setIndex, close: () => setIndex(null), setIndex };
}
