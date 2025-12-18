import { CourseGroup, Subject, TimeSlot } from '../types/canonical';

export type GenerationPreferences = {
  focus: 'QUALITY' | 'DIFFICULTY' | 'BALANCED';
  compact: boolean;
};

export type GroupMetrics = {
  quality: number;
  difficulty: number;
};

export type WorkerMessage = 
  | { type: 'START', subjects: Subject[], metrics: Record<string, GroupMetrics>, preferences: GenerationPreferences }
  | { type: 'STOP' };

export type WorkerResponse = 
  | { type: 'RESULT', schedules: CourseGroup[][] }
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
      const gap = slots[i+1].startTime - slots[i].endTime;
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
  let totalDifficulty = 0;
  let count = 0;

  schedule.forEach(g => {
    const m = metrics[g.id];
    if (m) {
      totalQuality += m.quality;
      totalDifficulty += m.difficulty;
      count++;
    }
  });

  if (count === 0) return 0;

  const avgQuality = totalQuality / count;
  const avgDifficulty = totalDifficulty / count;
  
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

  if (prefs.compact) {
    const gaps = calculateGaps(schedule);
    // Penalty: -1 point per hour of gap roughly
    score -= (gaps / 60); 
  }

  return score;
};

// Algoritmo DFS
const SEARCH_LIMIT = 2000; // Find more to allow sorting
const RETURN_LIMIT = 20;   // Only return top results
let foundSchedules: CourseGroup[][] = [];
let abort = false;

const solve = (
  subjects: Subject[], 
  depth: number, 
  currentSchedule: CourseGroup[]
) => {
  if (abort) return;
  if (foundSchedules.length >= SEARCH_LIMIT) return;

  if (depth === subjects.length) {
    foundSchedules.push([...currentSchedule]);
    if (foundSchedules.length % 50 === 0) {
      self.postMessage({ type: 'PROGRESS', count: foundSchedules.length });
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

    // Fail-fast sort
    const sortedSubjects = [...subjects].sort((a, b) => a.groups.length - b.groups.length);

    solve(sortedSubjects, 0, []);

    // Sort and Prune
    const scoredSchedules = foundSchedules.map(sch => ({
      schedule: sch,
      score: calculateScore(sch, metrics, preferences)
    }));

    scoredSchedules.sort((a, b) => b.score - a.score);

    const bestSchedules = scoredSchedules.slice(0, RETURN_LIMIT).map(s => s.schedule);

    self.postMessage({ type: 'RESULT', schedules: bestSchedules });
    self.postMessage({ type: 'DONE', count: bestSchedules.length });
  }
};
