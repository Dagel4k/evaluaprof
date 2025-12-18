import React, { useMemo } from 'react';
import { Professor } from '@/types/professor';
import { ProfessorCard } from './ProfessorCard';
import { ProfessorFilters } from './ProfessorFilters';
import { AdUnit } from '@/components/AdUnit';
import { Input } from '@/shared/ui/input';
import { Search } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { ProfessorListState } from '@/mobile/context/ProfessorContext';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

interface ProfessorListProps {
  professors: Professor[];
  onProfessorSelect: (professor: Professor) => void;
  state: ProfessorListState;
  onStateChange: (partial: Partial<ProfessorListState>) => void;
}

export const ProfessorList: React.FC<ProfessorListProps> = ({
  professors,
  onProfessorSelect,
  state,
  onStateChange
}) => {
  const { searchTerm, filters, currentPage, itemsPerPage } = state;
  
  // Scroll to top ref
  const listTopRef = React.useRef<HTMLDivElement>(null);

  // Extraer lista única de materias para el filtro
  const uniqueSubjects = useMemo(() => {
    return Array.from(new Set(
      professors.flatMap(p => p.calificaciones.map(c => c.materia))
        .filter(m => m && m.trim() !== '')
    )).sort();
  }, [professors]);

  const filteredProfessors = useMemo(() => {
    return professors.filter(professor => {
      // Búsqueda por texto (nombre, universidad, departamento)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        professor.nombre.toLowerCase().includes(searchLower) ||
        professor.universidad.toLowerCase().includes(searchLower) ||
        professor.departamento.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Filtros
      if (filters.materia && !professor.calificaciones.some(c => c.materia === filters.materia)) return false;
      if (professor.calidad_general < filters.promedio_minimo) return false;
      if (professor.nivel_dificultad > filters.dificultad_maxima) return false;
      if (filters.min_reviews > 0 && professor.numero_calificaciones < filters.min_reviews) return false;

      // Filtros avanzados
      if (filters.solo_con_analisis_avanzado && !professor.analisis_avanzado) return false;

      if (filters.confiabilidad_minima > 0) {
        if (!professor.analisis_avanzado ||
            (professor.analisis_avanzado.trust_score || 0) < filters.confiabilidad_minima) return false;
      }

      if (filters.sentimiento) {
        const score = professor.analisis_avanzado?.sentiment_score || 0;
        if (filters.sentimiento === 'positivo' && score < 0.3) return false;
        if (filters.sentimiento === 'neutro' && (score < -0.1 || score >= 0.3)) return false;
        if (filters.sentimiento === 'negativo' && score >= -0.1) return false;
      }

      if (filters.tendencia) {
        const trend = professor.analisis_avanzado?.quality_trend || [];
        if (trend.length < 2) return false; // No se puede determinar tendencia
        const first = trend[0];
        const last = trend[trend.length - 1];

        if (filters.tendencia === 'mejorando' && last <= first) return false;
        if (filters.tendencia === 'declinando' && last >= first) return false;
        if (filters.tendencia === 'estable' && Math.abs(last - first) > 0.5) return false; // Tolerancia de 0.5
      }

      return true;
    });
  }, [professors, searchTerm, filters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProfessors.length / itemsPerPage);
  const paginatedProfessors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProfessors.slice(start, start + itemsPerPage);
  }, [filteredProfessors, currentPage, itemsPerPage]);

  const handleClearFilters = () => {
    onStateChange({
      filters: {
        materia: '',
        promedio_minimo: 0,
        dificultad_maxima: 5,
        confiabilidad_minima: 0,
        sentimiento: '',
        tendencia: '',
        solo_con_analisis_avanzado: false,
        min_reviews: 0
      },
      searchTerm: '',
      currentPage: 1
    });
  };

  const handlePageChange = (page: number) => {
    onStateChange({ currentPage: page });
    // Scroll to top of list smoothly
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchChange = (term: string) => {
    onStateChange({ searchTerm: term, currentPage: 1 });
  };

  const handleFilterChange = (newFilters: any) => {
    onStateChange({ filters: newFilters, currentPage: 1 });
  };

  const handleItemsPerPageChange = (val: number) => {
    onStateChange({ itemsPerPage: val, currentPage: 1 });
  };

  // Helper to generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6" ref={listTopRef}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar profesor, universidad o departamento..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 h-12 text-lg rounded-xl shadow-sm bg-card/50 backdrop-blur-sm border-border/50"
        />
      </div>

      {/* Filters */}
      <ProfessorFilters
        professors={professors}
        filters={filters}
        onFiltersChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        uniqueSubjects={uniqueSubjects}
      />

      {/* Results Count & Page Size */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <span className="text-sm text-muted-foreground font-medium">
          {filteredProfessors.length} profesor{filteredProfessors.length !== 1 ? 'es' : ''} encontrado{filteredProfessors.length !== 1 ? 's' : ''}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(v) => handleItemsPerPageChange(Number(v))}
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      {filteredProfessors.length > 0 ? (
        <div className="space-y-4">
          {paginatedProfessors.map((professor, index) => (
            <React.Fragment key={`${professor.nombre}-${professor.universidad}`}>
              <ProfessorCard
                professor={professor}
                onClick={() => onProfessorSelect(professor)}
              />
              {/* Insert Ad every 5 items */}
              {(index + 1) % 5 === 0 && (
                <AdUnit slotId={`feed-ad-${index}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center bg-card/50 border-dashed border-2">
          <div className="text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No se encontraron profesores</p>
            <p className="text-sm">Intenta ajustar los filtros o tu búsqueda</p>
            <button
              onClick={handleClearFilters}
              className="mt-4 text-primary hover:underline text-sm font-medium"
            >
              Limpiar todos los filtros
            </button>
          </div>
        </Card>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {getPageNumbers().map((page, i) => (
                <PaginationItem key={i}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => handlePageChange(page as number)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};
