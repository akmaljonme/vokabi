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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1">{children}</main>
        {withFooter && <Footer />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobil Header — faqat <1024px */}
      <div className="lg:hidden">
        <Header
          onNavigate={(v) => navigate(v === "levels" ? "/#levels" : "/")}
          isAdmin={isAdmin}
        />
      </div>

      {/* Desktop Sidebar — faqat ≥1024px */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="min-h-screen lg:transition-all lg:duration-300"
        style={{ paddingLeft: "var(--app-content-offset, 0px)" }}
      >
        {children}
        {withFooter && <Footer />}
      </motion.div>
    </div>
  );
};
