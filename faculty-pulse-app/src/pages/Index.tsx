import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Professor, ProfessorError } from '@/types/professor';
import { ProfessorList } from '@/components/ProfessorList';
import { ProfessorProfile } from '@/components/ProfessorProfile';
import { ErrorProfessors } from '@/components/ErrorProfessors';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight, Database, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProfessorLoaderService } from '@/services/professorLoader';
import { useApiKey } from '@/hooks/useApiKey';
import { getProfessorsFromCache } from '@/lib/cache';

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

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
  const { clearApiKey } = useApiKey();
  const navigate = useNavigate();
  const params = useParams<{ slug?: string }>();

  // Cargar profesores automáticamente al iniciar
  useEffect(() => {
    (async () => {
      if (professors.length > 0) return;
      // Intentar cargar desde caché primero para no re-fetch
      const cached = await getProfessorsFromCache().catch(() => null);
      if (cached?.professors?.length) {
        setProfessors(cached.professors as Professor[]);
        setErrorProfessors(cached.errors as ProfessorError[] || []);
        setViewMode(params.slug ? 'profile' : 'list');
        setIsLoading(false);
        return;
      }
      // Si no hay caché, hacer fetch
      loadProfessors();
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar ruta -> selección
  useEffect(() => {
    if (!params.slug) {
      setSelectedProfessor(null);
      if (!isLoading) setViewMode('list');
      return;
    }
    // intentar resolver desde la lista (o caché si aún no cargó)
    const applyFromList = (list: Professor[]) => {
      const found = list.find(p => slugify(p.nombre) === params.slug);
      if (found) {
        setSelectedProfessor(found);
        setViewMode('profile');
      } else {
        // si no hay, volver a la lista
        navigate('/profesores', { replace: true });
      }
    };
    if (professors.length) applyFromList(professors);
    else {
      // cargar caché rápida para resolver el perfil si aún no llega la lista completa
      getProfessorsFromCache().then(cached => {
        if (cached?.professors?.length) applyFromList(cached.professors as Professor[]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug, professors, isLoading]);

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
      setViewMode(params.slug ? 'profile' : 'list');

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
    const slug = slugify(professor.nombre);
    navigate(`/profesores/${slug}`); // push, no replace
  };

  const handleBackToList = () => {
    setSelectedProfessor(null);
    navigate('/profesores', { replace: true });
  };

  const handleAIAnalysis = async (professor: Professor) => {
    toast({
      title: "Análisis IA iniciado",
      description: `Procesando datos de ${professor.nombre}...`,
    });

    setTimeout(() => {
      toast({
        title: "Análisis completado",
        description: "Los resultados están listos para revisión",
      });
    }, 2000);
  };

  const handleClearApiKey = () => {
    clearApiKey();
    // Este toast ahora va con sonner en otra parte
  };

  const renderContent = () => {
    if (viewMode === 'loading') {
      return (
        <div className="safe-y min-h-[100svh] flex items-center justify-center px-4">
          <div className="w-full max-w-2xl text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-academic-info bg-clip-text text-transparent">
                EvaluaProf
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground mb-4 sm:mb-6">
              Herramienta open source de análisis de perfiles académicos
            </p>
            <div className="space-y-3 sm:space-y-4">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto text-primary" />
              <p className="text-base sm:text-lg font-medium">Cargando archivos JSON de profesores...</p>
              {loadingProgress.total > 0 && (
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-sm sm:text-base font-medium text-primary">
                    Procesados {loadingProgress.current}/{loadingProgress.total}
                  </p>
                </div>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground">Esto puede tomar unos segundos</p>
            </div>
          </div>
        </div>
      );
    }

    if (params.slug && selectedProfessor) {
      return (
        <ProfessorProfile 
          professor={selectedProfessor}
          onBack={handleBackToList}
          onAIAnalysis={handleAIAnalysis}
        />
      );
    }

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
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
