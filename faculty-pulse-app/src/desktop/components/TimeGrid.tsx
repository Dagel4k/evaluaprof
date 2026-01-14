import React from 'react';
import { CourseGroup, DayOfWeek, ProfessorMetrics, TimeSlot } from '../../types/canonical';
import { AlertTriangle } from 'lucide-react';

interface TimeGridProps {
  groups: CourseGroup[];
  professorMap?: Map<string, ProfessorMetrics>;
  conflictingGroupIds?: string[];
  onGroupClick?: (group: CourseGroup) => void;
}

const DAYS: { id: DayOfWeek; label: string }[] = [
  { id: 'L', label: 'Lunes' },
  { id: 'M', label: 'Martes' },
  { id: 'I', label: 'Miércoles' },
  { id: 'J', label: 'Jueves' },
  { id: 'V', label: 'Viernes' },
];

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 to 20:00

const TimeGrid: React.FC<TimeGridProps> = ({ groups, professorMap, conflictingGroupIds = [], onGroupClick }) => {
  // Helper to find if a slot exists for a day/hour
  const getEvent = (day: DayOfWeek, hour: number) => {
    // Simplification: We just look for classes that START at this hour for the visual grid
    for (const group of groups) {
      const slot = group.schedule.find(s => s.day === day && Math.floor(s.startTime / 60) === hour);
      if (slot) return { group, slot };
    }
    return null;
  };

  const getQualityColor = (group: CourseGroup, score?: number) => {
    if (conflictingGroupIds.includes(group.id)) {
      return 'border-red-600 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-300';
    }
    if (score === undefined) return 'border-zinc-300 bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';

    // Academic industrial palette
    if (score >= 8) return 'border-emerald-600/40 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300';
    if (score >= 6) return 'border-amber-600/40 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300';
    return 'border-orange-600/40 bg-orange-50 text-orange-900 dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-300';
  };

  return (
    <div className="border border-border rounded-md overflow-hidden bg-card shadow-sm flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-6 border-b border-border bg-muted sticky top-0 z-10">
            <div className="p-3 text-center text-[10px] font-bold text-muted-foreground border-r border-border uppercase tracking-widest">
              Timeline
            </div>
            {DAYS.map(day => (
              <div key={day.id} className="p-3 text-center text-xs font-bold border-r border-border last:border-r-0 uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                {day.label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-6 bg-card">
            {HOURS.map(hour => (
              <React.Fragment key={hour}>
                {/* Time Label */}
                <div className="p-2 text-center text-[10px] font-mono font-medium text-muted-foreground border-r border-b border-border h-24 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* Days Columns */}
                {DAYS.map(day => {
                  const eventData = getEvent(day.id, hour);

                  if (!eventData) {
                    return <div key={`${day.id}-${hour}`} className="border-r border-b border-border last:border-r-0 p-1 h-24" />;
                  }

                  const { group, slot } = eventData;
                  const metrics = professorMap?.get(group.id);
                  const colorClass = getQualityColor(group, metrics?.globalScore);

                  return (
                    <div key={`${day.id}-${hour}`} className="border-r border-b border-border last:border-r-0 relative p-1 h-24">
                      <div
                        onClick={() => onGroupClick?.(group)}
                        className={`absolute inset-1 border rounded p-2 text-[10px] overflow-hidden hover:brightness-95 active:scale-[0.98] transition-all cursor-pointer group ${colorClass} flex flex-col justify-between shadow-sm`}
                      >
                        <div className="font-bold truncate leading-tight mb-1 uppercase tracking-tight">
                          {group.subjectName}
                        </div>

                        <div className="text-current/90 truncate flex justify-between items-center text-[11px]">
                          <span className="truncate mr-1 font-semibold">
                            {(() => {
                              const fullName = metrics ? metrics.name : (group.professorNames[0]?.trim() || 'Unassigned');
                              const parts = fullName.split(' ');
                              return parts.length > 1 ? `${parts[0]} ${parts[1]}` : parts[0];
                            })()}
                          </span>
                          {metrics && (
                            <span className="font-bold shrink-0 opacity-80" title="Quality Score">
                              {metrics.globalScore.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-current/70 font-mono text-[9px] flex justify-between border-t border-current/20 pt-1">
                          <span className="font-medium">{group.groupCode} • {slot.classroom}</span>
                          {metrics && metrics.riskLevel === 'HIGH' && (
                            <span title="High Risk" className="text-red-600 dark:text-red-400">
                              <AlertTriangle className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeGrid;
