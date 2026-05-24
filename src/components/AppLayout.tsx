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

  // Login bo'lgan — Sidebar layout (Header yo'q)
  if (user) {
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
  }

  // Login bo'lmagan — Header bilan oddiy layout
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        onNavigate={(view) => navigate(view === "levels" ? "/#levels" : "/")}
        isAdmin={isAdmin}
      />
      <main className="flex-1 pt-[72px]">
        {children}
      </main>
      {withFooter && <Footer />}
    </div>
  );
};
