import React, { useState, useEffect, Suspense, useLayoutEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Professor, ProfessorError } from '@/types/professor';
import { ProfessorList } from '@/mobile/components/ProfessorList';
import { ProfessorProfile } from '@/mobile/components/ProfessorProfile';
import { ErrorProfessors } from '@/mobile/components/ErrorProfessors';
import { Button } from '@/shared/ui/button';
import { GraduationCap, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { ProfessorLoaderService } from '@/services/professorLoader';
import { useApiKey } from '@/mobile/hooks/useApiKey';
import { getProfessorsFromCache } from '@/shared/lib/cache';
import { AnimatePresence, motion } from 'framer-motion';
import { Native } from '@/shared/lib/native';
import { useProfessorContext } from '@/mobile/context/ProfessorContext';

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

type ViewMode = 'loading' | 'list' | 'profile';

const Index = () => {
  // Contexto para datos y estado
  const { 
    listState, 
    updateListState, 
    setLastProfessorsPath,
    professors, 
    setProfessors, 
    dataLoaded, 
    setDataLoaded,
    isLoadingData,
    setIsLoadingData
  } = useProfessorContext();

  // Local state for non-persistent UI things
  const [errorProfessors, setErrorProfessors] = useState<ProfessorError[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{current: number, total: number, loaded: number, errors: number}>({current: 0, total: 0, loaded: 0, errors: 0});
  
  const { toast } = useToast();
  const { clearApiKey } = useApiKey();
  const navigate = useNavigate();
  const params = useParams<{ slug?: string }>();
  const location = useLocation();
  const scrollSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Restaurar scroll al montar (solo en vista lista)
  useLayoutEffect(() => {
    if (!params.slug && listState.scrollPosition > 0) {
      window.scrollTo({ top: listState.scrollPosition, behavior: 'auto' });
    } else if (params.slug) {
      window.scrollTo(0, 0);
    }
  }, [params.slug]); 

  // Guardar ruta actual
  useEffect(() => {
    setLastProfessorsPath(location.pathname);
  }, [location.pathname, setLastProfessorsPath]);

  // Guardar posición de scroll
  useEffect(() => {
    if (params.slug) return; 

    const handleScroll = () => {
      if (scrollSaveTimeoutRef.current) clearTimeout(scrollSaveTimeoutRef.current);
      scrollSaveTimeoutRef.current = setTimeout(() => {
        updateListState({ scrollPosition: window.scrollY });
      }, 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollSaveTimeoutRef.current) clearTimeout(scrollSaveTimeoutRef.current);
    };
  }, [params.slug, updateListState]);

  // Cargar profesores automáticamente al iniciar (solo si no están cargados)
  useEffect(() => {
    (async () => {
      // Si ya tenemos datos en el contexto, usarlos inmediatamente
      if (dataLoaded && professors.length > 0) {
        setViewMode(params.slug ? 'profile' : 'list');
        return;
      }
      
      // Intentar cargar desde caché persistente (IndexedDB/Cache API wrapper)
      const cached = await getProfessorsFromCache().catch(() => null);
      if (cached?.professors?.length) {
        setProfessors(cached.professors as Professor[]);
        setErrorProfessors(cached.errors as ProfessorError[] || []);
        setDataLoaded(true);
        setViewMode(params.slug ? 'profile' : 'list');
        return;
      }
      
      // Si no hay datos ni caché, cargar de red/files
      loadProfessors();
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar ruta -> selección
  useEffect(() => {
    const isReady = dataLoaded || professors.length > 0;
    if (!params.slug) {
      setSelectedProfessor(null);
      if (isReady) setViewMode('list');
      return;
    }
    
    // intentar resolver desde la lista
    const applyFromList = (list: Professor[]) => {
      const found = list.find(p => slugify(p.nombre) === params.slug);
      if (found) {
        setSelectedProfessor(found);
        setViewMode('profile');
      } else {
        navigate('/profesores', { replace: true });
      }
    };
    
    if (professors.length) {
      applyFromList(professors);
    } else if (!isReady) {
       // Esperar a que cargue
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug, professors, dataLoaded]);

  useEffect(() => {
    Native.keyboardSetResize('native');
  }, []);

  const loadProfessors = async () => {
    setIsLoadingData(true);
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
      setDataLoaded(true);
      setViewMode(params.slug ? 'profile' : 'list');

      toast({
        title: "Carga completada",
        description: `${result.professors.length} profesores procesados`,
      });
    } catch (error) {
      console.error('Error cargando profesores:', error);
      setError('Error al cargar los profesores. Intenta recargar la página.');
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleProfessorSelect = (professor: Professor) => {
    updateListState({ scrollPosition: window.scrollY });
    const slug = slugify(professor.nombre);
    navigate(`/profesores/${slug}`);
  };

  const handleBackToList = () => {
    setSelectedProfessor(null);
    navigate('/profesores', { replace: true });
  };

  const handleAIAnalysis = async (professor: Professor) => {};

  const handleClearApiKey = async () => {
    await Native.hapticImpact('medium');
    clearApiKey();
    toast({ title: 'API Key borrada', description: 'Se eliminó la configuración de OpenAI' });
  };

  const renderContent = () => {
    if (viewMode === 'loading' || (isLoadingData && professors.length === 0)) {
      return (
        <div className="safe-y min-h-[100svh] flex items-center justify-center px-4">
          <div className="w-full max-w-2xl text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-academic-info bg-clip-text text-transparent">
                EvaluaProf
              </h1>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto text-primary" />
              <p className="text-base sm:text-lg font-medium">Cargando datos...</p>
              {loadingProgress.total > 0 && (
                <p className="text-sm text-muted-foreground">
                   {loadingProgress.current}/{loadingProgress.total}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <AnimatePresence mode="wait" initial={false}>
        {params.slug && selectedProfessor ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Cargando perfil…</div>}>
              <ProfessorProfile 
                professor={selectedProfessor}
                onBack={handleBackToList}
                onAIAnalysis={handleAIAnalysis}
              />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            <div onScrollCapture={() => Native.keyboardHide()}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold truncate">Profesores</h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {professors.length} perfiles disponibles
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
                    <span className="sm:hidden">Recargar</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleClearApiKey}
                    className="gap-2 w-full sm:w-auto text-red-500 hover:text-red-600 hover:bg-red-50 h-8 text-xs"
                    title="Borrar API Key"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="hidden sm:inline">API</span>
                    <span className="sm:hidden">API</span>
                  </Button>
                </div>
              </div>
              <ProfessorList 
                professors={professors} 
                onProfessorSelect={handleProfessorSelect}
                state={listState}
                onStateChange={updateListState}
              />
              <ErrorProfessors errors={errorProfessors} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;