import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { Filters, Professor } from '@/types/professor';

interface ProfessorFiltersProps {
  professors: Professor[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
}

export const ProfessorFilters: React.FC<ProfessorFiltersProps> = ({
  professors,
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const subjects = Array.from(new Set(
    professors.flatMap(p => p.calificaciones.map(c => c.materia))
  )).sort();

  const hasActiveFilters = filters.materia !== '' || filters.promedio_minimo > 0 || filters.dificultad_maxima < 5;

  const handleSubjectChange = (value: string) => {
    // Convertir "all" de vuelta a string vacío para mantener compatibilidad
    const subjectValue = value === 'all' ? '' : value;
    onFiltersChange({ ...filters, materia: subjectValue });
  };

  // Convertir string vacío a "all" para el Select
  const selectValue = filters.materia === '' ? 'all' : filters.materia;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Filtros</h3>
        </div>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="subject">Materia</Label>
          <Select 
            value={selectValue} 
            onValueChange={handleSubjectChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las materias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las materias</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Promedio mínimo: {filters.promedio_minimo.toFixed(1)}</Label>
          <Slider
            value={[filters.promedio_minimo]}
            onValueChange={([value]) => onFiltersChange({ ...filters, promedio_minimo: value })}
            max={10}
            min={0}
            step={0.1}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Dificultad máxima: {filters.dificultad_maxima.toFixed(1)}</Label>
          <Slider
            value={[filters.dificultad_maxima]}
            onValueChange={([value]) => onFiltersChange({ ...filters, dificultad_maxima: value })}
            max={5}
            min={0}
            step={0.1}
            className="mt-2"
          />
        </div>
      </div>
    </Card>
  );
};