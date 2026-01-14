import { CourseGroup, Subject, TimeSlot } from '../types/canonical';

export type GenerationPreferences = {
  focus: 'QUALITY' | 'DIFFICULTY' | 'BALANCED';
  maxGapTolerance: number; // Maximum hours of gaps tolerable (0-5+)
  includeAvance: boolean;
  allowUnassignedProfessors: boolean; // Include groups without assigned professors
  preferredStartTime?: number; // Minutes from midnight (e.g., 540 = 9:00 AM)
  preferredEndTime?: number;   // Minutes from midnight (e.g., 1080 = 6:00 PM)
  timeFilterMode: 'EXACT' | 'MINIMUM' | 'CLOSEST'; // How to apply time filters
};

export type GroupMetrics = {
  quality: number;
  difficulty: number;
  trust: number;
};

export type ScheduleStatistics = {
  score: number;
  avgQuality: number;
  avgDifficulty: number;
  totalGaps: number;        // Minutes of gaps between classes
  earliestClass: number;    // Earliest class time in minutes
  latestClass: number;      // Latest class time in minutes
  daysUsed: string[];       // Days with classes
  subjectsCount: number;
  explanation: string[];    // Reasons why this schedule was chosen
  recommendations: ScheduleRecommendation[];
};

export type ScheduleRecommendation = {
  type: 'DIFFICULTY' | 'QUALITY' | 'GAPS' | 'TIME';
  severity: 'INFO' | 'WARNING' | 'SUGGESTION';
  message: string;
  impact: {
    metric: string;
    currentValue: number;
    improvedValue: number;
    improvement: number;
  };
  action: {
    description: string;
    changes: string[];
  };
};

export type WorkerMessage =
  | { type: 'START', subjects: Subject[], metrics: Record<string, GroupMetrics>, preferences: GenerationPreferences }
  | { type: 'STOP' };

export type WorkerResponse =
  | { type: 'RESULT', schedules: CourseGroup[][], statistics: ScheduleStatistics[] }
  | { type: 'PROGRESS', count: number }
  | { type: 'DONE', count: number };

// Helper simple de colisión
const areSlotsOverlapping = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  if (slot1.day !== slot2.day) return false;
  return slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime;
};

const hasConflict = (newGroup: CourseGroup, currentSchedule: CourseGroup[]): boolean => {
  for (const existing of currentSchedule) {
    for (const s1 of newGroup.schedule) {
      for (const s2 of existing.schedule) {
        if (areSlotsOverlapping(s1, s2)) return true;
      }
    }
  }
  return false;
};

// Calculate gaps in minutes
const calculateGaps = (schedule: CourseGroup[]): number => {
  let totalGaps = 0;
  const days = ['L', 'M', 'I', 'J', 'V', 'S'];

  days.forEach(day => {
    // Get all slots for this day
    const slots = schedule.flatMap(g => g.schedule.filter(s => s.day === day));
    if (slots.length < 2) return;

    // Sort by start time
    slots.sort((a, b) => a.startTime - b.startTime);

    // Sum gaps between consecutive slots
    for (let i = 0; i < slots.length - 1; i++) {
      const gap = slots[i + 1].startTime - slots[i].endTime;
      if (gap > 0) totalGaps += gap;
    }
  });

  return totalGaps;
};

// Calculate Score based on preferences
const calculateScore = (
  schedule: CourseGroup[],
  metrics: Record<string, GroupMetrics> | undefined,
  prefs: GenerationPreferences
): number => {
  if (!metrics) return 0; // Defensive check

  let totalQuality = 0;
  let qualityCount = 0;
  let totalDifficulty = 0;
  let difficultyCount = 0;

  schedule.forEach((group) => {
    const m = metrics[group.id];
    if (m) {
      if (m.quality > 0) {
        totalQuality += m.quality;
        qualityCount++;
      }
      if (m.difficulty > 0) {
        totalDifficulty += m.difficulty;
        difficultyCount++;
      }
    }
  });

  if (qualityCount === 0 && difficultyCount === 0) return 0;

  const avgQuality = qualityCount ? totalQuality / qualityCount : 5; // Neutral 5 if no quality data
  const avgDifficulty = difficultyCount ? totalDifficulty / difficultyCount : 5; // Neutral 5 if no difficulty data

  // Normalize factors (0-10 scale usually)
  let score = 0;

  if (prefs.focus === 'QUALITY') {
    score += avgQuality * 10; // Maximize quality
    score -= avgDifficulty * 2; // Slight penalty for difficulty
  } else if (prefs.focus === 'DIFFICULTY') {
    score += (10 - avgDifficulty) * 10; // Maximize easiness
    score += avgQuality * 2; // Slight bonus for quality
  } else { // BALANCED
    score += avgQuality * 6;
    score += (10 - avgDifficulty) * 4;
  }

  // Trust/Confidence Penalty
  // Calculate average trust for the schedule
  let totalTrust = 0;
  let trustCount = 0;
  schedule.forEach(g => {
    const m = metrics[g.id];
    if (m) {
      totalTrust += m.trust;
      trustCount++;
    }
  });
  const avgTrust = trustCount > 0 ? totalTrust / trustCount : 1.0;

  // Penalize scores where the average trust is low (< 0.8)
  if (avgTrust < 0.8) {
    const trustPenalty = (0.8 - avgTrust) * 50; // Significant penalty for low trust
    score -= trustPenalty;
  }

  // Gap penalty based on tolerance
  const gaps = calculateGaps(schedule);
  const gapHours = gaps / 60;

  if (gapHours > prefs.maxGapTolerance) {
    // Progressive penalty for exceeding tolerance
    const excessGaps = gapHours - prefs.maxGapTolerance;
    score -= excessGaps * 10; // -10 points per excess hour
  }

  // CLOSEST mode: bonus for being close to preferred times
  if (prefs.timeFilterMode === 'CLOSEST') {
    const { earliest, latest } = getScheduleTimeRange(schedule);

    if (prefs.preferredStartTime !== undefined) {
      const startDiff = Math.abs(earliest - prefs.preferredStartTime);
      const startBonus = Math.max(0, 10 - (startDiff / 60)); // Max 10 points if exact
      score += startBonus;
    }

    if (prefs.preferredEndTime !== undefined) {
      const endDiff = Math.abs(latest - prefs.preferredEndTime);
      const endBonus = Math.max(0, 10 - (endDiff / 60));
      score += endBonus;
    }
  }

  return score;
};

