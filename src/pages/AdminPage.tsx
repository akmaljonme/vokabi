import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const { isAdmin, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/dashboard", { replace: true });
  }, [isAdmin, loading, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!isAdmin) return null;

  return <AdminDashboard onExitAdmin={() => navigate("/dashboard")} />;
}
