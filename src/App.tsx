import { Toaster as DefaultToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CallProvider } from "@/contexts/CallContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AITutorChat } from "@/components/AITutorChat";
import { useDMNotifications } from "@/hooks/useDMNotifications";
import { GlobalCallOverlay } from "@/components/community/GlobalCallOverlay";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth"; // Fixed missing import
import Dashboard from "./pages/Dashboard";
import ProfileSettings from "./pages/ProfileSettings";
import Games from "./pages/Games";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound";
import Leaderboard from "./pages/Leaderboard";
import VideoLessons from "./pages/VideoLessons";
import Exams from "./pages/Exams";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Pricing from "./pages/Pricing";

const queryClient = new QueryClient();

const GlobalListeners = () => {
  useDMNotifications();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CallProvider>
        <ThemeProvider>
          <TooltipProvider>
            {/* Toast Notifications */}
            <DefaultToaster />
            <SonnerToaster />

            {/* Router */}
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<ProfileSettings />} />
                <Route path="/games" element={<Games />} />
                <Route path="/community" element={<Community />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/videos" element={<VideoLessons />} />
                <Route path="/exams" element={<Exams />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="*" element={<NotFound />} />
              </Routes>

              {/* Global Components */}
              <AITutorChat />
              <GlobalListeners />
              <GlobalCallOverlay />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </CallProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
