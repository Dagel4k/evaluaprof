import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Native } from '@/shared/lib/native';
import { ProfessorLoaderService } from '@/services/professorLoader';
import { setProfessorsCache } from '@/shared/lib/cache';
import { LoadingScreen } from '@/mobile/components/LoadingScreen';
import { useToast } from '@/shared/hooks/use-toast';

const Startup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ current: 0, total: 0 });

  useEffect(() => {
    // Configurar status bar
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    Native.statusBarSetStyle(isDark ? 'dark' : 'light');

    const loadData = async () => {
      try {
        await Native.splashHide();

        // Cargar profesores
        const result = await ProfessorLoaderService.loadAllProfessors(
          (current, total) => {
            setStats({ current, total });
            setProgress(total > 0 ? (current / total) * 100 : 0);
          }
        );

        // Guardar en caché
        setProfessorsCache({
          professors: result.professors,
          errors: result.errors
        });

        // Completar progreso visualmente
        setProgress(100);

        // Breve pausa para ver el 100%
        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 500);

      } catch (error) {
        console.error('Error en startup:', error);
        toast({
          title: "Error de carga",
          description: "Hubo un problema cargando los datos iniciales.",
          variant: "destructive"
        });
        // Intentar navegar de todos modos tras un error
        setTimeout(() => navigate('/home'), 2000);
      }
    };

    // Iniciar carga (pequeño delay para asegurar montaje)
    setTimeout(loadData, 100);

  }, [navigate, toast]);

  return (
    <LoadingScreen 
      progress={progress} 
      current={stats.current} 
      total={stats.total} 
    />
  );
};

export default Startup;