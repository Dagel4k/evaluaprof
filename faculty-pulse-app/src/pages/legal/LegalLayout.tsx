import React from 'react';
import { Button } from '@/shared/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LegalLayout: React.FC<{ title: string; lastUpdated: string; children: React.ReactNode }> = ({ title, lastUpdated, children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2 pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        
        <header className="mb-8 border-b pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{title}</h1>
          <p className="text-muted-foreground text-sm">Última actualización: {lastUpdated}</p>
        </header>

        <article className="prose dark:prose-invert prose-headings:font-bold prose-a:text-primary max-w-none">
          {children}
        </article>

        <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EvaluaProf. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
};
