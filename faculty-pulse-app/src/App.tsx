import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import BottomNav from "./components/BottomNav";
import About from "./pages/About";
import Startup from "./pages/Startup";
import { useEffect } from "react";
import { toast as sonnerToast } from "@/components/ui/sonner";
// Dynamic import guard for Capacitor App
declare global {
  interface Window { Capacitor?: any; __backOnce?: boolean; __trapPushed?: boolean }
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="safe-y min-h-screen pb-20">
        <BrowserRouter>
          <BackHandler />
          <Routes>
            <Route path="/startup" element={<Startup />} />
            <Route path="/home" element={<Home />} />
            <Route path="/profesores" element={<Index />} />
            <Route path="/profesores/:slug" element={<Index />} />
            <Route path="/acerca" element={<About />} />
            <Route path="/" element={<Navigate to="/startup" />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* Ocultar barra inferior durante arranque */}
          {window.location.pathname !== '/startup' && <BottomNav />}
        </BrowserRouter>
      </div>
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
          sonnerToast('Pulsa atrás de nuevo para salir', { position: 'bottom-center' });
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
