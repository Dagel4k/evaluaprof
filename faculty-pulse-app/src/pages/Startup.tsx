import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2 } from 'lucide-react';
import { ProfessorLoaderService } from '@/services/professorLoader';
import { saveProfessorsToCache, getProfessorsFromCache, isCacheFresh } from '@/lib/cache';

const Startup: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState({ current: 0, total: 0, loaded: 0, errors: 0 });

  useEffect(() => {
    (async () => {
      // Si hay caché fresca, saltar carga larga
      const cached = await getProfessorsFromCache().catch(() => null);
      if (cached && isCacheFresh(cached.timestamp, 7 * 24 * 60 * 60 * 1000) && cached.professors?.length) {
        navigate('/home');
        return;
      }

      const result = await ProfessorLoaderService.loadAllProfessors((current, total, loaded, errors) => {
        setProgress({ current, total, loaded, errors });
      });
      await saveProfessorsToCache({ professors: result.professors, errors: result.errors, timestamp: Date.now() }).catch(() => {});
      navigate('/home');
    })();
  }, [navigate]);

  return (
    <div className="safe-y min-h-[100svh] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-academic-info bg-clip-text text-transparent">
            EvaluaProf
          </h1>
        </div>
        <p className="text-lg text-muted-foreground mb-6">Cargando base de datos de profesores…</p>
        <div className="space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          {progress.total > 0 && (
            <div className="text-sm">
              Procesados {progress.current}/{progress.total} · ✓ {progress.loaded} · ⚠ {progress.errors}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Esto puede tomar unos segundos en el primer inicio</p>
        </div>
      </div>
    </div>
  );
};

export default Startup; 