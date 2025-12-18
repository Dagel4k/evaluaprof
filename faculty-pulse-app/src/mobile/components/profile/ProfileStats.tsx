import React from 'react';
import { Badge } from '@/shared/ui/badge';
import { CheckCircle, Activity, AlertTriangle } from 'lucide-react';
import { Professor } from '@/types/professor';
import { GRADE_THRESHOLDS, RECOMMENDATION_THRESHOLDS, DIFFICULTY_THRESHOLDS } from '@/shared/lib/constants';

interface ProfileStatsProps {
  professor: Professor;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ professor }) => {
  const getGradeColor = (grade: number) => {
    if (grade >= GRADE_THRESHOLDS.good) return 'text-green-600';
    if (grade >= GRADE_THRESHOLDS.passing) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationColor = (percentage: number) => {
    if (percentage >= RECOMMENDATION_THRESHOLDS.high) return 'text-green-600';
    if (percentage >= RECOMMENDATION_THRESHOLDS.medium) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyLevel = (difficulty: number) => {
    if (difficulty <= DIFFICULTY_THRESHOLDS.easy) return { 
      text: 'Fácil', 
      color: 'bg-emerald-500/15 text-emerald-300 border-0',
      icon: <CheckCircle className="h-3 w-3 mr-1" />
    };
    if (difficulty <= DIFFICULTY_THRESHOLDS.moderate) return { 
      text: 'Moderado', 
      color: 'bg-amber-500/15 text-amber-300 border-0',
      icon: <Activity className="h-3 w-3 mr-1" />
    };
    return { 
      text: 'Difícil', 
      color: 'bg-rose-500/15 text-rose-300 border-0',
      icon: <AlertTriangle className="h-3 w-3 mr-1" />
    };
  };

  const difficulty = getDifficultyLevel(professor.nivel_dificultad);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-6 rounded-xl border border-border/50 bg-card/60">
        <div className="text-sm text-muted-foreground mb-1">Calidad</div>
        <div className={`text-2xl font-bold ${getGradeColor(professor.calidad_general)}`}>
          {professor.calidad_general.toFixed(1)}
        </div>
      </div>
      <div className="text-center p-6 rounded-xl border border-border/50 bg-card/60">
        <div className="text-sm text-muted-foreground mb-1">Recomendación</div>
        <div className={`text-2xl font-bold ${getRecommendationColor(professor.porcentaje_recomienda)}`}>
          {professor.porcentaje_recomienda}%
        </div>
      </div>
      <div className="text-center p-6 rounded-xl border border-border/50 bg-card/60">
        <div className="text-sm text-muted-foreground mb-1">Reseñas</div>
        <div className="text-2xl font-bold">
          {professor.numero_calificaciones}
        </div>
      </div>
      <div className="text-center p-6 rounded-xl border border-border/50 bg-card/60">
        <div className="text-sm text-muted-foreground mb-1">Dificultad</div>
        <div className="flex justify-center">
            <Badge className={`${difficulty.color} flex items-center`}>
            {difficulty.icon}
            {difficulty.text}
            </Badge>
        </div>
      </div>
    </div>
  );
};
