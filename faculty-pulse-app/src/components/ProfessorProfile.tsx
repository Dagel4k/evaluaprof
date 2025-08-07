import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Star, 
  Users, 
  TrendingUp, 
  GraduationCap,
  Building,
  Calendar,
  Bot,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Professor } from '@/types/professor';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReactWordcloud from 'react-wordcloud';
import { AIAnalysisModal } from './AIAnalysisModal';

interface ProfessorProfileProps {
  professor: Professor;
  onBack: () => void;
  onAIAnalysis: (professor: Professor) => void;
}

export const ProfessorProfile: React.FC<ProfessorProfileProps> = ({ 
  professor, 
  onBack, 
  onAIAnalysis 
}) => {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Preparar datos para el gráfico de distribución (escala 1-10)
  const gradeDistribution = Array.from({length: 10}, (_, i) => {
    const grade = i + 1;
    return {
      grade: grade.toString(),
      count: professor.calificaciones.filter(c => 
        Math.floor(c.calificacion_general) === grade
      ).length
    };
  });

  // Preparar palabras para el word cloud
  const wordCloudData = professor.etiquetas.map(tag => ({
    text: tag,
    value: Math.random() * 50 + 10 // Simular frecuencia
  }));

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

  // Función para formatear fechas en español
  const formatDate = (dateString: string) => {
    try {
      // Si viene en formato "DD/MMM/YYYY" convertir a formato Date válido
      const months: {[key: string]: string} = {
        'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12'
      };
      
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parts[0];
        const monthAbbr = parts[1];
        const year = parts[2];
        const month = months[monthAbbr] || '01';
        return new Date(`${year}-${month}-${day}`).toLocaleDateString('es-ES');
      }
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };

  // Análisis de materias
  const subjects = [...new Set(professor.calificaciones.map(c => c.materia))];
  const subjectStats = subjects.map(subject => {
    const subjectGrades = professor.calificaciones.filter(c => c.materia === subject);
    const avgGrade = subjectGrades.reduce((sum, c) => sum + c.calificacion_general, 0) / subjectGrades.length;
    return { subject, avgGrade, count: subjectGrades.length };
  });

  const difficulty = getDifficultyLevel(professor.dificultad_promedio);

  const handleAIAnalysis = () => {
    setIsAIModalOpen(true);
    onAIAnalysis(professor);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Perfil del Profesor</h1>
        </div>

        {/* Información General */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground">{professor.nombre}</h2>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>{professor.universidad}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    <span>{professor.departamento}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="text-sm text-muted-foreground">Promedio</span>
                  </div>
                  <span className={`text-2xl font-bold ${getGradeColor(professor.promedio_general)}`}>
                    {professor.promedio_general.toFixed(1)}
                  </span>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Recomendación</span>
                  </div>
                  <span className={`text-2xl font-bold ${getRecommendationColor(professor.porcentaje_recomienda)}`}>
                    {professor.porcentaje_recomienda}%
                  </span>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Reseñas</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {professor.numero_calificaciones}
                  </span>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Dificultad</span>
                  </div>
                  <Badge className={`text-lg ${difficulty.color}`}>
                    {difficulty.text}
                  </Badge>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleAIAnalysis}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
            >
              <Bot className="h-4 w-4" />
              Análisis IA
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Distribución */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Distribución de Calificaciones</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Word Cloud */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Etiquetas Comunes</h3>
            {wordCloudData.length > 0 ? (
              <div style={{ height: 300 }}>
                <ReactWordcloud
                  words={wordCloudData}
                  options={{
                    rotations: 2,
                    rotationAngles: [0, 90],
                    fontSizes: [14, 32],
                    padding: 5,
                  }}
                />
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay etiquetas disponibles
              </div>
            )}
          </Card>
        </div>

        {/* Análisis por Materia */}
        {subjectStats.length > 1 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Análisis por Materia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectStats.map((stat, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">{stat.subject}</h4>
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

        {/* Reseñas */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Reseñas Recientes</h3>
          <div className="space-y-4">
            {professor.calificaciones.slice(0, 5).map((calificacion, index) => (
              <div key={index} className="border-l-4 border-primary pl-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{calificacion.materia}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className={`font-semibold ${getGradeColor(calificacion.calificacion_general)}`}>
                        {calificacion.calificacion_general.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(calificacion.fecha)}</span>
                  </div>
                </div>
                <p className="text-foreground">{calificacion.comentario}</p>
                {index < 4 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modal de Análisis de IA */}
      <AIAnalysisModal
        professor={professor}
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />
    </>
  );
};