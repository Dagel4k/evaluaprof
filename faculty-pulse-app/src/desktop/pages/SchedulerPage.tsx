import React, { useEffect, useState, useMemo } from 'react';
import { adaptRawScheduleToCanonical } from '../../adapters/scheduleAdapter';
import { adaptOfferingJsonToCanonical } from '../../adapters/offeringAdapter';
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
import { RefreshCcw, Plus, MousePointer2, GitCompare, Zap, ChevronLeft, ChevronRight, Loader2, Settings2, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, Trash2, FileText } from 'lucide-react';
import { generateEasySchedulesPDF } from '../lib/pdfGenerator';
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
import { TooltipProvider } from '@/shared/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

const SchedulerPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [excludedGroupIds, setExcludedGroupIds] = useState<Set<string>>(new Set());
  const [professorMap, setProfessorMap] = useState<Map<string, ProfessorMetrics>>(new Map());
  const [loadingDB, setLoadingDB] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Modals
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generatedSchedules, setGeneratedSchedules] = useState<CourseGroup[][]>([]);
  const [scheduleStatistics, setScheduleStatistics] = useState<ScheduleStatistics[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [preferences, setPreferences] = useState<GenerationPreferences>({
    focus: 'BALANCED',
    maxGapTolerance: 2,
    includeAvance: false,
    allowUnassignedProfessors: false,
    timeFilterMode: 'EXACT',
    applyGapFilterToFriday: false
  });

  // Comparison State
  const [comparison, setComparison] = useState<{ idA: string, idB: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['disponibles', 'avance']));

  const { toast } = useToast();

  useEffect(() => {
    const initDB = async () => {
      try {
        await professorRepo.load();

        // Auto-preload campus schedule from message.json
        const response = await fetch('/message.json');
        if (response.ok) {
          const raw = await response.json();
          const data = adaptOfferingJsonToCanonical(raw);

          handleScheduleLoaded(data);

          // Enrich all groups from the institutional offering
          const allGroups = data.subjects.flatMap(s => s.groups);
          enrichGroups(allGroups);

          // Only show toast once per session
          const hasShownToast = sessionStorage.getItem('evaluaprof_offering_loaded');
          if (!hasShownToast) {
            toast({
              title: "Carga Académica",
              description: "Se ha pre-cargado la oferta institucional automáticamente.",
            });
            sessionStorage.setItem('evaluaprof_offering_loaded', 'true');
          }
        }
      } catch (e) {
        console.error('Preload failed:', e);
      } finally {
        setLoadingDB(false);
      }
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

    if (data.selectedGroups && data.selectedGroups.length > 0) {
      const ids = new Set(data.selectedGroups.map(g => g.id));
      setSelectedGroupIds(ids);
      enrichGroups(data.selectedGroups);
    } else {
      const initialSelection = new Set<string>();
      const allGroups: CourseGroup[] = [];
      data.subjects.forEach(s => {
        if (s.groups.length > 0 && (!s.classification || s.classification === 'DISPONIBLE')) {
          initialSelection.add(s.groups[0].id);
        }
        allGroups.push(...s.groups);
      });
      setSelectedGroupIds(initialSelection);
      enrichGroups(allGroups);
    }

    setHasStarted(true);
    setGeneratedSchedules([]);
  };

  const handleLoadOffering = () => {
    const loadedSubjects = offeringData.subjects as Subject[];
    setSubjects(loadedSubjects);

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
    if (!user) {
      toast({
        title: "Inicia Sesión",
        description: "Crea una cuenta gratuita para usar esta función.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (!hasPermission(profile?.role, 'auto-generator')) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedSchedules([]);

    const metrics: Record<string, GroupMetrics> = {};
    professorMap.forEach((p, groupId) => {
      metrics[groupId] = {
        quality: p.globalScore,
        difficulty: p.difficulty,
        trust: p.trust
      };
    });

    try {
      // Filter out excluded groups
      const filteredSubjects = subjects.map(s => ({
        ...s,
        groups: s.groups.filter(g => !excludedGroupIds.has(g.id))
      }));

      const engine = new SchedulerEngine();
      let result = await engine.generateSchedules(filteredSubjects, metrics, preferences);

      if (result.schedules.length === 0 && preferences.timeFilterMode === 'EXACT') {
        toast({
          title: "Sin coincidencias exactas",
          description: "Intentando búsqueda flexible para encontrarte opciones...",
        });

        const fallbackPrefs: GenerationPreferences = { ...preferences, timeFilterMode: 'MINIMUM' };
        setPreferences(fallbackPrefs);
        result = await engine.generateSchedules(filteredSubjects, metrics, fallbackPrefs);
      }

      if (result.schedules.length > 0) {
        setGeneratedSchedules(result.schedules);
        setScheduleStatistics(result.statistics);
        setCurrentScheduleIndex(0);
        applyGeneratedSchedule(result.schedules[0]);
        toast({
          title: "¡Horarios Generados!",
          description: `Se encontraron ${result.schedules.length} opciones optimizadas.`,
        });
      } else {
        const activeFilters: string[] = [];
        const suggestions: string[] = [];

        if (result.diagnostics && result.diagnostics.rejectedByTime > 0) {
          activeFilters.push(`${result.diagnostics.rejectedByTime} combinaciones rechazadas por filtros de hora`);
          suggestions.push('Cambia Modo de Horario a "Más Cercano"');
        }

        if (preferences.maxGapTolerance === 0) {
          const fridayContext = preferences.applyGapFilterToFriday ? " (incl. viernes)" : " (viernes excluido)";
          activeFilters.push(`Sin huecos${fridayContext}`);
          suggestions.push('Aumenta la tolerancia a gaps');
        }

        if (!preferences.includeAvance) {
          activeFilters.push('Materias de Avance excluidas');
          suggestions.push('Activa "Incluir Materias de Avance"');
        }

        toast({
          title: "Sin resultados de búsqueda",
          description: (
            <div className="mt-2 space-y-3 text-white/90">
              {activeFilters.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Estado del motor</p>
                  <ul className="space-y-1">
                    {activeFilters.map((f, i) => (
                      <li key={i} className="text-xs flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-white/50 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-white/20 p-1 rounded">
                    <Lightbulb className="h-3 w-3 text-white" />
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Sugerencias del sistema</p>
                </div>
                <ul className="space-y-2">
                  {suggestions.length > 0 ? (
                    suggestions.map((s, i) => (
                      <li key={i} className="text-xs font-medium flex items-start gap-2 bg-white/10 p-2 rounded-sm border border-white/5">
                        <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-amber-300" />
                        <span>{s}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs italic opacity-80">Intenta quitar algunas materias o relajar los filtros de tiempo.</li>
                  )}
                </ul>
              </div>
            </div>
          ),
          variant: "destructive",
          duration: 15000
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

  const clearResults = () => {
    setGeneratedSchedules([]);
    setScheduleStatistics([]);
    setCurrentScheduleIndex(0);
    setExcludedGroupIds(new Set());
    toast({
      title: "Resultados Limpiados",
      description: "Se han borrado los horarios generados. Tu lista de materias sigue intacta.",
    });
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

  const removeSubject = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    // Remove from subjects list
    setSubjects(prev => prev.filter(s => s.id !== subjectId));

    // Remove any selected groups for this subject
    const newSelected = new Set(selectedGroupIds);
    subject.groups.forEach(g => newSelected.delete(g.id));
    setSelectedGroupIds(newSelected);

    // Remove any excluded groups for this subject
    const newExcluded = new Set(excludedGroupIds);
    subject.groups.forEach(g => newExcluded.delete(g.id));
    setExcludedGroupIds(newExcluded);

    toast({
      title: "Materia Removida",
      description: "La materia ha sido eliminada de tu lista.",
    });
  };

  const removeGroup = (subjectId: string, groupId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    // Add to excluded groups
    const newExcluded = new Set(excludedGroupIds);
    newExcluded.add(groupId);
    setExcludedGroupIds(newExcluded);

    // If this group was selected, deselect it
    if (selectedGroupIds.has(groupId)) {
      const newSelected = new Set(selectedGroupIds);
      newSelected.delete(groupId);
      setSelectedGroupIds(newSelected);
    }

    // Get professor name for toast
    const group = subject.groups.find(g => g.id === groupId);
    const metrics = professorMap.get(groupId);
    const professorName = metrics?.name || group?.professorNames[0] || 'Profesor';

    // Check if this is the last available group
    const availableGroups = subject.groups.filter(g => !newExcluded.has(g.id));

    toast({
      title: "Profesor Removido",
      description: availableGroups.length === 0
        ? `${professorName} removido. ⚠️ No quedan opciones para ${subject.name}.`
        : `${professorName} removido de ${subject.name}.`,
      variant: availableGroups.length === 0 ? "destructive" : "default"
    });
  };

  const removeAllSubjects = () => {
    if (subjects.length === 0) return;
    setSubjects([]);
    setSelectedGroupIds(new Set());
    setExcludedGroupIds(new Set());
    setGeneratedSchedules([]);
    setComparison(null);
    toast({
      title: "Lista Limpiada",
      description: "Se han eliminado todas las materias.",
    });
  };

  const handleDownloadPDFReport = async () => {
    if (!user) {
      toast({ title: "Requiere Cuenta", description: "Inicia sesión para descargar reportes.", variant: "destructive" });
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const metrics: Record<string, GroupMetrics> = {};
      professorMap.forEach((p, groupId) => {
        metrics[groupId] = {
          quality: p.globalScore,
          difficulty: p.difficulty,
          trust: p.trust
        };
      });

      const engine = new SchedulerEngine();
      // Generate with DIFFICULTY focus and relaxed time constraints to find objective best
      const customPrefs: GenerationPreferences = {
        ...preferences,
        focus: 'DIFFICULTY',
        maxGapTolerance: 5, // Allow max gaps to find best profs regardless of schedule tightness?
        // Actually, keep gap tolerance reasonable (e.g. 5 means basically ignore gaps)
        // But let's respect the user's current ignore/include preferences, just force DIFFICULTY mode.
        timeFilterMode: 'MINIMUM', // Relax rigid constraints
      };

      toast({ title: "Generando Reporte...", description: "Analizando miles de combinaciones para encontrar las más fáciles." });

      // Filter out excluded groups
      const filteredSubjects = subjects.map(s => ({
        ...s,
        groups: s.groups.filter(g => !excludedGroupIds.has(g.id))
      }));

      const result = await engine.generateSchedules(filteredSubjects, metrics, customPrefs);

      if (result.schedules.length > 0) {
        // Deduplicar horarios
        const uniqueSchedules: CourseGroup[][] = [];
        const seenSignatures = new Set<string>();

        result.schedules.forEach(schedule => {
          // Ordenamos IDs para crear firma única
          const signature = schedule.map(g => g.id).sort().join('|');
          if (!seenSignatures.has(signature)) {
            seenSignatures.add(signature);
            uniqueSchedules.push(schedule);
          }
        });

        generateEasySchedulesPDF({ schedules: uniqueSchedules, metrics });
        toast({ title: "PDF Listo", description: `Descargando ${uniqueSchedules.length} horarios únicos.` });
      } else {
        toast({ title: "Sin Resultados", description: "No se encontraron horarios válidos para el reporte.", variant: "destructive" });
      }
      engine.terminate();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo generar el PDF.", variant: "destructive" });
    } finally {
      setIsGeneratingPDF(false);
    }
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

  const scheduleTimeRange = useMemo(() => {
    if (selectedGroups.length === 0) return { earliest: null, latest: null };

    let earliestTime = Infinity;
    let latestTime = -Infinity;

    // Iterar sobre los grupos SELECCIONADOS por el usuario
    selectedGroups.forEach(group => {
      group.schedule.forEach(slot => {
        if (slot.startTime < earliestTime) earliestTime = slot.startTime;
        if (slot.endTime > latestTime) latestTime = slot.endTime;
      });
    });

    if (earliestTime === Infinity || latestTime === -Infinity) {
      return { earliest: null, latest: null };
    }

    // Convertir minutos a formato HH:MM
    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    return {
      earliest: formatTime(earliestTime),
      latest: formatTime(latestTime)
    };
  }, [selectedGroups]);

  if (loadingDB) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Cargando base de datos de profesores...</p>
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
    <TooltipProvider>
      <div className="space-y-6 container mx-auto py-6 relative">
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 sm:px-0">
          <div className="w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Constructor de Horario</h2>
            {generatedSchedules.length > 0 && (
              <div className="text-xs sm:text-sm text-green-600 font-medium flex items-center gap-2 mt-1">
                <Zap className="h-3 w-3" />
                Viendo {currentScheduleIndex + 1} de {generatedSchedules.length} opciones
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
                  <PopoverContent className="w-96">
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
                              <SelectItem value="SPLIT">Split (Mañana/Tarde)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {preferences.timeFilterMode === 'SPLIT' ? (
                          <>
                            <div className="space-y-3 pt-2">
                              <div className="space-y-1.5 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bloque 1 (Principal)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label htmlFor="startTime" className="text-[10px]">Inicio</Label>
                                    <Select
                                      value={preferences.preferredStartTime?.toString() || 'any'}
                                      onValueChange={(val) => setPreferences({
                                        ...preferences,
                                        preferredStartTime: val === 'any' ? undefined : parseInt(val)
                                      })}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Inicia" />
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
                                  <div className="space-y-1">
                                    <Label htmlFor="endTime" className="text-[10px]">Fin</Label>
                                    <Select
                                      value={preferences.preferredEndTime?.toString() || 'any'}
                                      onValueChange={(val) => setPreferences({
                                        ...preferences,
                                        preferredEndTime: val === 'any' ? undefined : parseInt(val)
                                      })}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Termina" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="any">Cualquier hora</SelectItem>
                                        <SelectItem value="720">12:00 PM</SelectItem>
                                        <SelectItem value="780">1:00 PM</SelectItem>
                                        <SelectItem value="840">2:00 PM</SelectItem>
                                        <SelectItem value="900">3:00 PM</SelectItem>
                                        <SelectItem value="960">4:00 PM</SelectItem>
                                        <SelectItem value="1020">5:00 PM</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1.5 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bloque 2 (Secundario)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label htmlFor="secStartTime" className="text-[10px]">Inicio</Label>
                                    <Select
                                      value={preferences.secondaryStartTime?.toString() || 'any'}
                                      onValueChange={(val) => setPreferences({
                                        ...preferences,
                                        secondaryStartTime: val === 'any' ? undefined : parseInt(val)
                                      })}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Inicia" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="any">Cualquier hora</SelectItem>
                                        <SelectItem value="720">12:00 PM</SelectItem>
                                        <SelectItem value="780">1:00 PM</SelectItem>
                                        <SelectItem value="840">2:00 PM</SelectItem>
                                        <SelectItem value="900">3:00 PM</SelectItem>
                                        <SelectItem value="960">4:00 PM</SelectItem>
                                        <SelectItem value="1020">5:00 PM</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor="secEndTime" className="text-[10px]">Fin</Label>
                                    <Select
                                      value={preferences.secondaryEndTime?.toString() || 'any'}
                                      onValueChange={(val) => setPreferences({
                                        ...preferences,
                                        secondaryEndTime: val === 'any' ? undefined : parseInt(val)
                                      })}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Termina" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="any">Cualquier hora</SelectItem>
                                        <SelectItem value="1020">5:00 PM</SelectItem>
                                        <SelectItem value="1080">6:00 PM</SelectItem>
                                        <SelectItem value="1140">7:00 PM</SelectItem>
                                        <SelectItem value="1200">8:00 PM</SelectItem>
                                        <SelectItem value="1260">9:00 PM</SelectItem>
                                        <SelectItem value="1320">10:00 PM</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}

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
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="includeAvance" className="text-sm">
                            <span>Materias de Avance</span>
                          </Label>
                          <Switch
                            id="includeAvance"
                            checked={preferences.includeAvance}
                            onCheckedChange={(c) => setPreferences({ ...preferences, includeAvance: c })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="allowUnassigned" className="text-sm">
                            <span>Profes No Asignados</span>
                          </Label>
                          <Switch
                            id="allowUnassigned"
                            checked={preferences.allowUnassignedProfessors}
                            onCheckedChange={(c) => setPreferences({ ...preferences, allowUnassignedProfessors: c })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-md bg-zinc-800/50 border border-zinc-700/50">
                          <div className="space-y-0.5">
                            <Label className="text-xs">Filtrar Huecos en Viernes</Label>
                            <p className="text-[10px] text-zinc-400">Aplica límites de gaps a las sesiones de viernes.</p>
                          </div>
                          <Switch
                            checked={preferences.applyGapFilterToFriday}
                            onCheckedChange={(val) => setPreferences({ ...preferences, applyGapFilterToFriday: val })}
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  onClick={generateSchedules}
                  disabled={isGenerating}
                  className="flex-1 sm:flex-none gap-2 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-200 h-10 shadow-sm transition-all active:scale-[0.98] font-bold uppercase tracking-tight"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-3.5 w-3.5 fill-current" />}
                  {isGenerating ? 'Calculando...' : 'Auto-Generar'}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDFReport}
                disabled={isGeneratingPDF || subjects.length === 0}
                className="gap-2 h-10 sm:h-9 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-900/20"
              >
                {isGeneratingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Reporte PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowManualForm(true)} className="gap-2 h-10 sm:h-9">
                <Plus className="h-4 w-4" /> Materia
              </Button>
              <Button variant="ghost" size="sm" onClick={removeAllSubjects} className="gap-2 h-10 sm:h-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                <Trash2 className="h-4 w-4" /> Limpiar
              </Button>
              <Button variant="ghost" size="sm" onClick={clearResults} className="gap-2 h-10 sm:h-9">
                <RefreshCcw className="h-4 w-4" /> Reset
              </Button>

              {/* Campus Schedule Range */}
              {scheduleTimeRange.earliest && scheduleTimeRange.latest && (
                <div className="col-span-2 sm:col-span-1 flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-900 rounded-md">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium text-muted-foreground">Primera:</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{scheduleTimeRange.earliest}</span>
                  </div>
                  <div className="w-px h-4 bg-border"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-xs font-medium text-muted-foreground">Última:</span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{scheduleTimeRange.latest}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Responsive Layout: Tabs on mobile, Grid on desktop */}
      <div className="lg:hidden px-4">
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="list" className="text-xs">Materias ({subjects.length})</TabsTrigger>
            <TabsTrigger value="grid" className="text-xs text-primary font-bold">Mi Calendario</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-0 space-y-6">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 border rounded-lg bg-card">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Score Promedio</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.score}</p>
              </div>
              <div className="p-3 border rounded-lg bg-card">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Dificultad</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.difficulty}</p>
              </div>
            </div>
            <div className="space-y-4">
              <SubjectListContent
                subjects={subjects}
                expandedSections={expandedSections}
                setExpandedSections={setExpandedSections}
                selectedGroupIds={selectedGroupIds}
                excludedGroupIds={excludedGroupIds}
                professorMap={professorMap}
                toggleGroupSelection={toggleGroupSelection}
                startComparison={startComparison}
                onRemoveSubject={removeSubject}
                onRemoveGroup={removeGroup}
                conflicts={conflicts}
              />
            </div>
          </TabsContent>

          <TabsContent value="grid" className="mt-0 space-y-4 overflow-hidden">
            {conflicts.size > 0 && (
              <div className="p-2.5 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 animate-pulse mb-2">
                <AlertTriangle className="h-4 w-4" />
                HAY {conflicts.size} CONFLICTOS EN TU HORARIO
              </div>
            )}
            {generatedSchedules.length > 0 && scheduleStatistics[currentScheduleIndex] && (
              <ScheduleStatsPanel
                stats={scheduleStatistics[currentScheduleIndex]}
                index={currentScheduleIndex}
                total={generatedSchedules.length}
              />
            )}
            <div className="relative border rounded-xl overflow-hidden shadow-xl bg-background p-1">
              <TimeGrid
                groups={selectedGroups}
                professorMap={professorMap}
                conflictingGroupIds={Array.from(conflicts.keys())}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden lg:grid lg:grid-cols-4 gap-6 h-full">
        <div className="lg:col-span-1 space-y-4 lg:h-[calc(100vh-180px)] lg:overflow-y-auto pr-1">
          <SubjectListContent
            subjects={subjects}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            selectedGroupIds={selectedGroupIds}
            excludedGroupIds={excludedGroupIds}
            professorMap={professorMap}
            toggleGroupSelection={toggleGroupSelection}
            startComparison={startComparison}
            onRemoveSubject={removeSubject}
            onRemoveGroup={removeGroup}
            conflicts={conflicts}
          />

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
              <div className="col-span-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded text-[10px] text-red-700 dark:text-red-400 font-bold animate-pulse text-center flex items-center justify-center gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                {conflicts.size} CONFLICTOS DETECTADOS
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 min-h-[500px] flex flex-col gap-4">
          {generatedSchedules.length > 0 && scheduleStatistics[currentScheduleIndex] && (
            <ScheduleStatsPanel
              stats={scheduleStatistics[currentScheduleIndex]}
              index={currentScheduleIndex}
              total={generatedSchedules.length}
            />
          )}

          <TimeGrid
            groups={selectedGroups}
            professorMap={professorMap}
            conflictingGroupIds={Array.from(conflicts.keys())}
          />
        </div>
      </div>
    </TooltipProvider >
  );
};

const SubjectListContent: React.FC<{
  subjects: Subject[];
  expandedSections: Set<string>;
  setExpandedSections: (s: Set<string>) => void;
  selectedGroupIds: Set<string>;
  excludedGroupIds: Set<string>;
  professorMap: Map<string, ProfessorMetrics>;
  toggleGroupSelection: (sid: string, gid: string) => void;
  startComparison: (ga: string, gb: string) => void;
  onRemoveSubject: (id: string) => void;
  onRemoveGroup: (sid: string, gid: string) => void;
  conflicts: Map<string, any>;
}> = ({ subjects, expandedSections, setExpandedSections, selectedGroupIds, excludedGroupIds, professorMap, toggleGroupSelection, startComparison, onRemoveSubject, onRemoveGroup, conflicts }) => {
  return (
    <div className="space-y-3">
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
                <MousePointer2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="font-bold text-sm">Materias Disponibles</h3>
                <span className="text-xs text-muted-foreground">({disponibles.length})</span>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isExpanded && (
              <div className="p-3 pt-0 space-y-2">
                {disponibles.map(subject => {
                  const selectedGroup = subject.groups.find(g => selectedGroupIds.has(g.id));
                  // Filter out excluded groups
                  const filteredSubject = {
                    ...subject,
                    groups: subject.groups.filter(g => !excludedGroupIds.has(g.id))
                  };
                  return (
                    <SubjectCard
                      key={subject.id}
                      subject={filteredSubject}
                      selectedGroupId={selectedGroup?.id}
                      professorMap={professorMap}
                      onGroupSelect={(groupId) => toggleGroupSelection(subject.id, groupId)}
                      onCompare={startComparison}
                      onRemove={onRemoveSubject}
                      onRemoveGroup={onRemoveGroup}
                      conflictingGroupIds={Array.from(conflicts.keys())}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

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
                <MousePointer2 className="h-4 w-4 text-zinc-500" />
                <h3 className="font-bold text-sm">Materias de Avance</h3>
                <span className="text-xs text-muted-foreground">({avance.length})</span>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isExpanded && (
              <div className="p-3 pt-0 space-y-2">
                {avance.map(subject => {
                  const selectedGroup = subject.groups.find(g => selectedGroupIds.has(g.id));
                  // Filter out excluded groups
                  const filteredSubject = {
                    ...subject,
                    groups: subject.groups.filter(g => !excludedGroupIds.has(g.id))
                  };
                  return (
                    <SubjectCard
                      key={subject.id}
                      subject={filteredSubject}
                      selectedGroupId={selectedGroup?.id}
                      professorMap={professorMap}
                      onGroupSelect={(groupId) => toggleGroupSelection(subject.id, groupId)}
                      onCompare={startComparison}
                      onRemove={onRemoveSubject}
                      onRemoveGroup={onRemoveGroup}
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
  );
};

export default SchedulerPage;
