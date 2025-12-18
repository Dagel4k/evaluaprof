import React, { useEffect } from 'react';
import { DatabaseStats } from '@/mobile/components/DatabaseStats';
import { Loader2 } from 'lucide-react';
import { useProfessorContext } from '@/mobile/context/ProfessorContext';
import { ProfessorLoaderService } from '@/services/professorLoader';
import { getProfessorsFromCache } from '@/shared/lib/cache';
import { Professor, ProfessorError } from '@/types/professor';

const Home: React.FC = () => {
  const { 
    professors, 
    setProfessors, 
    dataLoaded, 
    setDataLoaded, 
    isLoadingData, 
    setIsLoadingData 
  } = useProfessorContext();

  useEffect(() => {
    const loadIfNeeded = async () => {
      // Si ya hay datos en memoria, no hacer nada
      if (dataLoaded && professors.length > 0) return;

      setIsLoadingData(true);
      try {
        // 1. Intentar caché
        const cached = await getProfessorsFromCache().catch(() => null);
        if (cached?.professors?.length) {
          setProfessors(cached.professors as Professor[]);
          setDataLoaded(true);
          setIsLoadingData(false);
          return;
        }

        // 2. Cargar de red
        const result = await ProfessorLoaderService.loadAllProfessors();
        setProfessors(result.professors);
        setDataLoaded(true);
      } catch (e) {
        console.error("Error loading in Home:", e);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadIfNeeded();
  }, [dataLoaded, professors.length, setProfessors, setDataLoaded, setIsLoadingData]);

  // Si estamos cargando y no hay datos que mostrar
  if (isLoadingData && professors.length === 0) {
    return (
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 pb-20">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Resumen</h1>
        <div className="h-[40vh] flex items-center justify-center text-muted-foreground">
          <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Cargando datos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 pb-20">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Resumen</h1>
      {professors.length > 0 ? (
        <DatabaseStats professors={professors} />
      ) : (
        <div className="p-4 border bg-yellow-50 text-yellow-700 rounded-md">
          No hay datos disponibles. Intenta recargar en la sección de Profesores.
        </div>
      )}
    </div>
  );
};

export default Home; 