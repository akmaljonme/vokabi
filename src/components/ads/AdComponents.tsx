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

  const visibleAds = ads.filter(a => a.position === position || !a.position);

  useEffect(() => {
    if (visibleAds[current] && !tracked.current.has(visibleAds[current].id)) {
      trackView(visibleAds[current].id);
      tracked.current.add(visibleAds[current].id);
    }
  }, [current, visibleAds]);

  // Auto-slide
  useEffect(() => {
    if (visibleAds.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % visibleAds.length), 5000);
    return () => clearInterval(t);
  }, [visibleAds.length]);

  if (loading || dismissed || visibleAds.length === 0) return null;

  const ad = visibleAds[current];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
        className={`w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20 ${position === 'bottom' ? 'border-t border-b-0' : ''}`}
      >
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
          {ad.image_url && (
            <img src={ad.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-primary mr-2">Reklama</span>
            <span className="text-sm font-medium truncate">{ad.title}</span>
            {ad.description && (
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{ad.description}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {visibleAds.length > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrent(c => (c - 1 + visibleAds.length) % visibleAds.length)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-xs text-muted-foreground">{current + 1}/{visibleAds.length}</span>
                <button onClick={() => setCurrent(c => (c + 1) % visibleAds.length)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
            {ad.link_url && (
              <a href={ad.link_url} target="_blank" rel="noopener noreferrer"
                onClick={() => trackClick(ad.id)}
                className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium whitespace-nowrap">
                {ad.link_text || 'Batafsil'}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button onClick={() => setDismissed(true)}
              className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
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
    // Har bir reklama uchun alohida kalit — yangi reklama qo'shilsa qayta chiqadi
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
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
          <div className="w-full max-w-[360px] pointer-events-auto">
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Image */}
              {ad.image_url ? (
                <div className="relative">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <button onClick={handleClose}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <span className="absolute top-3 left-3 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">Reklama</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Reklama</span>
                  <button onClick={handleClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="p-5">
                <h3 className="font-bold text-base mb-1">{ad.title}</h3>
                {ad.description && <p className="text-sm text-muted-foreground mb-4">{ad.description}</p>}
                <div className="flex gap-2">
                  {ad.link_url && (
                    <a href={ad.link_url} target="_blank" rel="noopener noreferrer"
                      onClick={() => trackClick(ad.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
                      {ad.link_text || 'Batafsil'}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={handleClose}
                    className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm">
                    Yopish
                  </button>
                </div>
              </div>

              {/* Multiple ads navigation */}
              {ads.length > 1 && (
                <div className="flex justify-center gap-1.5 pb-3">
                  {ads.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-primary w-4' : 'bg-muted-foreground/30'}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
          </motion.div>
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
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium px-1">Reklama</p>
      {visibleAds.map(ad => (
        <motion.div key={ad.id}
          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          className="relative bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl overflow-hidden"
        >
          <button onClick={() => setDismissed(d => new Set([...d, ad.id]))}
            className="absolute top-2 right-2 w-5 h-5 bg-background/80 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10">
            <X className="w-3 h-3" />
          </button>

          {ad.image_url && (
            <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover" />
          )}

          <div className="p-3">
            <p className="text-xs font-semibold mb-0.5 pr-5">{ad.title}</p>
            {ad.description && (
              <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{ad.description}</p>
            )}
            {ad.link_url && (
              <a href={ad.link_url} target="_blank" rel="noopener noreferrer"
                onClick={() => trackClick(ad.id)}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
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