// Get earliest and latest class times
const getScheduleTimeRange = (schedule: CourseGroup[]): { earliest: number, latest: number } => {
  let earliest = Infinity;
  let latest = -Infinity;

  schedule.forEach(g => {
    g.schedule.forEach(slot => {
      if (slot.startTime < earliest) earliest = slot.startTime;
      if (slot.endTime > latest) latest = slot.endTime;
    });
  });

  return { earliest, latest };
};

// Check if schedule meets time preferences
const meetsTimePreferences = (
  schedule: CourseGroup[],
  prefs: GenerationPreferences
): boolean => {
  const { earliest, latest } = getScheduleTimeRange(schedule);

  // Strict gap filtering when tolerance is 0
  if (prefs.maxGapTolerance === 0) {
    const gaps = calculateGaps(schedule);
    if (gaps > 0) return false; // Reject any schedule with gaps
  }

  if (prefs.timeFilterMode === 'EXACT') {
    // EXACT: Must start exactly at preferred time (within 5 min tolerance)
    if (prefs.preferredStartTime !== undefined) {
      const diff = Math.abs(earliest - prefs.preferredStartTime);
      if (diff > 5) return false; // 5 minute tolerance
    }

    if (prefs.preferredEndTime !== undefined) {
      const diff = Math.abs(latest - prefs.preferredEndTime);
      if (diff > 5) return false;
    }
  } else if (prefs.timeFilterMode === 'MINIMUM') {
    // MINIMUM: No earlier than preferred time
    if (prefs.preferredStartTime !== undefined && earliest < prefs.preferredStartTime) {
      return false;
    }

    if (prefs.preferredEndTime !== undefined && latest > prefs.preferredEndTime) {
      return false;
    }
  }
  // CLOSEST mode doesn't filter, it affects scoring instead

  return true;
};

// Generate explanatory statistics
const generateStatistics = (
  schedule: CourseGroup[],
  metrics: Record<string, GroupMetrics> | undefined,
  prefs: GenerationPreferences,
  score: number
): ScheduleStatistics => {
  const { earliest, latest } = getScheduleTimeRange(schedule);
  const gaps = calculateGaps(schedule);
  const daysUsed = [...new Set(schedule.flatMap(g => g.schedule.map(s => s.day)))].sort();

  let totalQuality = 0;
  let totalDifficulty = 0;
  let count = 0;

  if (metrics) {
    schedule.forEach(g => {
      const m = metrics[g.id];
      if (m) {
        totalQuality += m.quality;
        totalDifficulty += m.difficulty;
        count++;
      }
    });
  }

  const avgQuality = count > 0 ? totalQuality / count : 0;
  const avgDifficulty = count > 0 ? totalDifficulty / count : 0;
  const avgTrust = count > 0 ? (schedule.reduce((acc, g) => acc + (metrics?.[g.id]?.trust || 1), 0) / count) : 1.0;

  // Generate recommendations
  const recommendations: ScheduleRecommendation[] = [];

  if (avgTrust < 0.7) {
    recommendations.push({
      type: 'QUALITY',
      severity: 'WARNING',
      message: 'Confianza de datos baja',
      impact: { metric: 'Confianza', currentValue: avgTrust * 100, improvedValue: 80, improvement: 10 },
      action: {
        description: 'Considera grupos con mayor trayectoria.',
        changes: ['Busca profesores con más de 10 reseñas.']
      }
    });
  }

  if (gaps > 180) { // More than 3 hours of gaps
    recommendations.push({
      type: 'GAPS',
      severity: 'SUGGESTION',
      message: 'Horario con muchos huecos',
      impact: { metric: 'Gaps', currentValue: gaps, improvedValue: 60, improvement: gaps - 60 },
      action: {
        description: 'Intenta compactar las clases.',
        changes: ['Reduce la tolerancia a gaps en preferencias.']
      }
    });
  }

  // Generate explanations
  const explanation: string[] = [];

  if (prefs.focus === 'QUALITY') {
    explanation.push(`Optimizado para calidad de profesores (${avgQuality.toFixed(1)}/10)`);
  } else if (prefs.focus === 'DIFFICULTY') {
    explanation.push(`Optimizado para facilidad (dificultad: ${avgDifficulty.toFixed(1)}/10)`);
  } else {
    explanation.push(`Balance entre calidad (${avgQuality.toFixed(1)}) y facilidad (${avgDifficulty.toFixed(1)})`);
  }

  const gapHours = Math.round(gaps / 60 * 10) / 10;
  if (gapHours <= prefs.maxGapTolerance) {
    explanation.push(`Gaps dentro de tolerancia: ${gapHours}h de ${prefs.maxGapTolerance}h`);
  } else {
    explanation.push(`Gaps: ${gapHours}h (excede tolerancia de ${prefs.maxGapTolerance}h)`);
  }

  const startHour = Math.floor(earliest / 60);
  const startMin = earliest % 60;
  const endHour = Math.floor(latest / 60);
  const endMin = latest % 60;

  explanation.push(`Inicia a las ${startHour}:${String(startMin).padStart(2, '0')}`);
  explanation.push(`Termina a las ${endHour}:${String(endMin).padStart(2, '0')}`);
  explanation.push(`Usa ${daysUsed.length} día${daysUsed.length !== 1 ? 's' : ''} (${daysUsed.join(', ')})`);

  return {
    score,
    avgQuality,
    avgDifficulty,
    totalGaps: gaps,
    earliestClass: earliest,
    latestClass: latest,
    daysUsed,
    subjectsCount: schedule.length,
    explanation,
    recommendations
  };
};

