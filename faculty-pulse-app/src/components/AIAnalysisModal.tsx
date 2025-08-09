import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Star, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Loader2,
  Brain,
  Lightbulb,
  Target
} from 'lucide-react';
import { Professor } from '@/types/professor';
import { AIAnalysisResult, aiAnalysisService } from '@/services/aiAnalysis';
import { ApiKeyModal } from './ApiKeyModal';
import { useApiKey } from '@/hooks/useApiKey';

interface AIAnalysisModalProps {
  professor: Professor;
  isOpen: boolean;
  onClose: () => void;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  professor,
  isOpen,
  onClose
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  const { isConfigured, refreshApiKey } = useApiKey();

  const handleAnalysis = async () => {
    // Verificar si hay API key configurada
    if (!isConfigured) {
      setShowApiKeyModal(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await aiAnalysisService.analyzeProfessor(professor);
      setAnalysis(result);
    } catch (err) {
      if (err instanceof Error && err.message === 'NO_API_KEY') {
        setShowApiKeyModal(true);
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido en el análisis');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeyConfigured = () => {
    setShowApiKeyModal(false);
    // Refrescar el estado del hook y luego reintentar el análisis
    refreshApiKey();
    setTimeout(() => {
      handleAnalysis();
    }, 100);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8.0) return 'text-green-600';
    if (rating >= 6.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 8.5) return 'Excelente';
    if (rating >= 7.0) return 'Muy Bueno';
    if (rating >= 6.0) return 'Bueno';
    if (rating >= 5.0) return 'Regular';
    return 'Necesita Mejora';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Análisis de IA - {professor.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del profesor */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{professor.nombre}</h3>
                <p className="text-sm text-muted-foreground">{professor.universidad}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-bold">{professor.calidad_general.toFixed(1)}/10</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{professor.porcentaje_recomienda}% recomienda</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Botón de análisis */}
          {!analysis && !isLoading && (
            <div className="text-center">
              <Button 
                onClick={handleAnalysis}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                size="lg"
              >
                <Brain className="h-5 w-5" />
                {isConfigured ? 'Iniciar Análisis de IA' : 'Configurar IA y Analizar'}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                {isConfigured 
                  ? 'La IA analizará todos los datos del profesor para dar un veredicto completo'
                  : 'Necesitas configurar tu API key de OpenAI para usar el análisis de IA'
                }
              </p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="safe-y min-h-[40vh] flex items-center justify-center text-center py-6">
              <div>
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-lg font-medium">Analizando datos del profesor...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Esto puede tomar unos segundos
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Error en el análisis</span>
              </div>
              <p className="text-red-700">{error}</p>
              <div className="flex gap-2 mt-3">
                <Button 
                  onClick={handleAnalysis}
                  variant="outline"
                >
                  Intentar de nuevo
                </Button>
                {!isConfigured && (
                  <Button 
                    onClick={() => setShowApiKeyModal(true)}
                    variant="default"
                  >
                    Configurar API Key
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Resultados del análisis */}
          {analysis && (
            <div className="space-y-6">
              {/* Resumen ejecutivo */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Resumen Ejecutivo</h3>
                </div>
                <p className="text-foreground leading-relaxed">{analysis.summary}</p>
              </Card>

              {/* Calificación general */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="h-6 w-6 text-yellow-500 fill-current" />
                    <span className="text-sm text-muted-foreground">Calificación IA</span>
                  </div>
                  <div className={`text-3xl font-bold ${getRatingColor(analysis.overallRating)}`}>
                    {analysis.overallRating.toFixed(1)}/10
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {getRatingLabel(analysis.overallRating)}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Estilo de Enseñanza</h3>
                  </div>
                  <p className="text-foreground">{analysis.teachingStyle}</p>
                </Card>
              </div>

              {/* Fortalezas y Debilidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Fortalezas</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-foreground">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold">Áreas de Mejora</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-foreground">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Recomendaciones */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold">Recomendaciones</h3>
                </div>
                <ul className="space-y-3">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Badge variant="secondary" className="flex-shrink-0">
                        {index + 1}
                      </Badge>
                      <span className="text-foreground">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Consejo para estudiantes */}
              <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Consejo para Estudiantes</h3>
                </div>
                <p className="text-foreground leading-relaxed">{analysis.studentAdvice}</p>
              </Card>

              {/* Evaluación de dificultad */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold">Evaluación de Dificultad</h3>
                </div>
                <p className="text-foreground">{analysis.difficultyAssessment}</p>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Modal de configuración de API Key */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onApiKeyConfigured={handleApiKeyConfigured}
      />
    </Dialog>
  );
}; 