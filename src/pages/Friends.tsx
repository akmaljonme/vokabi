import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { GameFriends } from "@/components/games/GameFriends";

export default function Friends() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <GameFriends onBack={() => navigate("/dashboard")} />
      </main>
    </AppLayout>
  );
}
