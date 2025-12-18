import React from 'react';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, Building, MapPin, GraduationCap, Bot, BarChart3 } from 'lucide-react';
import { Professor } from '@/types/professor';
import { capitalizeName } from '@/shared/lib/formatters';

interface ProfileHeaderProps {
  professor: Professor;
  onBack: () => void;
  onAIAnalysis: () => void;
  onAdvancedAnalytics: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  professor,
  onBack,
  onAIAnalysis,
  onAdvancedAnalytics,
}) => {
  return (
    <>
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">Perfil del Profesor</h1>
      </div>

      {/* Hero section */}
      <Card className="p-6 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Avatar con iniciales */}
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/15 text-primary font-bold text-lg shrink-0">
              {professor.nombre.split(' ').map(p => p[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {capitalizeName(professor.nombre)}
              </h2>
              <div className="mt-2 text-sm sm:text-base text-muted-foreground flex flex-wrap gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-1"><Building className="h-4 w-4" />{professor.universidad}</span>
                {professor.ciudad && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{professor.ciudad}</span>
                )}
                <span className="inline-flex items-center gap-1"><GraduationCap className="h-4 w-4" />{professor.departamento}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-center mt-2 shrink-0">
            <Button onClick={onAIAnalysis} className="gap-2">
              <Bot className="h-4 w-4" />
              Análisis IA
            </Button>
            {professor.analisis_avanzado && (
              <Button onClick={onAdvancedAnalytics} variant="secondary" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Análisis Detallado
              </Button>
            )}
          </div>
        </div>
      </Card>
    </>
  );
};
