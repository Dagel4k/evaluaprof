import React from 'react';
import { Card } from '@/shared/ui/card';
import { ProfessorMetrics } from '../../types/canonical';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface ProfessorComparisonProps {
  profA: ProfessorMetrics;
  profB: ProfessorMetrics;
  onClose: () => void;
}

export const ProfessorComparison: React.FC<ProfessorComparisonProps> = ({ profA, profB, onClose }) => {
  
  const renderMetric = (label: string, valA: number, valB: number, higherIsBetter: boolean, isPercentage = false) => {
    const format = (v: number) => isPercentage ? `${v.toFixed(0)}%` : v.toFixed(1);
    const winA = higherIsBetter ? valA > valB : valA < valB;
    const winB = higherIsBetter ? valB > valA : valB < valA;
    const tie = valA === valB;

    const winClass = "text-green-600 dark:text-green-400 bg-green-500/15 rounded";
    const loseClass = "text-muted-foreground";

    return (
      <div className="grid grid-cols-3 gap-4 items-center py-2 border-b border-border/50 last:border-0">
        <div className={`text-center font-bold px-1 ${winA ? winClass : loseClass}`}>
          {format(valA)}
        </div>
        <div className="text-center text-xs font-medium text-muted-foreground uppercase">{label}</div>
        <div className={`text-center font-bold px-1 ${winB ? winClass : loseClass}`}>
          {format(valB)}
        </div>
      </div>
    );
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 bg-card text-card-foreground shadow-2xl border border-border p-0 overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in">
      <div className="bg-muted/50 p-3 flex justify-between items-center border-b border-border">
        <h4 className="font-bold text-sm">Comparación Cara a Cara</h4>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="font-bold text-sm truncate text-foreground" title={profA.name}>{profA.name.split(' ')[0]}</div>
          <div className="text-xs text-muted-foreground flex items-center justify-center">VS</div>
          <div className="font-bold text-sm truncate text-foreground" title={profB.name}>{profB.name.split(' ')[0]}</div>
        </div>

        <div className="space-y-1">
          {renderMetric("Calidad General", profA.globalScore, profB.globalScore, true)}
          {renderMetric("Dificultad", profA.difficulty, profB.difficulty, false)} 
          {renderMetric("% Recomienda", profA.takeAgainPercent, profB.takeAgainPercent, true, true)}
          {renderMetric("Sentimiento AI", profA.sentimentScore, profB.sentimentScore, true)}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
           <div className="text-xs text-center text-muted-foreground">
             {profA.tags.slice(0, 2).map(t => <span key={t} className="block bg-secondary text-secondary-foreground rounded px-1 mb-1">{t}</span>)}
           </div>
           <div className="text-xs text-center text-muted-foreground">
             {profB.tags.slice(0, 2).map(t => <span key={t} className="block bg-secondary text-secondary-foreground rounded px-1 mb-1">{t}</span>)}
           </div>
        </div>
      </div>
    </Card>
  );
};
