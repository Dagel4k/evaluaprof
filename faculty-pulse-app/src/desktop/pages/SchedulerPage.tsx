import React, { useEffect, useState, useMemo } from 'react';
import { adaptRawScheduleToCanonical } from '../../adapters/scheduleAdapter';
import rawScheduleText from '../../mocks/raw-schedule.json?raw';
import offeringData from '../../mocks/offering'; // Mock Offering with multiple groups
import { ScheduleData, ProfessorMetrics, Subject, CourseGroup } from '../../types/canonical';
import { GenerationPreferences, GroupMetrics, ScheduleStatistics } from '../../workers/scheduler.worker';
import TimeGrid from '../components/TimeGrid';
import { professorRepo } from '../services/professorRepository';
import { ScheduleUploader } from '../components/ScheduleUploader';
import { ManualCourseForm } from '../components/ManualCourseForm';
import { ProfessorComparison } from '../components/ProfessorComparison';
import { Button } from '@/shared/ui/button';
import { RefreshCcw, Plus, MousePointer2, GitCompare, Zap, ChevronLeft, ChevronRight, Loader2, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { SubjectCard } from '../components/SubjectCard';
import { ScheduleStatsPanel } from '../components/ScheduleStatsPanel';
import { findAllConflicts } from '../../lib/conflictDetector';
import { SchedulerEngine } from '../../lib/schedulerEngine';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '../../context/AuthContext';
import { UpgradeModal } from '../../components/UpgradeModal';
import { hasPermission } from '../../lib/permissions';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

const SchedulerPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [professorMap, setProfessorMap] = useState<Map<string, ProfessorMetrics>>(new Map());
  const [loadingDB, setLoadingDB] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Modals
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchedules, setGeneratedSchedules] = useState<CourseGroup[][]>([]);
  const [scheduleStatistics, setScheduleStatistics] = useState<ScheduleStatistics[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [preferences, setPreferences] = useState<GenerationPreferences>({
    focus: 'BALANCED',
    maxGapTolerance: 2, // Default: 2 hours tolerance
    includeAvance: false, // By default, do NOT include Avance subjects
    allowUnassignedProfessors: false, // By default, do NOT include unassigned professors
    timeFilterMode: 'EXACT' // By default, exact time matching
  });

  // Comparison State
  const [comparison, setComparison] = useState<{ idA: string, idB: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['disponibles', 'avance']));

  const { toast } = useToast();

  useEffect(() => {
    const initDB = async () => {
      await professorRepo.load();
      setLoadingDB(false);
    };
    initDB();
  }, []);

  const enrichGroups = (groups: CourseGroup[]) => {
    const newProfMap = new Map(professorMap);
    groups.forEach(group => {
      if (!group.professorIds.length) {
        const rawName = group.professorNames[0];
        const match = professorRepo.searchByName(rawName);
        if (match) {
          const metrics = professorRepo.toCanonical(match);
          newProfMap.set(group.id, metrics);
          group.professorIds = [metrics.id];
        }
      } else {
        const match = professorRepo.searchByName(group.professorNames[0]);
        if (match) {
          newProfMap.set(group.id, professorRepo.toCanonical(match));
        }
      }
    });
    setProfessorMap(newProfMap);
  };

  const handleScheduleLoaded = (data: ScheduleData) => {
    setSubjects(data.subjects);

    // If there are selected groups (from loaded schedule), use them
    // Otherwise, auto-select first group of each DISPONIBLE subject only
    // AVANCE subjects are optional and should not be auto-selected
    if (data.selectedGroups && data.selectedGroups.length > 0) {
      const ids = new Set(data.selectedGroups.map(g => g.id));
      setSelectedGroupIds(ids);
      enrichGroups(data.selectedGroups);
    } else {
      // Auto-select first group of each DISPONIBLE subject only
      const initialSelection = new Set<string>();
      const allGroups: CourseGroup[] = [];
      data.subjects.forEach(s => {
        // Only auto-select DISPONIBLE subjects (required courses)
        // AVANCE subjects are optional
        if (s.groups.length > 0 && (!s.classification || s.classification === 'DISPONIBLE')) {
          initialSelection.add(s.groups[0].id);
        }
        allGroups.push(...s.groups);
      });
      setSelectedGroupIds(initialSelection);
      enrichGroups(allGroups);
    }

    setHasStarted(true);
    setGeneratedSchedules([]); // Clear generator
  };

  const handleLoadOffering = () => {
    // Load the rich offering (multiple groups)
    // offeringData matches ScheduleData structure roughly but we need to ensure types
    const loadedSubjects = offeringData.subjects as Subject[];
    setSubjects(loadedSubjects);

    // Auto-select first group of each to have a starting state
    const initialSelection = new Set<string>();
    const allGroups: CourseGroup[] = [];
    loadedSubjects.forEach(s => {
      if (s.groups.length > 0) {
        initialSelection.add(s.groups[0].id);
        allGroups.push(...s.groups);
      }
    });

    setSelectedGroupIds(initialSelection);
    enrichGroups(allGroups);
    setHasStarted(true);
    setGeneratedSchedules([]);

    toast({
      title: "Oferta Demo Cargada",
      description: `Se cargaron ${loadedSubjects.length} materias con múltiples opciones.`,
    });
  };

  const generateSchedules = async () => {
    // 1. Check Login
    if (!user) {
      toast({
        title: "Inicia Sesión",
        description: "Crea una cuenta gratuita para usar esta función.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    // 2. Check Permission
    if (!hasPermission(profile?.role, 'auto-generator')) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedSchedules([]);

    // Build metrics map for the worker
    const metrics: Record<string, GroupMetrics> = {};
    professorMap.forEach((p, groupId) => {
      metrics[groupId] = {
        quality: p.globalScore,
        difficulty: p.difficulty,
        trust: p.trust
      };
    });

    try {
      const engine = new SchedulerEngine();
      const result = await engine.generateSchedules(subjects, metrics, preferences);

      if (result.schedules.length > 0) {
        setGeneratedSchedules(result.schedules);
        setScheduleStatistics(result.statistics);
        setCurrentScheduleIndex(0);
        applyGeneratedSchedule(result.schedules[0]);
        toast({
          title: "¡Horarios Generados!",
          description: `Se encontraron ${result.schedules.length} opciones.`,
        });
      } else {
        // Generate detailed diagnostic message
        const activeFilters: string[] = [];
        const suggestions: string[] = [];

        if (preferences.maxGapTolerance === 0) {
          activeFilters.push('Sin gaps (tolerancia: 0h)');
          suggestions.push('Aumenta la tolerancia a gaps');
        }

        if (!preferences.includeAvance) {
          activeFilters.push('Materias de Avance excluidas');
          suggestions.push('Activa "Incluir Materias de Avance"');
        }

        if (!preferences.allowUnassignedProfessors) {
          activeFilters.push('Profesores no asignados excluidos');
          suggestions.push('Activa "Permitir Profes No Asignados"');
        }

        if (preferences.preferredStartTime !== undefined && preferences.timeFilterMode === 'EXACT') {
          const hour = Math.floor(preferences.preferredStartTime / 60);
          activeFilters.push(`Inicio exacto a las ${hour}:00`);
          suggestions.push('Cambia modo de horario a "Mínimo"');
        }

        const filterText = activeFilters.length > 0
          ? `\n\nFiltros activos:\n• ${activeFilters.join('\n• ')}`
          : '';

        const suggestionText = suggestions.length > 0
          ? `\n\nSugerencias:\n💡 ${suggestions.join('\n💡 ')}`
          : '\n\nIntenta quitar algunas materias o relajar los filtros.';

        toast({
          title: "Sin resultados",
          description: `No se encontraron combinaciones válidas con los filtros actuales.${filterText}${suggestionText}`,
          variant: "destructive",
          duration: 8000
        });
      }
      engine.terminate();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Falló el generador", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGeneratedSchedule = (schedule: CourseGroup[]) => {
    const newIds = new Set(schedule.map(g => g.id));
    setSelectedGroupIds(newIds);
  };

  const cycleSchedule = (direction: 'next' | 'prev') => {
    if (generatedSchedules.length === 0) return;
    let newIndex = direction === 'next' ? currentScheduleIndex + 1 : currentScheduleIndex - 1;
    if (newIndex >= generatedSchedules.length) newIndex = 0;
    if (newIndex < 0) newIndex = generatedSchedules.length - 1;

    setCurrentScheduleIndex(newIndex);
    applyGeneratedSchedule(generatedSchedules[newIndex]);
  };

  const addManualSubject = (name: string, groups: CourseGroup[]) => {
    const newSubject: Subject = {
      id: uuidv4(),
      code: 'MANUAL',
      name,
      groups: groups.map(g => ({ ...g, subjectName: name }))
    };
    setSubjects([...subjects, newSubject]);
    if (groups.length > 0) {
      const newIds = new Set(selectedGroupIds);
      newIds.add(groups[0].id);
      setSelectedGroupIds(newIds);
    }
    enrichGroups(groups);
    setShowManualForm(false);
    setHasStarted(true);
  };

  const toggleGroupSelection = (subjectId: string, groupId: string) => {
    const newIds = new Set(selectedGroupIds);
    const subject = subjects.find(s => s.id === subjectId);
    subject?.groups.forEach(g => newIds.delete(g.id));
    newIds.add(groupId);
    setSelectedGroupIds(newIds);
    setComparison(null);
  };

  const startComparison = (groupAId: string, groupBId: string) => {
    setComparison({ idA: groupAId, idB: groupBId });
  };

  const selectedGroups = useMemo(() => {
    return subjects.flatMap(s => s.groups.filter(g => selectedGroupIds.has(g.id)));
  }, [subjects, selectedGroupIds]);

  const conflicts = useMemo(() => {
    return findAllConflicts(selectedGroups);
  }, [selectedGroups]);

  const stats = useMemo(() => {
    if (selectedGroups.length === 0) return { score: 0, count: 0, difficulty: 0 };
    let totalScore = 0;
    let scoreCount = 0;
    let totalDiff = 0;
    let diffCount = 0;

    selectedGroups.forEach((g) => {
      const p = professorMap.get(g.id);
      if (p) {
        if (p.globalScore > 0) {
          totalScore += p.globalScore;
          scoreCount++;
        }
        if (p.difficulty > 0) {
          totalDiff += p.difficulty;
          diffCount++;
        }
      }
    });

    return {
      score: scoreCount ? (totalScore / scoreCount).toFixed(1) : 'N/A',
      difficulty: diffCount ? (totalDiff / diffCount).toFixed(1) : 'N/A',
      count: selectedGroups.length
    };
  }, [selectedGroups, professorMap]);

  if (loadingDB) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <div className="animate-spin text-4xl">⏳</div>
          <p className="text-muted-foreground">Cargando base de datos de profesores...</p>
        </div>
      </div>
    );
  }

  if (!hasStarted && !showManualForm) {
    return (
      <div className="container mx-auto py-10 max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Constructor de Horarios</h1>
          <p className="text-muted-foreground">Analiza tu semestre con la inteligencia de EvaluaProf.</p>
        </div>

        <ScheduleUploader onScheduleLoaded={handleScheduleLoaded} />

        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 px-4">
          <Button variant="outline" onClick={() => setShowManualForm(true)} className="gap-2 h-12 sm:h-10">
            <Plus className="h-4 w-4" /> Crear Manualmente
          </Button>
          <Button variant="ghost" onClick={() => {
            const raw = JSON.parse(rawScheduleText);
            const data = adaptRawScheduleToCanonical(raw);
            handleScheduleLoaded(data);
          }} className="text-muted-foreground h-12 sm:h-10">
            Ver Demo Simple
          </Button>
          <Button variant="ghost" onClick={handleLoadOffering} className="text-primary hover:text-primary/80 hover:bg-primary/10 h-12 sm:h-10">
            <Zap className="h-4 w-4 mr-2" />
            Cargar Oferta Completa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 container mx-auto py-6 relative">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* Comparison Modal Overlay */}
      {comparison && professorMap.get(comparison.idA) && professorMap.get(comparison.idB) && (
        <ProfessorComparison
          profA={professorMap.get(comparison.idA)!}
          profB={professorMap.get(comparison.idB)!}
          onClose={() => setComparison(null)}
        />
      )}

      {showManualForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ManualCourseForm onSave={addManualSubject} onCancel={() => setShowManualForm(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mi Constructor de Horario</h2>
          {generatedSchedules.length > 0 && (
            <div className="text-sm text-green-600 font-medium flex items-center gap-2 mt-1">
              <Zap className="h-3 w-3" />
              Viendo opción {currentScheduleIndex + 1} de {generatedSchedules.length}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center w-full sm:w-auto">
          {generatedSchedules.length > 0 ? (
            <div className="flex items-center justify-between gap-1 bg-muted rounded-md p-1 mr-0 sm:mr-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => cycleSchedule('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-mono px-2">
                {currentScheduleIndex + 1} / {generatedSchedules.length}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => cycleSchedule('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" title="Preferencias de Generación" className="shrink-0">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  {/* ... settings content ... */}
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Preferencias</h4>
                      <p className="text-sm text-muted-foreground">
                        Personaliza cómo se generan tus horarios.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="focus">Prioridad</Label>
                        <Select
                          value={preferences.focus}
                          onValueChange={(val: any) => setPreferences({ ...preferences, focus: val })}
                        >
                          <SelectTrigger className="col-span-2 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="QUALITY">Calidad (Calif.)</SelectItem>
                            <SelectItem value="DIFFICULTY">Facilidad (Dif.)</SelectItem>
                            <SelectItem value="BALANCED">Equilibrado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="timeMode" className="text-sm">Modo Horario</Label>
                        <Select
                          value={preferences.timeFilterMode}
                          onValueChange={(val: any) => setPreferences({ ...preferences, timeFilterMode: val })}
                        >
                          <SelectTrigger className="col-span-2 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EXACT">Exacto</SelectItem>
                            <SelectItem value="MINIMUM">Mínimo</SelectItem>
                            <SelectItem value="CLOSEST">Más Cercano</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="startTime" className="text-sm">Inicio</Label>
                        <Select
                          value={preferences.preferredStartTime?.toString() || 'any'}
                          onValueChange={(val) => setPreferences({
                            ...preferences,
                            preferredStartTime: val === 'any' ? undefined : parseInt(val)
                          })}
                        >
                          <SelectTrigger className="col-span-2 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Cualquier hora</SelectItem>
                            <SelectItem value="420">7:00 AM</SelectItem>
                            <SelectItem value="480">8:00 AM</SelectItem>
                            <SelectItem value="540">9:00 AM</SelectItem>
                            <SelectItem value="600">10:00 AM</SelectItem>
                            <SelectItem value="660">11:00 AM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="endTime" className="text-sm">Fin</Label>
                        <Select
                          value={preferences.preferredEndTime?.toString() || 'any'}
                          onValueChange={(val) => setPreferences({
                            ...preferences,
                            preferredEndTime: val === 'any' ? undefined : parseInt(val)
                          })}
                        >
                          <SelectTrigger className="col-span-2 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Cualquier hora</SelectItem>
                            <SelectItem value="900">3:00 PM</SelectItem>
                            <SelectItem value="960">4:00 PM</SelectItem>
                            <SelectItem value="1020">5:00 PM</SelectItem>
                            <SelectItem value="1080">6:00 PM</SelectItem>
                            <SelectItem value="1140">7:00 PM</SelectItem>
                            <SelectItem value="1200">8:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="gapTolerance" className="text-sm">
                            Tolerancia a Gaps
                          </Label>
                          <span className="text-xs text-muted-foreground font-medium">
                            {preferences.maxGapTolerance}h
                          </span>
                        </div>
                        <input
                          type="range"
                          id="gapTolerance"
                          min="0"
                          max="5"
                          step="0.5"
                          value={preferences.maxGapTolerance}
                          onChange={(e) => setPreferences({ ...preferences, maxGapTolerance: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Muy Compacto</span>
                          <span>Flexible</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="includeAvance" className="text-sm">
                          <span>Incluir Materias de Avance</span>
                          <span className="block text-xs text-muted-foreground font-normal">Materias opcionales</span>
                        </Label>
                        <Switch
                          id="includeAvance"
                          checked={preferences.includeAvance}
                          onCheckedChange={(c) => setPreferences({ ...preferences, includeAvance: c })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allowUnassigned" className="text-sm">
                          <span>Permitir Profes No Asignados</span>
                          <span className="block text-xs text-muted-foreground font-normal">Grupos sin profesor</span>
                        </Label>
                        <Switch
                          id="allowUnassigned"
                          checked={preferences.allowUnassignedProfessors}
                          onCheckedChange={(c) => setPreferences({ ...preferences, allowUnassignedProfessors: c })}
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                onClick={generateSchedules}
                disabled={isGenerating}
                className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 h-10"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {isGenerating ? 'Generando...' : 'Auto-Generar'}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button variant="outline" size="sm" onClick={() => setShowManualForm(true)} className="gap-2 h-10 sm:h-9">
              <Plus className="h-4 w-4" /> Materia
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setHasStarted(false)} className="gap-2 h-10 sm:h-9">
              <RefreshCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 h-full">

        {/* Sidebar: Subjects & Selection */}
        <div className="lg:col-span-1 space-y-4 lg:h-[calc(100vh-180px)] lg:overflow-y-auto pr-1">
          <div className="space-y-3">
            {/* Materias Disponibles */}
            {(() => {
              const disponibles = subjects.filter(s => !s.classification || s.classification === 'DISPONIBLE');
              const isExpanded = expandedSections.has('disponibles');

              if (disponibles.length === 0) return null;

              return (
                <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
                  <button
                    onClick={() => {
                      const newSet = new Set(expandedSections);
                      if (isExpanded) newSet.delete('disponibles');
                      else newSet.add('disponibles');
                      setExpandedSections(newSet);
                    }}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MousePointer2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-bold text-sm">Materias Disponibles</h3>
                      <span className="text-xs text-muted-foreground">({disponibles.length})</span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {isExpanded && (
                    <div className="p-3 pt-0 space-y-2 max-h-[400px] overflow-y-auto">
                      {disponibles.map(subject => {
                        const selectedGroup = subject.groups.find(g => selectedGroupIds.has(g.id));
                        return (
                          <SubjectCard
                            key={subject.id}
                            subject={subject}
                            selectedGroupId={selectedGroup?.id}
                            professorMap={professorMap}
                            onGroupSelect={(groupId) => toggleGroupSelection(subject.id, groupId)}
                            onCompare={startComparison}
                            conflictingGroupIds={Array.from(conflicts.keys())}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Materias de Avance */}
            {(() => {
              const avance = subjects.filter(s => s.classification === 'AVANCE');
              const isExpanded = expandedSections.has('avance');

              if (avance.length === 0) return null;

              return (
                <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
                  <button
                    onClick={() => {
                      const newSet = new Set(expandedSections);
                      if (isExpanded) newSet.delete('avance');
                      else newSet.add('avance');
                      setExpandedSections(newSet);
                    }}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MousePointer2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-bold text-sm">Materias de Avance</h3>
                      <span className="text-xs text-muted-foreground">({avance.length})</span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {isExpanded && (
                    <div className="p-3 pt-0 space-y-2 max-h-[400px] overflow-y-auto">
                      {avance.map(subject => {
                        const selectedGroup = subject.groups.find(g => selectedGroupIds.has(g.id));
                        return (
                          <SubjectCard
                            key={subject.id}
                            subject={subject}
                            selectedGroupId={selectedGroup?.id}
                            professorMap={professorMap}
                            onGroupSelect={(groupId) => toggleGroupSelection(subject.id, groupId)}
                            onCompare={startComparison}
                            conflictingGroupIds={Array.from(conflicts.keys())}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="p-4 border border-border rounded-lg bg-card text-card-foreground shadow-sm grid grid-cols-2 lg:grid-cols-1 gap-2">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">EvaluaProf Score</h3>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.score}</div>
                <span className="text-sm text-muted-foreground">/ 10</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Dificultad</h3>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.difficulty}</div>
            </div>
            {conflicts.size > 0 && (
              <div className="col-span-2 p-2 bg-red-50 border border-red-200 rounded text-[10px] text-red-700 font-bold animate-pulse text-center">
                ⚠️ {conflicts.size} CONFLICTOS
              </div>
            )}
          </div>

          <div className="p-4 border border-blue-200/20 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 shadow-sm hidden lg:block">
            <h3 className="font-semibold text-sm mb-2">💡 Recomendación AI</h3>
            <p className="text-xs leading-relaxed opacity-90">
              {Number(stats.score) > 8
                ? "¡Excelente selección! Tienes profesores altamente calificados."
                : "Considera buscar alternativas para mejorar tu promedio de calidad."}
            </p>
          </div>
        </div>

        {/* Schedule Statistics Panel */}
        {generatedSchedules.length > 0 && scheduleStatistics[currentScheduleIndex] && (
          <div className="px-4 mb-4">
            <ScheduleStatsPanel
              stats={scheduleStatistics[currentScheduleIndex]}
              index={currentScheduleIndex}
              total={generatedSchedules.length}
            />
          </div>
        )}

        {/* Main: Time Grid */}
        <div className="lg:col-span-3 min-h-[500px]">
          <TimeGrid
            groups={selectedGroups}
            professorMap={professorMap}
            conflictingGroupIds={Array.from(conflicts.keys())}
          />
        </div>
      </div>
    </div>
  );
};

export default SchedulerPage;
