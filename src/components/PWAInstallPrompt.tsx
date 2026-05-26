import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    const isDismissed = localStorage.getItem('pwa-dismissed');
    if (isInstalled || isDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-dismissed', '1');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed bottom-0 left-0 right-0 z-[999] sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] sm:right-auto"
        >
          {/* Mobil: pastdan to'liq, desktop: float card */}
          <div className="bg-card border-t sm:border border-border sm:rounded-2xl shadow-2xl overflow-hidden">
            {/* Mobil handle */}
            <div className="flex justify-center pt-2 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="p-4 sm:p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Ilovamizni yuklab oling!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Telefonga o'rnating — tezroq, oflayn ham ishlaydi
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  O'rnatish
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-5 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
                >
                  Keyinroq
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
