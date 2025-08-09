import React from 'react';
import { Card } from '@/components/ui/card';
import { Github, Linkedin, Globe, Calendar, User } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 pb-24 flex items-center justify-center min-h-[calc(100svh-6rem)]">
      <Card className="w-full max-w-xl p-6 sm:p-8 text-center">
        <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <User className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">Daniel Pereda Chaidez</h1>
        <p className="text-muted-foreground mt-2">Creador de EvaluaProf</p>

        <div className="mt-6 grid gap-3">
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span><span className="font-semibold">Fecha de creación:</span> 2025</span>
          </div>
          <a
            href="https://github.com/Dagel4k/evaluaprof"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm sm:text-base hover:bg-accent transition-colors"
            title="Repositorio en GitHub"
          >
            <Github className="h-4 w-4" /> github.com/Dagel4k/evaluaprof
          </a>
          <a
            href="https://www.linkedin.com/in/daniel-pereda-chaidez/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm sm:text-base hover:bg-accent transition-colors"
            title="Perfil en LinkedIn"
          >
            <Linkedin className="h-4 w-4" /> linkedin.com/in/daniel-pereda-chaidez
          </a>
          <a
            href="https://danielpereda.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm sm:text-base hover:bg-accent transition-colors"
            title="Sitio web"
          >
            <Globe className="h-4 w-4" /> danielpereda.com
          </a>
        </div>
      </Card>
    </div>
  );
};

export default About; 