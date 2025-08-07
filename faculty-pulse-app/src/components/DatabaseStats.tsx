import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Star, 
  Shield, 
  Heart, 
  TrendingUp, 
  Database, 
  Zap,
  BarChart3,
  Activity
} from 'lucide-react';
import { Professor } from '@/types/professor';

interface DatabaseStatsProps {
  professors: Professor[];
}

export const DatabaseStats: React.FC<DatabaseStatsProps> = ({ professors }) => {
  // Calcular estadísticas básicas
  const totalProfessors = professors.length;
  const professorsWithAdvanced = professors.filter(p => p.analisis_avanzado).length;
  const advancedPercentage = totalProfessors > 0 ? (professorsWithAdvanced / totalProfessors) * 100 : 0;

  // Estadísticas de calidad
  const averageQuality = professors.length > 0 ? 
    professors.reduce((sum, p) => sum + p.calidad_general, 0) / professors.length : 0;
  
  const totalReviews = professors.reduce((sum, p) => sum + p.numero_calificaciones, 0);

  // Estadísticas de análisis avanzado
  const professorsWithTrust = professors.filter(p => p.analisis_avanzado?.trust_score).length;
  const averageTrust = professorsWithTrust > 0 ? 
    professors
      .filter(p => p.analisis_avanzado?.trust_score)
      .reduce((sum, p) => sum + (p.analisis_avanzado!.trust_score! * 100), 0) / professorsWithTrust : 0;

  const professorsWithSentiment = professors.filter(p => p.analisis_avanzado?.sentiment_score !== undefined).length;
  const positiveSentiment = professors.filter(p => 
    p.analisis_avanzado?.sentiment_score !== undefined && p.analisis_avanzado.sentiment_score >= 0.3
  ).length;
  const positiveSentimentPercentage = professorsWithSentiment > 0 ? 
    (positiveSentiment / professorsWithSentiment) * 100 : 0;

  const professorsWithTrend = professors.filter(p => 
    p.analisis_avanzado?.quality_trend && p.analisis_avanzado.quality_trend.length > 1
  ).length;
  const improvingTrend = professors.filter(p => {
    const trend = p.analisis_avanzado?.quality_trend;
    return trend && trend.length > 1 && trend[trend.length - 1] > trend[0];
  }).length;
  const improvingTrendPercentage = professorsWithTrend > 0 ? 
    (improvingTrend / professorsWithTrend) * 100 : 0;

  // Distribución de calidad
  const qualityDistribution = [
    { range: '9.0-10.0', count: professors.filter(p => p.calidad_general >= 9.0).length, color: 'bg-green-500' },
    { range: '8.0-8.9', count: professors.filter(p => p.calidad_general >= 8.0 && p.calidad_general < 9.0).length, color: 'bg-blue-500' },
    { range: '7.0-7.9', count: professors.filter(p => p.calidad_general >= 7.0 && p.calidad_general < 8.0).length, color: 'bg-yellow-500' },
    { range: '6.0-6.9', count: professors.filter(p => p.calidad_general >= 6.0 && p.calidad_general < 7.0).length, color: 'bg-orange-500' },
    { range: '<6.0', count: professors.filter(p => p.calidad_general < 6.0).length, color: 'bg-red-500' }
  ];

  const maxCount = Math.max(...qualityDistribution.map(d => d.count));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Estadísticas Generales */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-5 w-5 text-blue-600" />
          <span className="font-semibold">Base de Datos</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Profesores</span>
            <span className="font-bold">{totalProfessors}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Reseñas</span>
            <span className="font-bold">{totalReviews.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Promedio Calidad</span>
            <span className="font-bold text-blue-600">{averageQuality.toFixed(1)}</span>
          </div>
        </div>
      </Card>

      {/* Análisis IA */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-purple-600" />
          <span className="font-semibold">Análisis IA</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-muted-foreground">Cobertura IA</span>
              <span className="font-bold">{advancedPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={advancedPercentage} className="h-2" />
          </div>
          <div className="text-xs text-muted-foreground">
            {professorsWithAdvanced} de {totalProfessors} profesores
          </div>
        </div>
      </Card>

      {/* Confiabilidad */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="font-semibold">Confiabilidad</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-muted-foreground">Promedio</span>
              <span className="font-bold text-green-600">{averageTrust.toFixed(0)}%</span>
            </div>
            <Progress value={averageTrust} className="h-2" />
          </div>
          <div className="text-xs text-muted-foreground">
            {professorsWithTrust} profesores analizados
          </div>
        </div>
      </Card>

      {/* Sentimiento */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="h-5 w-5 text-pink-600" />
          <span className="font-semibold">Sentimiento</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-muted-foreground">Positivo</span>
              <span className="font-bold text-pink-600">{positiveSentimentPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={positiveSentimentPercentage} className="h-2" />
          </div>
          <div className="text-xs text-muted-foreground">
            {positiveSentiment} de {professorsWithSentiment} analizados
          </div>
        </div>
      </Card>

      {/* Distribución de Calidad */}
      <Card className="p-4 md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <span className="font-semibold">Distribución de Calidad</span>
        </div>
        <div className="space-y-2">
          {qualityDistribution.map((dist, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-sm w-16 text-muted-foreground">{dist.range}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div 
                  className={`${dist.color} h-4 rounded-full transition-all duration-500`}
                  style={{ width: `${maxCount > 0 ? (dist.count / maxCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold w-8 text-right">{dist.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Tendencias */}
      <Card className="p-4 md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <span className="font-semibold">Tendencias de Mejora</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {improvingTrendPercentage.toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">Mejorando</div>
            <div className="text-xs text-muted-foreground">
              {improvingTrend} profesores
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {professorsWithTrend}
            </div>
            <div className="text-sm text-muted-foreground">Con Tendencias</div>
            <div className="text-xs text-muted-foreground">
              Datos históricos
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={improvingTrendPercentage} className="h-2" />
        </div>
      </Card>
    </div>
  );
};
