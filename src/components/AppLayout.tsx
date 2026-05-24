import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
  withFooter?: boolean;
}

export const AppLayout = ({ children, withFooter = false }: AppLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();

  // Login bo'lmagan
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1">{children}</main>
        {withFooter && <Footer />}
      </div>
    );
  }

  // Mobil — faqat Header
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header
          onNavigate={(view) => navigate(view === "levels" ? "/#levels" : "/")}
          isAdmin={isAdmin}
        />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 overflow-x-hidden"
        >
          {children}
          {withFooter && <Footer />}
        </motion.main>
      </div>
    );
  }

  // Desktop — Sidebar
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 min-h-screen overflow-x-hidden"
        style={{ marginLeft: "var(--sidebar-w, 220px)" }}
      >
        {children}
        {withFooter && <Footer />}
      </motion.main>
    </div>
  );
};
