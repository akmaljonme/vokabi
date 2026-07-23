import { useNavigate, useLocation } from "react-router-dom";
import { Home, Brain, Gamepad2, Trophy, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

const TAB_DEFS = [
  { key: "home", i18nKey: "mobileNav.home", icon: Home, path: "/dashboard", match: (p: string) => p === "/dashboard" },
  { key: "learn", i18nKey: "mobileNav.learn", icon: Brain, path: "/practice", match: (p: string) => p.startsWith("/practice") || p.startsWith("/mock-tests") },
  { key: "games", i18nKey: "mobileNav.games", icon: Gamepad2, path: "/games", match: (p: string) => p.startsWith("/games") },
  { key: "rank", i18nKey: "mobileNav.rank", icon: Trophy, path: "/leaderboard", match: (p: string) => p.startsWith("/leaderboard") },
  { key: "profile", i18nKey: "mobileNav.profile", icon: User, path: "", match: (p: string) => p.startsWith("/u/") || p === "/profile" },
];

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around">
        {TAB_DEFS.map((tab) => {
          const path = tab.key === "profile" ? `/u/${user.id}` : tab.path;
          const active = tab.match(location.pathname);
          return (
            <button
              key={tab.key}
              onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
            >
              <tab.icon
                className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {t(tab.i18nKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
