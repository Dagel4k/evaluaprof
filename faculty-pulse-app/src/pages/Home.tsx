import React, { useEffect, useState } from 'react';
import { DatabaseStats } from '@/components/DatabaseStats';
import { Professor, ProfessorError } from '@/types/professor';
import { ProfessorLoaderService } from '@/services/professorLoader';
import { getProfessorsFromCache, saveProfessorsToCache, isCacheFresh } from '@/lib/cache';
import { Loader2 } from 'lucide-react';

const Home: React.FC = () => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const cached = await getProfessorsFromCache().catch(() => null);
        if (cached && isCacheFresh(cached.timestamp, 7 * 24 * 60 * 60 * 1000) && cached.professors?.length) {
          setProfessors(cached.professors as Professor[]);
          setIsLoading(false);
          return;
        }
        const result = await ProfessorLoaderService.loadAllProfessors();
        setProfessors(result.professors);
        saveProfessorsToCache({ professors: result.professors, errors: result.errors as ProfessorError[], timestamp: Date.now() }).catch(() => {});
      } catch (e) {
        setError('No se pudieron cargar los datos.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 pb-20">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Resumen</h1>
      {isLoading ? (
        <div className="h-[40vh] flex items-center justify-center text-muted-foreground">
          <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Cargando…</div>
        </div>
      ) : error ? (
        <div className="p-4 border bg-red-50 text-red-700 rounded-md">{error}</div>
      ) : (
        <>
          <DatabaseStats professors={professors} />
        </>
      )}
    </div>
  );
};

export default Home; 