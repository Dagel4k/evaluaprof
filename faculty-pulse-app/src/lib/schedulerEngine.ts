import { CourseGroup, Subject } from '../types/canonical';
import { GenerationPreferences, GroupMetrics, ScheduleStatistics } from '../workers/scheduler.worker';

export class SchedulerEngine {
  private worker: Worker | null = null;

  constructor() {
    this.worker = new Worker(new URL('../workers/scheduler.worker.ts', import.meta.url), {
      type: 'module'
    });
  }

  public generateSchedules(
    subjects: Subject[],
    metrics: Record<string, GroupMetrics>,
    preferences: GenerationPreferences,
    onProgress?: (count: number) => void
  ): Promise<{ schedules: CourseGroup[][], statistics: ScheduleStatistics[], diagnostics?: { rejectedByTime: number, totalCombinations: number } }> {
    return new Promise((resolve, reject) => {
      if (!this.worker) return reject('Worker not initialized');

      this.worker.onmessage = (e) => {
        const { type, schedules, statistics, count } = e.data;
        if (type === 'RESULT') {
          resolve({ schedules, statistics, diagnostics: e.data.diagnostics });
        } else if (type === 'PROGRESS') {
          onProgress?.(count);
        } else if (type === 'DONE') {
          // Final status update if needed
        }
      };

      this.worker.onerror = (err) => {
        reject(err);
      };

      this.worker.postMessage({ type: 'START', subjects, metrics, preferences });
    });
  }

  public terminate() {
    this.worker?.terminate();
    this.worker = null;
  }
}
