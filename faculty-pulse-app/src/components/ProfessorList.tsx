import React, { useState, useMemo } from 'react';
import { Professor, Filters } from '@/types/professor';
import { ProfessorCard } from './ProfessorCard';
import { ProfessorFilters } from './ProfessorFilters';
import { DatabaseStats } from './DatabaseStats';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface ProfessorListProps {
  professors: Professor[];
  onProfessorSelect: (professor: Professor) => void;
}

export const ProfessorList: React.FC<ProfessorListProps> = ({ 
  professors, 
  onProfessorSelect 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>({
    materia: '',
    promedio_minimo: 0,
    dificultad_maxima: 5,
    confiabilidad_minima: 0,
    sentimiento: '',
    tendencia: '',
    solo_con_analisis_avanzado: false,
    min_reviews: 0
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular profesores por página (responsive)
  const professorsPerPage = 9; // 3 filas × 3 columnas = 9 profesores por página

  // Función para normalizar nombres de materias
  const normalizeSubject = (subject: string): string => {
    return subject
      .toLowerCase()
      .trim()
      .replace(/[áéíóúüñ]/g, (match) => {
        const accents: { [key: string]: string } = {
          'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u', 'ñ': 'n'
        };
        return accents[match] || match;
      })
      .replace(/[^a-z0-9\s]/g, ' ') // Remover caracteres especiales excepto espacios
      .replace(/\s+/g, ' ') // Normalizar espacios múltiples
      .trim();
  };

  // Función para agrupar materias similares
  const groupSimilarSubjects = (subjects: string[]): { [key: string]: string[] } => {
    const normalizedMap = new Map<string, string[]>();
    
    subjects.forEach(subject => {
      const normalized = normalizeSubject(subject);
      
      if (!normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, []);
      }
      normalizedMap.get(normalized)!.push(subject);
    });

    // Convertir a objeto con el nombre más común como clave
    const groupedSubjects: { [key: string]: string[] } = {};
    
    normalizedMap.forEach((variations, normalized) => {
      // Encontrar la variación más común o la más corta
      const mostCommon = variations.reduce((prev, current) => {
        // Preferir variaciones que contengan palabras clave completas
        const prevScore = prev.toLowerCase().includes('lineal') ? 2 : 1;
        const currentScore = current.toLowerCase().includes('lineal') ? 2 : 1;
        
        if (prevScore !== currentScore) {
          return prevScore > currentScore ? prev : current;
        }
        
        // Si tienen el mismo score, preferir la más corta
        return prev.length <= current.length ? prev : current;
      });
      
      groupedSubjects[mostCommon] = variations;
    });

    return groupedSubjects;
  };

  // Obtener materias agrupadas para el filtro
  const groupedSubjects = useMemo(() => {
    const allSubjects = Array.from(new Set(
      professors.flatMap(p => p.calificaciones.map(c => c.materia))
        .filter(materia => materia && materia.trim() !== '' && materia !== 'undefined')
    ));
    
    return groupSimilarSubjects(allSubjects);
  }, [professors]);

  // Obtener lista de materias únicas para el filtro
  const uniqueSubjects = useMemo(() => {
    return Object.keys(groupedSubjects).sort();
  }, [groupedSubjects]);

  const filteredProfessors = useMemo(() => {
    return professors.filter(professor => {
      // Búsqueda por texto
      const matchesSearch = professor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          professor.universidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          professor.departamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (professor.ciudad && professor.ciudad.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro por materia (usando agrupación inteligente)
      const matchesSubject = filters.materia === '' || 
                           professor.calificaciones.some(cal => {
                             const normalizedCal = normalizeSubject(cal.materia);
                             const normalizedFilter = normalizeSubject(filters.materia);
                             return normalizedCal === normalizedFilter;
                           });

      // Filtro por promedio mínimo
      const matchesGrade = professor.calidad_general >= filters.promedio_minimo;

      // Filtro por dificultad máxima
      const matchesDifficulty = professor.nivel_dificultad <= filters.dificultad_maxima;

      // Filtros avanzados
      const matchesAdvancedOnly = !filters.solo_con_analisis_avanzado || 
                                 (professor.analisis_avanzado !== undefined);

      const matchesMinReviews = !filters.min_reviews || 
                               professor.numero_calificaciones >= filters.min_reviews;

      const matchesTrust = !filters.confiabilidad_minima || 
                          (professor.analisis_avanzado?.trust_score && 
                           professor.analisis_avanzado.trust_score >= filters.confiabilidad_minima);

      const matchesSentiment = !filters.sentimiento || 
                              (professor.analisis_avanzado?.sentiment_score !== undefined && 
                               ((filters.sentimiento === 'positivo' && professor.analisis_avanzado.sentiment_score >= 0.3) ||
                                (filters.sentimiento === 'neutro' && Math.abs(professor.analisis_avanzado.sentiment_score) <= 0.1) ||
                                (filters.sentimiento === 'negativo' && professor.analisis_avanzado.sentiment_score < -0.1)));

      const matchesTrend = !filters.tendencia || 
                          (professor.analisis_avanzado?.quality_trend && 
                           professor.analisis_avanzado.quality_trend.length > 1 && 
                           ((filters.tendencia === 'mejorando' && 
                             professor.analisis_avanzado.quality_trend[professor.analisis_avanzado.quality_trend.length - 1] > 
                             professor.analisis_avanzado.quality_trend[0]) ||
                            (filters.tendencia === 'estable' && 
                             Math.abs(professor.analisis_avanzado.quality_trend[professor.analisis_avanzado.quality_trend.length - 1] - 
                                     professor.analisis_avanzado.quality_trend[0]) <= 0.5) ||
                            (filters.tendencia === 'declinando' && 
                             professor.analisis_avanzado.quality_trend[professor.analisis_avanzado.quality_trend.length - 1] < 
                             professor.analisis_avanzado.quality_trend[0])));

      return matchesSearch && matchesSubject && matchesGrade && matchesDifficulty && 
             matchesAdvancedOnly && matchesMinReviews && matchesTrust && matchesSentiment && matchesTrend;
    });
  }, [professors, searchTerm, filters]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredProfessors.length / professorsPerPage);
  const startIndex = (currentPage - 1) * professorsPerPage;
  const endIndex = startIndex + professorsPerPage;
  const currentProfessors = filteredProfessors.slice(startIndex, endIndex);

  const clearFilters = () => {
    setFilters({
      materia: '',
      promedio_minimo: 0,
      dificultad_maxima: 5,
      confiabilidad_minima: 0,
      sentimiento: '',
      tendencia: '',
      solo_con_analisis_avanzado: false,
      min_reviews: 0
    });
    setSearchTerm('');
    setCurrentPage(1); // Resetear a la primera página
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Resetear a la primera página cuando cambien los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Función para generar números de página inteligentes
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // Máximo 5 números visibles en móvil
    
    if (totalPages <= maxVisiblePages) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas con elipsis
      if (currentPage <= 3) {
        // Cerca del inicio
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Cerca del final
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // En el medio
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Estadísticas de la Base de Datos (se muestran ahora en Inicio) */}
      {/* <DatabaseStats professors={professors} /> */}

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Barra de búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar profesores, universidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Filtros */}
        <div className="lg:col-span-1">
          <ProfessorFilters
            professors={professors}
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            groupedSubjects={groupedSubjects}
            uniqueSubjects={uniqueSubjects}
          />
        </div>

        {/* Lista de profesores */}
        <div className="lg:col-span-3">
          <div className="mb-4 text-sm text-muted-foreground">
            <span className="block sm:inline">
              Mostrando {filteredProfessors.length} de {professors.length} profesores
            </span>
            {totalPages > 1 && (
              <span className="block sm:inline sm:ml-2">
                (Página {currentPage} de {totalPages})
              </span>
            )}
          </div>
          
          {filteredProfessors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron profesores que coincidan con los criterios</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {currentProfessors.map((professor, index) => (
                  <ProfessorCard
                    key={index}
                    professor={professor}
                    onClick={() => onProfessorSelect(professor)}
                  />
                ))}
              </div>

              {/* Paginación Responsive */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-6">
                  {/* Información de rango */}
                  <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                    <span className="hidden sm:inline">Mostrando </span>
                    {startIndex + 1}-{Math.min(endIndex, filteredProfessors.length)} de {filteredProfessors.length}
                    <span className="hidden sm:inline"> profesores</span>
                  </div>
                  
                  {/* Controles de navegación */}
                  <div className="flex items-center gap-2">
                    {/* Botón Anterior */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="hidden sm:flex"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="sm:hidden"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Números de página */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                          {page === '...' ? (
                            <div className="flex items-center justify-center w-8 h-8">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ) : (
                            <Button
                              variant={page === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(page as number)}
                              className="w-8 h-8 p-0 text-xs sm:text-sm"
                            >
                              {page}
                            </Button>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    
                    {/* Botón Siguiente */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="hidden sm:flex"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="sm:hidden"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};