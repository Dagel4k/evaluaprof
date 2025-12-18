import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { X } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('evaluaprof_cookies_accepted');
    if (!accepted) {
      // Delay slightly for better UX
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('evaluaprof_cookies_accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center animate-in slide-in-from-bottom-5 fade-in duration-500">
      <Card className="max-w-xl w-full p-4 shadow-xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-sm text-muted-foreground">
            <p>
              🍪 Utilizamos cookies para mejorar tu experiencia y analizar el tráfico. 
              Al continuar, aceptas nuestra <a href="/legal/privacy" className="underline hover:text-primary">Política de Privacidad</a>.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button size="sm" onClick={handleAccept} className="flex-1 sm:flex-none">
              Aceptar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsVisible(false)} className="flex-1 sm:flex-none">
              <X className="h-4 w-4 sm:mr-2" />
              <span className="sm:inline hidden">Cerrar</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
