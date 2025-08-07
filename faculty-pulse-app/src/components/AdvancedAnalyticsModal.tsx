import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  LineChart, 
  Shield, 
  Heart, 
  TrendingUp, 
  Brain, 
  Target,
  Activity,
  AlertTriangle,
  CheckCircle,
  Users,
  Calendar,
  Star,
  Zap
} from 'lucide-react';
import { Professor } from '@/types/professor';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface AdvancedAnalyticsModalProps {
  professor: Professor;
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedAnalyticsModal: React.FC<AdvancedAnalyticsModalProps> = ({
  professor,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Preparar datos para visualizaciones
  const trustScore = professor.analisis_avanzado?.trust_score || 0;
  const sentimentScore = professor.analisis_avanzado?.sentiment_score || 0;
  const qualityTrend = professor.analisis_avanzado?.quality_trend || [];
  const forecastQuality = professor.analisis_avanzado?.forecast_quality || 0;

  // Datos para el radar chart
  const radarData = [
    { subject: 'Calidad', value: professor.calidad_general, fullMark: 10 },
    { subject: 'Confiabilidad', value: trustScore * 10, fullMark: 10 },
    { subject: 'Recomendación', value: professor.porcentaje_recomienda / 10, fullMark: 10 },
    { subject: 'Sentiment', value: (sentimentScore + 1) * 5, fullMark: 10 },
    { subject: 'Pronóstico', value: forecastQuality, fullMark: 10 },
    { subject: 'Popularidad', value: Math.min(professor.numero_calificaciones / 10, 10), fullMark: 10 }
  ];

  // Datos para gráfico de tendencias
  const trendData = qualityTrend.map((value, index) => ({
    period: `Período ${index + 1}`,
    calidad: value,
    promedio: professor.calidad_general
  }));

  // Distribución de sentimientos por período
  const sentimentDistribution = [
    { name: 'Positivo', value: sentimentScore > 0.1 ? 70 : 30, color: '#10b981' },
    { name: 'Neutro', value: Math.abs(sentimentScore) <= 0.1 ? 50 : 30, color: '#f59e0b' },
    { name: 'Negativo', value: sentimentScore < -0.1 ? 60 : 20, color: '#ef4444' }
  ];

  const getScoreColor = (score: number, max: number = 10) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number, max: number = 10) => {
    const percentage = (score / max) * 100;
    if (percentage >= 90) return 'Excepcional';
    if (percentage >= 80) return 'Excelente';
    if (percentage >= 70) return 'Muy Bueno';
    if (percentage >= 60) return 'Bueno';
    if (percentage >= 50) return 'Regular';
    return 'Necesita Mejora';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            Análisis Avanzado - {professor.nombre}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
            <TabsTrigger value="sentiment">Sentimiento</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Calidad</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(professor.calidad_general)}`}>
                  {professor.calidad_general.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getScoreLabel(professor.calidad_general)}
                </div>
              </Card>

              <Card className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Confianza</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(trustScore * 10)}`}>
                  {(trustScore * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {getScoreLabel(trustScore * 10)}
                </div>
              </Card>

              <Card className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  <span className="text-sm text-muted-foreground">Sentimiento</span>
                </div>
                <div className={`text-2xl font-bold ${
                  sentimentScore >= 0.3 ? 'text-green-600' :
                  sentimentScore >= -0.1 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {sentimentScore >= 0.3 ? 'Positivo' :
                   sentimentScore >= -0.1 ? 'Neutro' : 'Negativo'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {sentimentScore.toFixed(2)}
                </div>
              </Card>

              <Card className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Pronóstico</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(forecastQuality)}`}>
                  {forecastQuality.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Próxima evaluación
                </div>
              </Card>
            </div>

            {/* Radar Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Perfil Multidimensional
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 10]} 
                    tick={false}
                  />
                  <Radar
                    name="Profesor"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Tendencia de Calidad */}
            {trendData.length > 1 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Evolución de la Calidad
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsLineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="calidad" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="promedio" 
                      stroke="#94a3b8" 
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
                <div className="mt-4 text-sm text-muted-foreground">
                  La línea sólida muestra la evolución real, la punteada el promedio general.
                </div>
              </Card>
            )}

            {/* Métricas de Tendencia */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Tendencia General</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {qualityTrend.length > 1 && 
                   qualityTrend[qualityTrend.length - 1] > qualityTrend[0] ? '↗' : '→'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {qualityTrend.length > 1 && 
                   qualityTrend[qualityTrend.length - 1] > qualityTrend[0] ? 'Mejorando' : 'Estable'}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Consistencia</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {qualityTrend.length > 0 ? 
                    (qualityTrend.reduce((sum, val, i, arr) => 
                      i > 0 ? sum + Math.abs(val - arr[i-1]) : sum, 0) / 
                     (qualityTrend.length - 1)).toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Variación promedio
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">Momentum</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {qualityTrend.length >= 3 ? 
                    ((qualityTrend[qualityTrend.length - 1] - 
                      qualityTrend[qualityTrend.length - 3]) / 2).toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Cambio reciente
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-6">
            {/* Análisis de Sentimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Distribución de Sentimientos
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sentimentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sentimentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {sentimentDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Análisis Emocional
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Satisfacción General</span>
                      <span className="text-sm">{((sentimentScore + 1) * 50).toFixed(0)}%</span>
                    </div>
                    <Progress value={(sentimentScore + 1) * 50} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Confianza</span>
                      <span className="text-sm">{(trustScore * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={trustScore * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Recomendación</span>
                      <span className="text-sm">{professor.porcentaje_recomienda.toFixed(0)}%</span>
                    </div>
                    <Progress value={professor.porcentaje_recomienda} className="h-2" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Indicadores de Alerta */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Indicadores de Calidad
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${
                  trustScore >= 0.8 ? 'bg-green-50 border-green-200' :
                  trustScore >= 0.6 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className={`h-5 w-5 ${
                      trustScore >= 0.8 ? 'text-green-600' :
                      trustScore >= 0.6 ? 'text-yellow-600' :
                      'text-red-600'
                    }`} />
                    <span className="font-semibold">Confiabilidad</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {trustScore >= 0.8 ? 'Datos muy confiables con alta consistencia' :
                     trustScore >= 0.6 ? 'Datos moderadamente confiables' :
                     'Datos con baja confiabilidad, revisar fuentes'}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  professor.numero_calificaciones >= 20 ? 'bg-green-50 border-green-200' :
                  professor.numero_calificaciones >= 10 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className={`h-5 w-5 ${
                      professor.numero_calificaciones >= 20 ? 'text-green-600' :
                      professor.numero_calificaciones >= 10 ? 'text-yellow-600' :
                      'text-red-600'
                    }`} />
                    <span className="font-semibold">Muestra</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {professor.numero_calificaciones >= 20 ? 'Muestra estadísticamente significativa' :
                     professor.numero_calificaciones >= 10 ? 'Muestra moderada' :
                     'Muestra pequeña, datos limitados'}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  Math.abs(sentimentScore) <= 0.1 ? 'bg-yellow-50 border-yellow-200' :
                  sentimentScore > 0.1 ? 'bg-green-50 border-green-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className={`h-5 w-5 ${
                      Math.abs(sentimentScore) <= 0.1 ? 'text-yellow-600' :
                      sentimentScore > 0.1 ? 'text-green-600' :
                      'text-red-600'
                    }`} />
                    <span className="font-semibold">Percepción</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Math.abs(sentimentScore) <= 0.1 ? 'Percepción neutral o mixta' :
                     sentimentScore > 0.1 ? 'Percepción positiva generalizada' :
                     'Percepción negativa, áreas de mejora'}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Insights Automáticos */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Insights Automáticos
              </h3>
              <div className="space-y-4">
                {/* Insight de Tendencia */}
                {qualityTrend.length > 1 && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Tendencia de Calidad</h4>
                      <p className="text-sm text-blue-700">
                        {qualityTrend[qualityTrend.length - 1] > qualityTrend[0] ?
                          'El profesor muestra una tendencia positiva en sus evaluaciones, indicando mejora continua.' :
                          'El profesor mantiene un nivel estable en sus evaluaciones a lo largo del tiempo.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Insight de Confiabilidad */}
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900">Confiabilidad de Datos</h4>
                    <p className="text-sm text-green-700">
                      {trustScore >= 0.8 ?
                        'Los datos muestran alta consistencia y confiabilidad. Las evaluaciones son coherentes.' :
                        trustScore >= 0.6 ?
                        'Los datos tienen confiabilidad moderada. Algunas evaluaciones pueden ser inconsistentes.' :
                        'Los datos muestran baja confiabilidad. Se recomienda obtener más evaluaciones.'}
                    </p>
                  </div>
                </div>

                {/* Insight de Popularidad */}
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-900">Popularidad</h4>
                    <p className="text-sm text-purple-700">
                      {professor.numero_calificaciones >= 30 ?
                        'Profesor muy popular con gran cantidad de evaluaciones estudiantiles.' :
                        professor.numero_calificaciones >= 15 ?
                        'Profesor con popularidad moderada entre los estudiantes.' :
                        'Profesor con pocas evaluaciones. Podría beneficiarse de mayor visibilidad.'}
                    </p>
                  </div>
                </div>

                {/* Insight de Recomendación */}
                <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900">Recomendación</h4>
                    <p className="text-sm text-yellow-700">
                      {professor.porcentaje_recomienda >= 80 ?
                        'Altamente recomendado por los estudiantes. Excelente opción.' :
                        professor.porcentaje_recomienda >= 60 ?
                        'Moderadamente recomendado. Buena opción con algunas consideraciones.' :
                        'Baja recomendación estudiantil. Evaluar cuidadosamente antes de elegir.'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recomendaciones */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recomendaciones para Estudiantes
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <p className="text-sm text-green-800">
                    <strong>Fortalezas:</strong> Aprovecha las áreas donde el profesor destaca según las evaluaciones.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800">
                    <strong>Preparación:</strong> {professor.calidad_general >= 8 ?
                      'Profesor de alta calidad, prepárate para un curso desafiante y enriquecedor.' :
                      'Prepárate bien para las clases y mantén comunicación constante con el profesor.'}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                  <p className="text-sm text-purple-800">
                    <strong>Expectativas:</strong> {forecastQuality > professor.calidad_general ?
                      'Las tendencias sugieren que la calidad del profesor está mejorando.' :
                      'Mantén expectativas realistas basadas en las evaluaciones actuales.'}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
