import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUserRole } from "@/hooks/useUserRole";

interface AppLayoutProps {
  children: ReactNode;
  withFooter?: boolean;
}

export const AppLayout = ({ children, withFooter = false }: AppLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();

  // Login bo'lmagan — oddiy layout
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1">{children}</main>
        {withFooter && <Footer />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — faqat desktop (lg+) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Header — faqat mobil (lg dan kichik) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <Header
          onNavigate={(view) => navigate(view === "levels" ? "/#levels" : "/")}
          isAdmin={isAdmin}
        />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 min-h-screen overflow-x-hidden lg:ml-[var(--sidebar-w,220px)] pt-[72px] lg:pt-0"
      >
        {children}
        {withFooter && <Footer />}
      </motion.main>
    </div>
  );
};
