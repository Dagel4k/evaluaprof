import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Zap, Shield, Heart, TrendingUp } from 'lucide-react';
import { Filters, Professor } from '@/types/professor';

interface ProfessorFiltersProps {
  professors: Professor[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
  groupedSubjects?: { [key: string]: string[] };
  uniqueSubjects?: string[];
}

export const ProfessorFilters: React.FC<ProfessorFiltersProps> = ({
  professors,
  filters,
  onFiltersChange,
  onClearFilters,
  groupedSubjects = {},
  uniqueSubjects = []
}) => {
  // Usar materias agrupadas si están disponibles, sino usar el método anterior
  const subjects = uniqueSubjects.length > 0 ? uniqueSubjects : Array.from(new Set(
    professors.flatMap(p => p.calificaciones.map(c => c.materia))
      .filter(materia => materia && materia.trim() !== '') // Filtrar materias vacías
  )).sort();

  const hasActiveFilters = filters.materia !== '' || 
                           filters.promedio_minimo > 0 || 
                           filters.dificultad_maxima < 5 ||
                           (filters.confiabilidad_minima && filters.confiabilidad_minima > 0) ||
                           filters.sentimiento !== '' ||
                           filters.tendencia !== '' ||
                           filters.solo_con_analisis_avanzado ||
                           (filters.min_reviews && filters.min_reviews > 0);

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
              {subjects
                .filter(subject => subject && subject.trim() !== '' && subject !== 'undefined')
                .map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                  {groupedSubjects[subject] && groupedSubjects[subject].length > 1 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({groupedSubjects[subject].length} variaciones)
                    </span>
                  )}
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

        <Separator />

        {/* Filtros Avanzados */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-purple-600" />
            <Label className="font-semibold">Filtros Avanzados</Label>
          </div>

          <div className="space-y-4">
            {/* Solo profesores con análisis avanzado */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <Label htmlFor="advanced-only" className="text-sm">Solo con análisis avanzado</Label>
              </div>
              <Switch
                id="advanced-only"
                checked={filters.solo_con_analisis_avanzado || false}
                onCheckedChange={(checked) => 
                  onFiltersChange({ ...filters, solo_con_analisis_avanzado: checked })
                }
              />
            </div>

            {/* Confiabilidad mínima */}
            <div>
              <Label className="text-sm">
                Confiabilidad mínima: {filters.confiabilidad_minima ? (filters.confiabilidad_minima * 100).toFixed(0) + '%' : 'Sin filtro'}
              </Label>
              <Slider
                value={[filters.confiabilidad_minima || 0]}
                onValueChange={([value]) => onFiltersChange({ ...filters, confiabilidad_minima: value })}
                max={1}
                min={0}
                step={0.1}
                className="mt-2"
              />
            </div>

            {/* Sentimiento */}
            <div>
              <Label className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-600" />
                Sentimiento
              </Label>
              <Select 
                value={filters.sentimiento || 'all'} 
                onValueChange={(value) => onFiltersChange({ ...filters, sentimiento: value === 'all' ? '' : value as any })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Cualquier sentimiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier sentimiento</SelectItem>
                  <SelectItem value="positivo">Positivo</SelectItem>
                  <SelectItem value="neutro">Neutro</SelectItem>
                  <SelectItem value="negativo">Negativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tendencia */}
            <div>
              <Label className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Tendencia
              </Label>
              <Select 
                value={filters.tendencia || 'all'} 
                onValueChange={(value) => onFiltersChange({ ...filters, tendencia: value === 'all' ? '' : value as any })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Cualquier tendencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier tendencia</SelectItem>
                  <SelectItem value="mejorando">Mejorando</SelectItem>
                  <SelectItem value="estable">Estable</SelectItem>
                  <SelectItem value="declinando">Declinando</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mínimo de reseñas */}
            <div>
              <Label className="text-sm">
                Mínimo de reseñas: {filters.min_reviews || 0}
              </Label>
              <Slider
                value={[filters.min_reviews || 0]}
                onValueChange={([value]) => onFiltersChange({ ...filters, min_reviews: value })}
                max={50}
                min={0}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};