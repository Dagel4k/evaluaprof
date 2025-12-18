import React from 'react';
import { Card } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Slider } from '@/shared/ui/slider';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Separator } from '@/shared/ui/separator';
import { Badge } from '@/shared/ui/badge';
import { Filter, X, Zap, Shield, Heart, TrendingUp, SlidersHorizontal } from 'lucide-react';
import { Filters, Professor } from '@/types/professor';
import { capitalizeName } from '@/shared/lib/formatters';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { ScrollArea } from "@/shared/ui/scroll-area";

interface ProfessorFiltersProps {
  professors: Professor[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
  uniqueSubjects?: string[];
}

const ProfessorFiltersComponent: React.FC<ProfessorFiltersProps> = ({
  professors,
  filters,
  onFiltersChange,
  onClearFilters,
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

  const FilterContent = (
    <div className="space-y-6">
      <div>
        <Label htmlFor="subject" className="font-semibold text-muted-foreground">Materia</Label>
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
                {capitalizeName(subject)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex justify-between">
          <Label id="min-grade-label" className="font-semibold text-muted-foreground">Promedio mínimo: {filters.promedio_minimo.toFixed(1)}</Label>
        </div>
        <Slider
          value={[filters.promedio_minimo]}
          onValueChange={([value]) => onFiltersChange({ ...filters, promedio_minimo: value })}
          max={10}
          min={0}
          step={0.1}
          className="mt-2"
          aria-labelledby="min-grade-label"
        />
      </div>

      <div>
        <Label id="max-difficulty-label" className="font-semibold text-muted-foreground">Dificultad máxima: {filters.dificultad_maxima.toFixed(1)}</Label>
        <Slider
          value={[filters.dificultad_maxima]}
          onValueChange={([value]) => onFiltersChange({ ...filters, dificultad_maxima: value })}
          max={5}
          min={0}
          step={0.1}
          className="mt-2"
          aria-labelledby="max-difficulty-label"
        />
      </div>

      <Separator />

      {/* Filtros Avanzados */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-primary" />
          <Label className="font-semibold">Filtros Avanzados</Label>
        </div>

        <div className="space-y-4">
          {/* Solo profesores con análisis avanzado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="advanced-only" className="text-sm font-semibold text-muted-foreground">Solo con análisis avanzado</Label>
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
            <Label id="min-trust-label" className="text-sm font-semibold text-muted-foreground">
              Confiabilidad mínima: {filters.confiabilidad_minima ? (filters.confiabilidad_minima * 100).toFixed(0) + '%' : 'Sin filtro'}
            </Label>
            <Slider
              value={[filters.confiabilidad_minima || 0]}
              onValueChange={([value]) => onFiltersChange({ ...filters, confiabilidad_minima: value })}
              max={1}
              min={0}
              step={0.1}
              className="mt-2"
              aria-labelledby="min-trust-label"
            />
          </div>

          {/* Sentimiento */}
          <div>
            <Label id="sentiment-label" className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              Sentimiento
            </Label>
            <Select 
              value={filters.sentimiento || 'all'} 
              onValueChange={(value) => onFiltersChange({ ...filters, sentimiento: value === 'all' ? '' : value as Filters['sentimiento'] })}
            >
              <SelectTrigger className="mt-2" aria-labelledby="sentiment-label">
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
            <Label id="trend-label" className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Tendencia
            </Label>
            <Select 
              value={filters.tendencia || 'all'} 
              onValueChange={(value) => onFiltersChange({ ...filters, tendencia: value === 'all' ? '' : value as Filters['tendencia'] })}
            >
              <SelectTrigger className="mt-2" aria-labelledby="trend-label">
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
            <Label id="min-reviews-label" className="text-sm font-semibold text-muted-foreground">
              Mínimo de reseñas: {filters.min_reviews || 0}
            </Label>
            <Slider
              value={[filters.min_reviews || 0]}
              onValueChange={([value]) => onFiltersChange({ ...filters, min_reviews: value })}
              max={50}
              min={0}
              step={1}
              className="mt-2"
              aria-labelledby="min-reviews-label"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <div className="hidden lg:block">
        <Card className="p-6 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50">
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
          {FilterContent}
        </Card>
      </div>

      {/* Mobile View (Drawer) */}
      <div className="lg:hidden mb-4">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" className="w-full gap-2 justify-between">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Activos
                </Badge>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filtros de búsqueda</DrawerTitle>
              <DrawerDescription>
                Ajusta los parámetros para encontrar al profesor ideal.
              </DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="h-[60vh] px-4">
              <div className="pb-6">
                {FilterContent}
              </div>
            </ScrollArea>
            <DrawerFooter className="pt-2">
              {hasActiveFilters && (
                <Button variant="destructive" onClick={onClearFilters}>
                  Limpiar filtros
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="outline">Cerrar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};

export const ProfessorFilters = React.memo(ProfessorFiltersComponent);

export default ProfessorFilters;