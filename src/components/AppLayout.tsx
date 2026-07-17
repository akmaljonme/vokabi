import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUserRole } from "@/hooks/useUserRole";
import { BannerAd, PopupAd } from "@/components/ads/AdComponents";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { WhatsNewModal } from "@/components/WhatsNewModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";


interface AppLayoutProps {
  children: ReactNode;
  withFooter?: boolean;
}

export const AppLayout = ({ children, withFooter = false }: AppLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole(); // user null bo'lsa hook o'zi [] qaytaradi

  return (
    <div className="min-h-screen bg-background">
      {user && <BannerAd position="top" />}
      {/* Header: login bo'lmasa har doim, login bo'lsa faqat mobil */}
      <div className={user ? "lg:hidden" : ""}>
        <Header
          onNavigate={(v) => navigate(v === "levels" ? "/#levels" : "/")}
          isAdmin={isAdmin}
        />
      </div>

      {/* Sidebar: faqat login + desktop */}
      {user && (
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className={user ? "lg:pl-[var(--sidebar-w,220px)] pb-16 lg:pb-0" : ""}
      >
        {children}
        {withFooter && <Footer />}
      </motion.div>
      {user && <PopupAd />}
      {user && (
        <ErrorBoundary fallback={null}>
          <VoiceAssistant />
        </ErrorBoundary>
      )}
      {user && (
        <ErrorBoundary fallback={null}>
          <WhatsNewModal />
        </ErrorBoundary>
      )}
      {user && <MobileBottomNav />}
    </div>
  );
};
