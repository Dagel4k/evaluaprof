import React from 'react';
import { Card } from '@/shared/ui/card';
import { BarChart3, TrendingUp, Shield, Heart, Target, LineChart, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Professor } from '@/types/professor';

interface ProfileChartsProps {
  professor: Professor;
}

export const ProfileCharts: React.FC<ProfileChartsProps> = ({ professor }) => {
  const getGradeColor = (grade: number) => {
    if (grade >= 8.0) return 'text-green-600';
    if (grade >= 6.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Preparar datos para el gráfico de distribución (escala 1-10)
  const gradeDistribution = React.useMemo(() => {
    return Array.from({length: 10}, (_, i) => {
      const grade = i + 1;
      return {
        grade: grade.toString(),
        count: professor.calificaciones.filter(c => 
          Math.floor(c.puntaje_calidad_general) === grade
        ).length
      };
    });
  }, [professor]);

  // Análisis de materias
  const subjectStats = React.useMemo(() => {
    const subjects = [...new Set(professor.calificaciones.map(c => c.materia))];
    return subjects.map(subject => {
      const subjectGrades = professor.calificaciones.filter(c => c.materia === subject);
      const avgGrade = subjectGrades.reduce((sum, c) => sum + c.puntaje_calidad_general, 0) / subjectGrades.length;
      return { subject, avgGrade, count: subjectGrades.length };
    });
  }, [professor]);

  return (
    <>
      {/* IA avanzada si disponible */}
      {professor.analisis_avanzado && (
        <Card className="p-6 mb-6 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Análisis Avanzado con IA</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {/* Tendencia de calidad como área con degradado */}
            {professor.analisis_avanzado.quality_trend && professor.analisis_avanzado.quality_trend.length > 1 && (
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={professor.analisis_avanzado.quality_trend.map((v, i) => ({ idx: i + 1, calidad: v }))}>
                    <defs>
                      <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="idx" stroke="rgba(148,163,184,0.5)" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 12 }} />
                    <YAxis stroke="rgba(148,163,184,0.5)" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 12 }} domain={[0, 10]} />
                    <Tooltip formatter={(value: any) => [`${(value as number).toFixed(1)}`, 'Calidad']} />
                    <Area type="monotone" dataKey="calidad" stroke="hsl(var(--primary))" fill="url(#qualityGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de Calificaciones */}
        <Card className="p-6 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribución de Calificaciones
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gradeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis dataKey="grade" stroke="rgba(148,163,184,0.5)" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 12 }} />
              <YAxis stroke="rgba(148,163,184,0.5)" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 12 }} />
              <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => [value, 'Cantidad']} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Análisis por Materia */}
        {subjectStats.length > 1 && (
          <Card className="p-6 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50">
            <h3 className="text-lg font-semibold mb-4">Análisis por Materia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectStats.map((stat, index) => (
                <div key={index} className="p-6 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-sm mb-2 truncate">{stat.subject}</h4>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${getGradeColor(stat.avgGrade)}`}>
                      {stat.avgGrade.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stat.count} reseña{stat.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
};
