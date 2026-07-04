import { useNavigate } from "react-router-dom";
import { Rocket } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

interface ComingSoonProps {
  title: string;
  description?: string;
}

/**
 * Admin bo'lmagan foydalanuvchilar uchun "tez kunda" placeholder sahifasi.
 * Sidebar'da "SOON" belgisi qo'yilgan bo'limlarga to'g'ridan-to'g'ri
 * havola orqali kirilsa ham shu ko'rinadi.
 */
export const ComingSoon = ({ title, description }: ComingSoonProps) => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Rocket className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground text-sm mb-8">
          {description || "Bu bo'lim hozircha ishlab chiqilmoqda. Tez orada tayyor bo'ladi!"}
        </p>
        <button onClick={() => navigate("/dashboard")} className="btn-primary px-6 py-3">
          Dashboardga qaytish
        </button>
      </div>
    </AppLayout>
  );
};
