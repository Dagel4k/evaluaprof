import React from 'react';
import { CourseGroup, DayOfWeek, ProfessorMetrics, TimeSlot } from '../../types/canonical';

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
      return 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400';
    }
    if (score === undefined) return 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300';
    if (score >= 8) return 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400';
    if (score >= 6) return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    return 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400';
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-md flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <div className="min-w-[800px]"> {/* Force min width to prevent squishing */}
          <div className="grid grid-cols-6 border-b border-border bg-muted sticky top-0 z-10">
            <div className="p-3 text-center text-xs font-bold text-muted-foreground border-r border-border uppercase tracking-wider">
              Hora
            </div>
            {DAYS.map(day => (
              <div key={day.id} className="p-3 text-center text-xs sm:text-sm font-bold border-r border-border last:border-r-0 uppercase tracking-wider">
                {day.label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-6 bg-card">
            {HOURS.map(hour => (
              <React.Fragment key={hour}>
                {/* Time Label */}
                <div className="p-2 text-center text-[10px] sm:text-xs font-medium text-muted-foreground border-r border-b border-border h-24 flex items-center justify-center bg-muted/20">
                  {hour}:00
                </div>

                {/* Days Columns */}
                {DAYS.map(day => {
                  const eventData = getEvent(day.id, hour);
                  
                  if (!eventData) {
                    return <div key={`${day.id}-${hour}`} className="border-r border-b border-border last:border-r-0 p-1 h-24 bg-card/50" />;
                  }

                  const { group, slot } = eventData;
                  const metrics = professorMap?.get(group.id);
                  const colorClass = getQualityColor(group, metrics?.globalScore);

                  return (
                    <div key={`${day.id}-${hour}`} className="border-r border-b border-border last:border-r-0 relative p-1 h-24">
                      <div 
                        onClick={() => onGroupClick?.(group)}
                        className={`absolute inset-1 border rounded-lg p-2 text-[10px] sm:text-xs overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${colorClass} flex flex-col justify-between`}
                      >
                        <div className="font-bold truncate leading-tight mb-1">
                          {group.subjectName}
                        </div>
                        
                        <div className="text-current/80 truncate flex justify-between items-center">
                          <span className="truncate mr-1 font-medium">{metrics ? metrics.name.split(' ')[0] : (group.professorNames[0] || 'S/N')}</span>
                          {metrics && (
                            <span className="font-bold shrink-0 text-[11px]" title="Calidad General">
                              {metrics.globalScore.toFixed(1)} ★
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-current/60 font-mono text-[9px] flex justify-between border-t border-current/10 pt-1">
                          <span>{group.groupCode} • {slot.classroom}</span>
                          {metrics && metrics.riskLevel === 'HIGH' && (
                            <span title="Riesgo Alto" className="animate-pulse">⚠️</span>
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