// Algoritmo DFS
const SEARCH_LIMIT = 2000; // Find more to allow sorting
const RETURN_LIMIT = 20;   // Only return top results
let foundSchedules: CourseGroup[][] = [];
let abort = false;

let globalPrefs: GenerationPreferences;

const solve = (
  subjects: Subject[],
  depth: number,
  currentSchedule: CourseGroup[]
) => {
  if (abort) return;
  if (foundSchedules.length >= SEARCH_LIMIT) return;

  if (depth === subjects.length) {
    // Apply time preference filtering
    if (meetsTimePreferences(currentSchedule, globalPrefs)) {
      foundSchedules.push([...currentSchedule]);
      if (foundSchedules.length % 50 === 0) {
        self.postMessage({ type: 'PROGRESS', count: foundSchedules.length });
      }
    }
    return;
  }

  const subject = subjects[depth];

  // Optimization: Sort groups by quality/difficulty based on prefs? 
  // For now just random order, we sort results later.

  for (const group of subject.groups) {
    if (!hasConflict(group, currentSchedule)) {
      currentSchedule.push(group);
      solve(subjects, depth + 1, currentSchedule);
      currentSchedule.pop();
      if (foundSchedules.length >= SEARCH_LIMIT) return;
    }
  }
};

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type } = e.data;

  if (type === 'STOP') {
    abort = true;
    return;
  }

  if (type === 'START') {
    const { subjects, metrics, preferences } = e.data;
    foundSchedules = [];
    abort = false;
    globalPrefs = preferences; // Store for use in solve()

    // Filter out AVANCE subjects if not included in preferences
    let filteredSubjects = subjects;
    if (!preferences.includeAvance) {
      filteredSubjects = subjects.filter(s => !s.classification || s.classification !== 'AVANCE');
    }

    // Filter out subjects with only unassigned professors if not allowed
    if (!preferences.allowUnassignedProfessors) {
      filteredSubjects = filteredSubjects.map(subject => {
        // Filter groups to only include those with assigned professors
        const groupsWithProfs = subject.groups.filter(g =>
          g.professorNames.length > 0 && g.professorNames[0]?.trim().length > 0
        );

        // Only include subject if it has at least one group with a professor
        if (groupsWithProfs.length > 0) {
          return { ...subject, groups: groupsWithProfs };
        }
        return null;
      }).filter((s): s is Subject => s !== null);
    }

    // Fail-fast sort
    const sortedSubjects = [...filteredSubjects].sort((a, b) => a.groups.length - b.groups.length);

    solve(sortedSubjects, 0, []);

    // Sort and Prune with statistics
    const scoredSchedules = foundSchedules.map(sch => ({
      schedule: sch,
      score: calculateScore(sch, metrics, preferences)
    }));

    scoredSchedules.sort((a, b) => b.score - a.score);

    const bestSchedules = scoredSchedules.slice(0, RETURN_LIMIT);
    const schedules = bestSchedules.map(s => s.schedule);
    const statistics = bestSchedules.map(s =>
      generateStatistics(s.schedule, metrics, preferences, s.score)
    );

    self.postMessage({ type: 'RESULT', schedules, statistics });
    self.postMessage({ type: 'DONE', count: bestSchedules.length });
  }
};
