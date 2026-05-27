import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { LearningPathMap } from "@/components/LearningPathMap";
import type { CEFRLevel } from "@/types/cefr";

export default function LearningPath() {
  const navigate = useNavigate();

  // Daraja tanlanganda test sahifasiga o'tish
  const handleSelectLevel = (level: CEFRLevel) => {
    navigate(`/?level=${level}&autostart=true`);
  };

  return (
    <AppLayout>
      <LearningPathMap
        onSelectLevel={handleSelectLevel}
        onBack={() => navigate(-1)}
      />
    </AppLayout>
  );
}
