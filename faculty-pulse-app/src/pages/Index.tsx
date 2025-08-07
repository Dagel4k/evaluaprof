import React, { useState, useEffect } from 'react';
import { Professor, ProfessorError } from '@/types/professor';
import { ProfessorList } from '@/components/ProfessorList';
import { ProfessorProfile } from '@/components/ProfessorProfile';
import { ErrorProfessors } from '@/components/ErrorProfessors';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight, Database, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProfessorLoaderService } from '@/services/professorLoader';
import { useApiKey } from '@/hooks/useApiKey';

type ViewMode = 'loading' | 'list' | 'profile';

const Index = () => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [errorProfessors, setErrorProfessors] = useState<ProfessorError[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{current: number, total: number, loaded: number, errors: number}>({current: 0, total: 0, loaded: 0, errors: 0});
  const { toast } = useToast();
  const { clearApiKey, isConfigured } = useApiKey();

  // Cargar profesores automáticamente al iniciar
  useEffect(() => {
    loadProfessors();
  }, []);

  const loadProfessors = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress({current: 0, total: 0, loaded: 0, errors: 0});
    
    try {
      toast({
        title: "Cargando profesores",
        description: "Obteniendo datos de archivos JSON...",
      });

      const result = await ProfessorLoaderService.loadAllProfessors(
        (current, total, loaded, errors) => {
          setLoadingProgress({current, total, loaded, errors});
        }
      );
      
      setProfessors(result.professors);
      setErrorProfessors(result.errors);
      setViewMode('list');
      
      toast({
        title: "Carga completada",
        description: `${result.professors.length} profesores y ${result.errors.length} errores procesados`,
      });
    } catch (error) {
      console.error('Error cargando profesores:', error);
      setError('Error al cargar los profesores. Intenta recargar la página.');
      
      toast({
        title: "Error al cargar profesores",
        description: "No se pudieron cargar los datos de los profesores",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfessorSelect = (professor: Professor) => {
    setSelectedProfessor(professor);
    setViewMode('profile');
  };

  const handleBackToList = () => {
    setSelectedProfessor(null);
    setViewMode('list');
  };

  const handleAIAnalysis = async (professor: Professor) => {
    toast({
      title: "Análisis IA iniciado",
      description: `Procesando datos de ${professor.nombre}...`,
    });
    
    // Aquí iría la llamada al backend en Python
    setTimeout(() => {
      toast({
        title: "Análisis completado",
        description: "Los resultados están listos para revisión",
      });
    }, 2000);
  };

  const handleClearApiKey = () => {
    clearApiKey();
    toast({
      title: "API Key eliminada",
      description: "La clave ha sido eliminada del navegador",
      variant: "destructive",
    });
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'loading':
        return (
          <div className="max-w-2xl mx-auto text-center px-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-academic-info bg-clip-text text-transparent">
                EvaluaProf
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground mb-4 sm:mb-6">
              Herramienta open source de análisis de perfiles académicos
            </p>
            
            {isLoading ? (
              <div className="space-y-3 sm:space-y-4">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto text-primary" />
                <p className="text-base sm:text-lg font-medium">Cargando archivos JSON de profesores...</p>
                {loadingProgress.total > 0 && (
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-sm sm:text-base font-medium text-primary">
                      Procesados {loadingProgress.current}/{loadingProgress.total}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm justify-center">
                      <p className="text-green-600">
                        ✓ Cargados: {loadingProgress.loaded}
                      </p>
                      <p className="text-orange-600">
                        ⚠ Errores: {loadingProgress.errors}
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Esto puede tomar unos segundos
                </p>
              </div>
            ) : error ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 border border-red-200 bg-red-50 rounded-lg">
                  <p className="text-red-700 mb-3 sm:mb-4 text-sm sm:text-base">{error}</p>
                  <Button onClick={loadProfessors} className="gap-2 w-full sm:w-auto">
                    <RefreshCw className="h-4 w-4" />
                    Intentar de nuevo
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      
      case 'list':
        return (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">Profesores</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Archivos JSON con {professors.length} perfiles académicos
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  onClick={loadProfessors}
                  className="gap-2 w-full sm:w-auto"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Recargar</span>
                  <span className="sm:hidden">Recargar datos</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClearApiKey}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
                  title="Debug: Limpiar API Key de OpenAI"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Debug API</span>
                  <span className="sm:hidden">Debug</span>
                </Button>
              </div>
            </div>
            <ProfessorList 
              professors={professors} 
              onProfessorSelect={handleProfessorSelect} 
            />
            <ErrorProfessors errors={errorProfessors} />
          </div>
        );
      
      case 'profile':
        return selectedProfessor ? (
          <ProfessorProfile 
            professor={selectedProfessor}
            onBack={handleBackToList}
            onAIAnalysis={handleAIAnalysis}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
