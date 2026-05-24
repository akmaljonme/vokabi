import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";

interface AppLayoutProps {
  children: ReactNode;
  withFooter?: boolean;
}

export const AppLayout = ({ children, withFooter = false }: AppLayoutProps) => {
  const { user } = useAuth();

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
