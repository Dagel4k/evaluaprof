import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users, TrendingUp, AlertTriangle, Shield, Heart, Activity, Zap } from 'lucide-react';
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

  const difficulty = getDifficultyLevel(professor.nivel_dificultad);

  // Funciones para obtener indicadores de análisis avanzado
  const getTrustIndicator = (trustScore?: number) => {
    if (!trustScore) return null;
    if (trustScore >= 0.8) return { icon: Shield, color: 'text-green-600', text: 'Alta confiabilidad' };
    if (trustScore >= 0.6) return { icon: Shield, color: 'text-yellow-600', text: 'Confiabilidad media' };
    return { icon: AlertTriangle, color: 'text-red-600', text: 'Baja confiabilidad' };
  };

  const getSentimentIndicator = (sentiment?: number) => {
    if (!sentiment && sentiment !== 0) return null;
    if (sentiment >= 0.3) return { icon: Heart, color: 'text-green-600', text: 'Sentimiento positivo' };
    if (sentiment >= -0.1) return { icon: Activity, color: 'text-yellow-600', text: 'Sentimiento neutro' };
    return { icon: AlertTriangle, color: 'text-red-600', text: 'Sentimiento negativo' };
  };

  const getTrendIndicator = (trend?: number[]) => {
    if (!trend || trend.length < 2) return null;
    const isImproving = trend[trend.length - 1] > trend[0];
    return {
      icon: isImproving ? TrendingUp : Activity,
      color: isImproving ? 'text-green-600' : 'text-yellow-600',
      text: isImproving ? 'Tendencia positiva' : 'Tendencia estable'
    };
  };

  const trustIndicator = getTrustIndicator(professor.analisis_avanzado?.trust_score);
  const sentimentIndicator = getSentimentIndicator(professor.analisis_avanzado?.sentiment_score);
  const trendIndicator = getTrendIndicator(professor.analisis_avanzado?.quality_trend);

  return (
    <Card 
      className="p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] bg-gradient-to-br from-card to-muted relative overflow-hidden"
      onClick={onClick}
    >
      {/* Indicador de análisis avanzado disponible */}
      {professor.analisis_avanzado && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
            <Zap className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
            <span className="hidden sm:inline">Análisis IA</span>
            <span className="sm:hidden">IA</span>
          </Badge>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground line-clamp-2">{professor.nombre}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{professor.universidad}</p>
          {professor.ciudad && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{professor.ciudad}</p>
          )}
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{professor.departamento}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current shrink-0" />
            <span className={`font-bold text-sm sm:text-base ${getGradeColor(professor.calidad_general)}`}>
              {professor.calidad_general.toFixed(1)}
            </span>
            {/* Mostrar pronóstico si está disponible */}
            {professor.analisis_avanzado?.forecast_quality && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                (↗ {professor.analisis_avanzado.forecast_quality.toFixed(1)})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <span className="text-xs sm:text-sm truncate">{professor.numero_calificaciones} reseñas</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
            <span className={`text-xs sm:text-sm font-medium truncate ${getRecommendationColor(professor.porcentaje_recomienda)}`}>
              {professor.porcentaje_recomienda}%<span className="hidden sm:inline"> recomienda</span>
            </span>
          </div>
          <Badge className={`${difficulty.color} text-xs shrink-0`}>
            {difficulty.text}
          </Badge>
        </div>

        {/* Indicadores de análisis avanzado */}
        {professor.analisis_avanzado && (trustIndicator || sentimentIndicator || trendIndicator) && (
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {trustIndicator && (
              <div className={`flex items-center gap-1 text-xs ${trustIndicator.color}`}>
                <trustIndicator.icon className="h-2 w-2 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">{trustIndicator.text}</span>
              </div>
            )}
            {sentimentIndicator && (
              <div className={`flex items-center gap-1 text-xs ${sentimentIndicator.color}`}>
                <sentimentIndicator.icon className="h-2 w-2 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">{sentimentIndicator.text}</span>
              </div>
            )}
            {trendIndicator && (
              <div className={`flex items-center gap-1 text-xs ${trendIndicator.color}`}>
                <trendIndicator.icon className="h-2 w-2 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">{trendIndicator.text}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {professor.etiquetas.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs truncate max-w-[80px] sm:max-w-none">
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
        {professor.calidad_general < 6.0 && (
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-red-600">
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span>Calificación baja</span>
          </div>
        )}
      </div>
    </Card>
  );
};