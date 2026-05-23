import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface AppLayoutProps {
  children: ReactNode;
  withSidebar?: boolean;
  withFooter?: boolean;
}

export const AppLayout = ({ children, withSidebar = true, withFooter = false }: AppLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showSidebar = withSidebar && !!user;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onNavigate={() => navigate("/")} />

      <div className="flex flex-1 pt-[72px]">
        {showSidebar && <Sidebar />}

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 min-h-[calc(100vh-72px)] overflow-x-hidden transition-all duration-300"
          style={{ marginLeft: showSidebar ? "var(--sidebar-w, 220px)" : 0 }}
        >
          {children}
        </motion.main>
      </div>

      {withFooter && <Footer />}
    </div>
  );
};
