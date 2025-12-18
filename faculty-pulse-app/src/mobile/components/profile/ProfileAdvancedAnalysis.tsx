import React from 'react';
import { Card } from '@/shared/ui/card';
import { Shield, Heart, Target, TrendingUp, LineChart, Zap } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart as RechartsLineChart } from 'recharts';
import { Professor } from '@/types/professor';

interface ProfileAdvancedAnalysisProps {
  professor: Professor;
}

export const ProfileAdvancedAnalysis: React.FC<ProfileAdvancedAnalysisProps> = ({ professor }) => {
  if (!professor.analisis_avanzado) return null;

  return (
    <Card className="p-6 bg-background dark:bg-gradient-to-br dark:from-slate-900/40 dark:to-slate-800/30 border-purple-200/40">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Análisis Avanzado con IA</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Trust Score */}
        {professor.analisis_avanzado.trust_score !== null && (
          <div className="text-center p-6 bg-card rounded-lg shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-sm text-foreground/80">Confiabilidad</span>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {(professor.analisis_avanzado.trust_score * 100).toFixed(0)}%
            </span>
          </div>
        )}

        {/* Sentiment Score */}
        {professor.analisis_avanzado.sentiment_score !== null && (
          <div className="text-center p-6 bg-card rounded-lg shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-pink-500" />
              <span className="text-sm text-foreground/80">Sentimiento</span>
            </div>
            <span className={`text-2xl font-bold ${
              professor.analisis_avanzado.sentiment_score >= 0.3 ? 'text-green-600' :
              professor.analisis_avanzado.sentiment_score >= -0.1 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {professor.analisis_avanzado.sentiment_score >= 0.3 ? 'Positivo' :
               professor.analisis_avanzado.sentiment_score >= -0.1 ? 'Neutro' : 'Negativo'}
            </span>
          </div>
        )}

        {/* Forecast Quality */}
        {professor.analisis_avanzado.forecast_quality && (
          <div className="text-center p-6 bg-card rounded-lg shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-foreground/80">Pronóstico</span>
            </div>
            <span className={`text-2xl font-bold ${
                professor.analisis_avanzado.forecast_quality >= 8 ? 'text-green-600' : 
                professor.analisis_avanzado.forecast_quality >= 6 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {professor.analisis_avanzado.forecast_quality.toFixed(1)}
            </span>
          </div>
        )}

        {/* Trend Indicator */}
        {professor.analisis_avanzado.quality_trend && professor.analisis_avanzado.quality_trend.length > 1 && (
          <div className="text-center p-6 bg-card rounded-lg shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-foreground/80">Tendencia</span>
            </div>
            <span className={`text-2xl font-bold ${
              professor.analisis_avanzado.quality_trend[professor.analisis_avanzado.quality_trend.length - 1] > 
              professor.analisis_avanzado.quality_trend[0] ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {professor.analisis_avanzado.quality_trend[professor.analisis_avanzado.quality_trend.length - 1] > 
               professor.analisis_avanzado.quality_trend[0] ? '↗ Mejorando' : '→ Estable'}
            </span>
          </div>
        )}
      </div>

      {/* Gráfico de Tendencia de Calidad */}
      {professor.analisis_avanzado.quality_trend && professor.analisis_avanzado.quality_trend.length > 1 && (
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Tendencia de Calidad en el Tiempo
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={professor.analisis_avanzado.quality_trend.map((value, index) => ({
              period: `P${index + 1}`,
              calidad: value
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis domain={[0, 10]} />
              <Tooltip 
                formatter={(value: any) => [`${value.toFixed(1)}`, 'Calidad']}
              />
              <Area 
                type="monotone" 
                dataKey="calidad" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
