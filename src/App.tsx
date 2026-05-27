import { Toaster as DefaultToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CallProvider } from "@/contexts/CallContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AITutorChat } from "@/components/AITutorChat";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { useDMNotifications } from "@/hooks/useDMNotifications";
import { GlobalCallOverlay } from "@/components/community/GlobalCallOverlay";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/PageLoader";
import { Background3D } from "@/components/Background3D";
import { lazy, Suspense } from "react";

// Lazy load all pages — faqat kerakli sahifa yuklanadi
const Index          = lazy(() => import("./pages/Index"));
const Auth           = lazy(() => import("./pages/Auth"));
const Login          = lazy(() => import("./pages/Login"));
const Register       = lazy(() => import("./pages/Register"));
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const ProfileSettings= lazy(() => import("./pages/ProfileSettings"));
const Games          = lazy(() => import("./pages/Games"));
const Community      = lazy(() => import("./pages/Community"));
const NotFound       = lazy(() => import("./pages/NotFound"));
const Leaderboard    = lazy(() => import("./pages/Leaderboard"));
const VideoLessons   = lazy(() => import("./pages/VideoLessons"));
const Exams          = lazy(() => import("./pages/Exams"));
const Pricing        = lazy(() => import("./pages/Pricing"));
const WordBank       = lazy(() => import("./pages/WordBank"));
const Tools          = lazy(() => import("./pages/Tools"));
const Languages      = lazy(() => import("./pages/Languages"));
const LanguageLevel  = lazy(() => import("./pages/LanguageLevel"));
const LearningPath   = lazy(() => import("./pages/LearningPath"));
const Tests          = lazy(() => import("./pages/Tests"));
const SchoolAdmin    = lazy(() => import("./pages/school/SchoolAdmin"));
const AdminPage      = lazy(() => import("./pages/AdminPage"));
const TeacherPanel   = lazy(() => import("./pages/school/TeacherPanel"));
const StudentPanel   = lazy(() => import("./pages/school/StudentPanel"));
const StudyRoom      = lazy(() => import("./pages/StudyRoom"));
const EssayChecker   = lazy(() => import("./pages/EssayChecker"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,        // 5 daqiqa cache
      gcTime: 1000 * 60 * 10,          // 10 daqiqa garbage collection
      refetchOnWindowFocus: false,      // Window focus da qayta yuklamaslik
      refetchOnReconnect: true,         // Internet qaytganda yangilash
    },
    mutations: {
      retry: 1,
    },
  },
});

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
            <DefaultToaster />
            <SonnerToaster />
            <Background3D />

            <BrowserRouter>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/"          element={<ErrorBoundary><Index /></ErrorBoundary>} />
                    <Route path="/login"     element={<ErrorBoundary><Login /></ErrorBoundary>} />
                    <Route path="/register"  element={<ErrorBoundary><Register /></ErrorBoundary>} />
                    <Route path="/auth"      element={<ErrorBoundary><Auth /></ErrorBoundary>} />
                    <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                    <Route path="/profile"   element={<ErrorBoundary><ProfileSettings /></ErrorBoundary>} />
                    <Route path="/games"     element={<ErrorBoundary><Games /></ErrorBoundary>} />
                    <Route path="/community" element={<ErrorBoundary><Community /></ErrorBoundary>} />
                    <Route path="/leaderboard" element={<ErrorBoundary><Leaderboard /></ErrorBoundary>} />
                    <Route path="/videos"    element={<ErrorBoundary><VideoLessons /></ErrorBoundary>} />
                    <Route path="/exams"     element={<ErrorBoundary><Exams /></ErrorBoundary>} />
                    <Route path="/tests"     element={<ErrorBoundary><Tests /></ErrorBoundary>} />
                    <Route path="/pricing"   element={<ErrorBoundary><Pricing /></ErrorBoundary>} />
                    <Route path="/tools"      element={<ErrorBoundary><Tools /></ErrorBoundary>} />
                    <Route path="/languages"   element={<ErrorBoundary><Languages /></ErrorBoundary>} />
                    <Route path="/language/:langId/:level" element={<ErrorBoundary><LanguageLevel /></ErrorBoundary>} />
                    <Route path="/learning-path" element={<ErrorBoundary><LearningPath /></ErrorBoundary>} />
                    <Route path="/language/:langId" element={<ErrorBoundary><Languages /></ErrorBoundary>} />
                    <Route path="/school"      element={<ErrorBoundary><SchoolAdmin /></ErrorBoundary>} />
                    <Route path="/admin"       element={<ErrorBoundary><AdminPage /></ErrorBoundary>} />
                    <Route path="/school/teacher" element={<ErrorBoundary><TeacherPanel /></ErrorBoundary>} />
                    <Route path="/school/student" element={<ErrorBoundary><StudentPanel /></ErrorBoundary>} />
                    <Route path="/wordbank"   element={<ErrorBoundary><WordBank /></ErrorBoundary>} />
                    <Route path="/study-room" element={<ErrorBoundary><StudyRoom /></ErrorBoundary>} />
                    <Route path="/essay"      element={<ErrorBoundary><EssayChecker /></ErrorBoundary>} />
                    <Route path="*"          element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>

              <AITutorChat />
              <GlobalListeners />
              <GlobalCallOverlay />
              <PWAInstallPrompt />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </CallProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
