import { Toaster } from "@/shared/ui/toaster";
import { Toaster as Sonner } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Index from "./mobile/pages/Index";
import NotFound from "./mobile/pages/NotFound";
import Home from "./mobile/pages/Home";
import BottomNav from "./mobile/components/BottomNav";
import About from "./mobile/pages/About";
import Startup from "./mobile/pages/Startup";
import { useEffect } from "react";
import { toast as sonnerToast } from "@/shared/ui/sonner";
import { Native } from "@/shared/lib/native";
// Dynamic import guard for Capacitor App
declare global {
  interface Window { Capacitor?: any; __backOnce?: boolean; __trapPushed?: boolean }
}

const queryClient = new QueryClient();

import { useLocation } from "react-router-dom";

import DesktopLayout from "./desktop/components/DesktopLayout";
import SchedulerPage from "./desktop/pages/SchedulerPage";

const NavigationWrapper = () => {
  const location = useLocation();
  // Ocultar barra inferior solo durante arranque
  if (location.pathname === '/startup') return null;
  return <BottomNav />;
};

import { ProfessorProvider } from "@/mobile/context/ProfessorContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import { TermsPage } from "./pages/legal/TermsPage";
import { PrivacyPage } from "./pages/legal/PrivacyPage";
import { CookieBanner } from "./components/CookieBanner";
import { ProfilePage } from "./pages/settings/ProfilePage";
import { EvaluatePage } from "./pages/onboarding/EvaluatePage";
import { Loader2 } from "lucide-react";

import { RequirePermission } from "./components/RequirePermission";

// Wrapper to handle global auth loading state
const AppContent = () => {
  const { isLoading } = useAuth();
  
  if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
  }

  return (
    <div className="safe-y min-h-screen pb-20">
      <BrowserRouter>
        <BackHandler />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding/evaluate" element={<EvaluatePage />} />
          
          {/* User Settings */}
          <Route path="/settings/profile" element={<ProfilePage />} />

          {/* Legal Routes */}
          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          
          {/* Mobile Routes */}
          <Route path="/startup" element={<Startup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profesores" element={<Index />} />
          <Route path="/profesores/:slug" element={<Index />} />
          <Route path="/acerca" element={<About />} />
          <Route path="/" element={<Navigate to="/startup" />} />

          {/* Desktop Routes - Protected */}
          <Route path="/desktop" element={<DesktopLayout />}>
            <Route path="scheduler" element={
              <RequirePermission feature="access-scheduler">
                <SchedulerPage />
              </RequirePermission>
            } />
            <Route index element={<Navigate to="scheduler" replace />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <NavigationWrapper />
        <CookieBanner />
      </BrowserRouter>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ProfessorProvider>
           <AppContent />
        </ProfessorProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

function BackHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const trapIfNeeded = () => {
      const path = window.location.pathname;
      if ((path === '/home' || path === '/startup') && !(window as any).__trapPushed) {
        history.pushState(null, '', path);
        (window as any).__trapPushed = true;
      }
    };
    // Trap on mount and on route changes (small poll)
    trapIfNeeded();
    const routePoll = setInterval(trapIfNeeded, 200);

    const onPopState = (e: PopStateEvent) => {
      const path = window.location.pathname;
      // Si hay historial y no estamos en home/startup, dejar back normal
      if (window.history.length > 1 && path !== '/home' && path !== '/startup') {
        (window as any).__trapPushed = false;
        return;
      }
      // En home/startup: requerir doble back
      if (path === '/home' || path === '/startup') {
        if ((window as any).__backOnce) {
          (window as any).__backOnce = false;
          (window as any).__trapPushed = false; // permitir salir
          // No re-push: se permitirá cerrar app (WebView saldrá)
        } else {
          (window as any).__backOnce = true;
          // Toast nativo si es posible
          Native.toast('Pulsa atrás de nuevo para salir');
          // Reponer el estado para que no salga
          setTimeout(() => {
            history.pushState(null, '', path);
            (window as any).__trapPushed = true;
          }, 0);
          // Reseteo del doble back
          setTimeout(() => ((window as any).__backOnce = false), 1500);
          // Evitar navegación visible
          navigate(path, { replace: true });
        }
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      clearInterval(routePoll);
      window.removeEventListener('popstate', onPopState);
    };
  }, [navigate]);
  return null;
}

export default App;
