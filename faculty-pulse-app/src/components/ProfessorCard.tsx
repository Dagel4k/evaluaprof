import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { Professor } from '@/types/professor';

interface ProfessorCardProps {
  professor: Professor;
  onClick: () => void;
}

export const ProfessorCard: React.FC<ProfessorCardProps> = ({ professor, onClick }) => {
  const getGradeColor = (grade: number) => {
    if (grade >= 8.0) return 'text-green-600';
    if (grade >= 6.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyLevel = (difficulty: number) => {
    if (difficulty <= 2) return { text: 'Fácil', color: 'bg-green-100 text-green-800' };
    if (difficulty <= 3.5) return { text: 'Moderado', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Difícil', color: 'bg-red-100 text-red-800' };
  };

  const getRecommendationColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const difficulty = getDifficultyLevel(professor.dificultad_promedio);

  return (
    <Card 
      className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] bg-gradient-to-br from-card to-muted"
      onClick={onClick}
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{professor.nombre}</h3>
          <p className="text-sm text-muted-foreground">{professor.universidad}</p>
          <p className="text-sm text-muted-foreground">{professor.departamento}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
            <span className={`font-bold ${getGradeColor(professor.promedio_general)}`}>
              {professor.promedio_general.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{professor.numero_calificaciones} reseñas</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className={`text-sm font-medium ${getRecommendationColor(professor.porcentaje_recomienda)}`}>
              {professor.porcentaje_recomienda}% recomienda
            </span>
          </div>
          <Badge className={difficulty.color}>
            {difficulty.text}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1">
          {professor.etiquetas.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {professor.etiquetas.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{professor.etiquetas.length - 3}
            </Badge>
          )}
        </div>

        {/* Warning indicator for low ratings */}
        {professor.promedio_general < 6.0 && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>Calificación baja</span>
          </div>
        )}
      </div>
    </Card>
  );
};