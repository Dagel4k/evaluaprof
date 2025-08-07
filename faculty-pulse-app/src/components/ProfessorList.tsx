import React, { useState, useMemo } from 'react';
import { Professor, Filters } from '@/types/professor';
import { ProfessorCard } from './ProfessorCard';
import { ProfessorFilters } from './ProfessorFilters';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
    dificultad_maxima: 5
  });

  const filteredProfessors = useMemo(() => {
    return professors.filter(professor => {
      // Búsqueda por texto
      const matchesSearch = professor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          professor.universidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          professor.departamento.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por materia
      const matchesSubject = filters.materia === '' || 
                           professor.calificaciones.some(c => c.materia === filters.materia);

      // Filtro por promedio mínimo
      const matchesGrade = professor.promedio_general >= filters.promedio_minimo;

      // Filtro por dificultad máxima
      const matchesDifficulty = professor.dificultad_promedio <= filters.dificultad_maxima;

      return matchesSearch && matchesSubject && matchesGrade && matchesDifficulty;
    });
  }, [professors, searchTerm, filters]);

  const clearFilters = () => {
    setFilters({
      materia: '',
      promedio_minimo: 0,
      dificultad_maxima: 5
    });
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Barra de búsqueda */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar profesores, universidades o departamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros */}
        <div className="lg:col-span-1">
          <ProfessorFilters
            professors={professors}
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Lista de profesores */}
        <div className="lg:col-span-3">
          <div className="mb-4 text-sm text-muted-foreground">
            Mostrando {filteredProfessors.length} de {professors.length} profesores
          </div>
          
          {filteredProfessors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron profesores que coincidan con los criterios</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProfessors.map((professor, index) => (
                <ProfessorCard
                  key={index}
                  professor={professor}
                  onClick={() => onProfessorSelect(professor)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};