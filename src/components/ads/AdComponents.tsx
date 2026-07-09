import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAds } from '@/hooks/useAds';

// ── Banner Ad ─────────────────────────────────────────────────
export const BannerAd = ({ position = 'top' }: { position?: 'top' | 'bottom' }) => {
  const { ads, loading, trackView, trackClick } = useAds('banner');
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const tracked = useRef<Set<string>>(new Set());
  const bannerRef = useRef<HTMLDivElement>(null);

  const visibleAds = ads.filter(a => a.position === position || !a.position);
  const isVisible = !loading && !dismissed && visibleAds.length > 0;

  useEffect(() => {
    if (visibleAds[current] && !tracked.current.has(visibleAds[current].id)) {
      trackView(visibleAds[current].id);
      tracked.current.add(visibleAds[current].id);
    }
  }, [current, visibleAds]);

  useEffect(() => {
    if (visibleAds.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % visibleAds.length), 5000);
    return () => clearInterval(t);
  }, [visibleAds.length]);

  // Banner balandligini o'lchab, --banner-h CSS o'zgaruvchisiga yozamiz.
  // Shu orqali fixed sidebar banner balandligicha pastga suriladi,
  // lekin ular orasidagi joylashuv (tartib) o'zgarmaydi.
  useEffect(() => {
    if (position !== 'top') return;
    const root = document.documentElement;
    if (!isVisible) {
      root.style.setProperty('--banner-h', '0px');
      return;
    }
    const el = bannerRef.current;
    if (!el) return;
    const update = () => root.style.setProperty('--banner-h', `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty('--banner-h', '0px');
    };
  }, [isVisible, position]);

  if (!isVisible) return null;

  const ad = visibleAds[current];

  return (
    <div ref={bannerRef} className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-background relative z-50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card via-card to-card/70 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] backdrop-blur-xl"
        >
          {/* Aurora glow */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          {/* Sheen */}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full" />

          <div className="relative flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 pr-10">
            <span className="hidden sm:inline-flex items-center gap-1 shrink-0 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5">
              Reklama
            </span>
            {ad.image_url && (
              <img
                src={ad.image_url}
                alt=""
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 ring-1 ring-border/50 shadow-sm"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-bold truncate">{ad.title}</p>
              {ad.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{ad.description}</p>
              )}
              {visibleAds.length > 1 && (
                <div className="flex items-center gap-1 mt-1">
                  <button onClick={() => setCurrent(c => (c - 1 + visibleAds.length) % visibleAds.length)}
                    className="p-0.5 hover:bg-muted rounded transition-colors">
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-muted-foreground">{current + 1}/{visibleAds.length}</span>
                  <button onClick={() => setCurrent(c => (c + 1) % visibleAds.length)}
                    className="p-0.5 hover:bg-muted rounded transition-colors">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            {ad.link_url && (
              <a href={ad.link_url} target="_blank" rel="noopener noreferrer"
                onClick={() => trackClick(ad.id)}
                className="hidden sm:inline-flex items-center gap-1.5 shrink-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full shadow-md shadow-primary/20 hover:opacity-95 transition-opacity whitespace-nowrap">
                {ad.link_text || 'Batafsil'}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          {/* Mobile CTA */}
          {ad.link_url && (
            <a href={ad.link_url} target="_blank" rel="noopener noreferrer"
              onClick={() => trackClick(ad.id)}
              className="sm:hidden flex items-center justify-center gap-1.5 mx-3 mb-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full shadow-md shadow-primary/20">
              {ad.link_text || 'Batafsil'}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {/* Yopish tugmasi */}
          <button onClick={() => setDismissed(true)}
            aria-label="Yopish"
            className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

// ── Popup Ad ──────────────────────────────────────────────────
export const PopupAd = () => {
  const { ads, trackView, trackClick } = useAds('popup');
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState(0);
  const tracked = useRef(false);

  useEffect(() => {
    if (ads.length === 0) return;
    const key = `popup_ad_${ads[0].id}_${new Date().toDateString()}`;
    if (localStorage.getItem(key)) return;
    const t = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(t);
  }, [ads]);

  useEffect(() => {
    if (show && ads[current] && !tracked.current) {
      trackView(ads[current].id);
      tracked.current = true;
    }
  }, [show, current]);

  const handleClose = () => {
    setShow(false);
    if (ads[0]) {
      localStorage.setItem(`popup_ad_${ads[0].id}_${new Date().toDateString()}`, '1');
    }
  };

  if (ads.length === 0) return null;
  const ad = ads[current];

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/70 z-[65] backdrop-blur-md"
            onClick={handleClose} />
          <div
            className="fixed inset-0 z-[66] flex items-center justify-center p-3 pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="w-full max-w-[400px] max-h-[90vh] overflow-y-auto pointer-events-auto"
            >
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-card/80 shadow-2xl">
              {/* Aurora glow */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-primary/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-accent/25 blur-3xl" />

              {ad.image_url ? (
                <div className="relative">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-44 sm:h-52 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider bg-background/70 text-foreground backdrop-blur px-2.5 py-1 rounded-full">
                    Reklama
                  </span>
                </div>
              ) : (
                <div className="relative pt-6 px-6">
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    Reklama
                  </span>
                </div>
              )}

              <button onClick={handleClose}
                aria-label="Yopish"
                className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur transition hover:bg-background">
                <X className="w-4 h-4" />
              </button>

              <div className="relative p-5 sm:p-6">
                <h3 className="font-bold text-lg sm:text-xl mb-1.5 leading-tight">{ad.title}</h3>
                {ad.description && (
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{ad.description}</p>
                )}
                <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <button onClick={handleClose}
                    className="sm:flex-none px-4 py-3 sm:py-2.5 rounded-xl border border-border/60 hover:bg-muted transition-colors text-sm font-medium">
                    Yopish
                  </button>
                  {ad.link_url && (
                    <a href={ad.link_url} target="_blank" rel="noopener noreferrer"
                      onClick={() => trackClick(ad.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-semibold py-3 sm:py-2.5 rounded-xl shadow-lg shadow-primary/20 hover:opacity-95 transition-opacity">
                      {ad.link_text || 'Batafsil'}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                {ads.length > 1 && (
                  <div className="flex justify-center gap-1.5 pt-4">
                    {ads.map((_, i) => (
                      <button key={i} onClick={() => setCurrent(i)}
                        className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-primary w-5' : 'bg-muted-foreground/30 w-1.5'}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Sidebar Ad ────────────────────────────────────────────────
export const SidebarAd = () => {
  const { ads, trackView, trackClick } = useAds('sidebar');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const tracked = useRef<Set<string>>(new Set());

  const visibleAds = ads.filter(a => !dismissed.has(a.id));

  useEffect(() => {
    visibleAds.forEach(ad => {
      if (!tracked.current.has(ad.id)) {
        trackView(ad.id);
        tracked.current.add(ad.id);
      }
    });
  }, [visibleAds.length]);

  if (visibleAds.length === 0) return null;

  return (
    <div className="space-y-3 p-3">
      <p className="text-[10px] text-muted-foreground/70 uppercase tracking-widest font-semibold px-1">Reklama</p>
      {visibleAds.map(ad => (
        <motion.div key={ad.id}
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm backdrop-blur-xl transition hover:border-primary/40 hover:shadow-md"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-primary/15 blur-2xl opacity-70" />
          <button onClick={() => setDismissed(d => new Set([...d, ad.id]))}
            aria-label="Yopish"
            className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur hover:text-foreground transition-colors">
            <X className="w-3 h-3" />
          </button>
          {ad.image_url && (
            <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover" />
          )}
          <div className="relative p-3">
            <p className="text-xs font-bold mb-0.5 pr-5 leading-snug">{ad.title}</p>
            {ad.description && (
              <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{ad.description}</p>
            )}
            {ad.link_url && (
              <a href={ad.link_url} target="_blank" rel="noopener noreferrer"
                onClick={() => trackClick(ad.id)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:gap-1.5 transition-all">
                {ad.link_text || 'Batafsil'}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
