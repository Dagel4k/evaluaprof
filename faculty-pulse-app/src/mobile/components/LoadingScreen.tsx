import React from 'react';
import { GraduationCap } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
  total?: number;
  current?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, total, current }) => {
  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Animated Logo */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <div className="relative bg-card p-6 rounded-2xl border shadow-xl">
            <GraduationCap className="h-16 w-16 text-primary animate-bounce-slow" />
          </div>
        </div>

        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            EvaluaProf
          </h1>
          
          <div className="space-y-2">
            <div className="h-2 w-64 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
              <span>Cargando datos...</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
          
          {total && total > 0 && (
            <p className="text-xs text-muted-foreground/50">
              Procesando {current} de {total} perfiles
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
