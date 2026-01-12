import React, { useEffect, useState, useMemo } from 'react';
import { adaptRawScheduleToCanonical } from '../../adapters/scheduleAdapter';
import rawScheduleText from '../../mocks/raw-schedule.json?raw';
import offeringData from '../../mocks/offering'; // Mock Offering with multiple groups
import { ScheduleData, ProfessorMetrics, Subject, CourseGroup } from '../../types/canonical';
import TimeGrid from '../components/TimeGrid';
import { professorRepo } from '../services/professorRepository';
import { ScheduleUploader } from '../components/ScheduleUploader';
import { ManualCourseForm } from '../components/ManualCourseForm';
import { ProfessorComparison } from '../components/ProfessorComparison';
import { Button } from '@/shared/ui/button';
import { RefreshCcw, Plus, MousePointer2, GitCompare, Zap, ChevronLeft, ChevronRight, Loader2, Settings2 } from 'lucide-react';
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
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [preferences, setPreferences] = useState<GenerationPreferences>({
    focus: 'BALANCED',
    compact: false
  });

  // Comparison State
  const [comparison, setComparison] = useState<{ idA: string, idB: string } | null>(null);

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
    // Otherwise, auto-select first group of each subject
    if (data.selectedGroups && data.selectedGroups.length > 0) {
      const ids = new Set(data.selectedGroups.map(g => g.id));
      setSelectedGroupIds(ids);
      enrichGroups(data.selectedGroups);
    } else {
      // Auto-select first group of each subject
      const initialSelection = new Set<string>();
      const allGroups: CourseGroup[] = [];
      data.subjects.forEach(s => {
        if (s.groups.length > 0) {
          initialSelection.add(s.groups[0].id);
          allGroups.push(...s.groups);
        }
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
        difficulty: p.difficulty
      };
    });

    try {
      const engine = new SchedulerEngine();
      const results = await engine.generateSchedules(subjects, metrics, preferences);

      if (results.length > 0) {
        setGeneratedSchedules(results);
        setCurrentScheduleIndex(0);
        applyGeneratedSchedule(results[0]);
        toast({
          title: "¡Horarios Generados!",
          description: `Se encontraron ${results.length} mejores combinaciones según tus preferencias.`,
        });
      } else {
        toast({
          title: "Sin resultados",
          description: "No se encontraron combinaciones válidas. Intenta quitar materias.",
          variant: "destructive"
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
    let totalDiff = 0;
    let count = 0;

    selectedGroups.forEach((g) => {
      const p = professorMap.get(g.id);
      if (p && p.globalScore > 0) {
        totalScore += p.globalScore;
        totalDiff += p.difficulty;
        count++;
      }
    });

    return {
      score: count ? (totalScore / count).toFixed(1) : 'N/A',
      difficulty: count ? (totalDiff / count).toFixed(1) : 'N/A',
      count
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="compact">Horario Compacto</Label>
                        <Switch
                          id="compact"
                          checked={preferences.compact}
                          onCheckedChange={(c) => setPreferences({ ...preferences, compact: c })}
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
          <div className="p-4 border rounded-lg bg-card shadow-sm">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <MousePointer2 className="h-4 w-4" /> Materias ({subjects.length})
            </h3>
            {/* Mobile: Limit height / Desktop: Full */}
            <div className="space-y-3 max-h-[200px] lg:max-h-none overflow-y-auto">
              {subjects.map(subject => {
                const selectedGroup = subject.groups.find(g => selectedGroupIds.has(g.id));
                return (
                  <div key={subject.id} className="space-y-1">
                    <div className="text-xs font-bold text-muted-foreground truncate" title={subject.name}>
                      {subject.name}
                    </div>
                    <div className="flex flex-col gap-1">
                      {subject.groups.map(group => {
                        const isSelected = selectedGroupIds.has(group.id);
                        const hasConflict = conflicts.has(group.id);
                        const metrics = professorMap.get(group.id);

                        return (
                          <div key={group.id} className="flex items-center gap-1">
                            <button
                              onClick={() => toggleGroupSelection(subject.id, group.id)}
                              className={`flex-1 text-left px-2 py-1 text-[10px] rounded border transition-colors flex justify-between items-center ${isSelected
                                ? (hasConflict ? 'bg-red-500 border-red-600 text-white' : 'bg-primary border-primary text-primary-foreground')
                                : 'bg-background hover:bg-muted'
                                }`}
                            >
                              <span className="truncate mr-1">{group.groupCode} • {metrics ? (metrics.name || 'S/N').split(' ')[0] : (group.professorNames[0] || 'S/N')}</span>
                              {metrics && (
                                <span className={`font-bold shrink-0 ${isSelected ? 'text-white/90' : (metrics.globalScore >= 8 ? 'text-green-600' : 'text-yellow-600')}`}>
                                  {metrics.globalScore.toFixed(1)} ★
                                </span>
                              )}
                            </button>

                            {!isSelected && selectedGroup && metrics && professorMap.get(selectedGroup.id) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                                title="Comparar"
                                onClick={() => startComparison(selectedGroup.id, group.id)}
                              >
                                <GitCompare className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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
