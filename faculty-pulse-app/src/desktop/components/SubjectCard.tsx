import React from 'react';
import { Subject, CourseGroup, ProfessorMetrics } from '@/types/canonical';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { BookOpen, Clock, Award, Users } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface SubjectCardProps {
    subject: Subject;
    selectedGroupId?: string;
    professorMap: Map<string, ProfessorMetrics>;
    onGroupSelect: (groupId: string) => void;
    onCompare?: (groupAId: string, groupBId: string) => void;
    conflictingGroupIds: string[];
}

const CLASSIFICATION_STYLES = {
    DISPONIBLE: {
        badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 font-mono',
        label: 'REQUIRED'
    },
    AVANCE: {
        badge: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 font-mono',
        label: 'OPTIONAL'
    },
    CURSADA: {
        badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-mono',
        label: 'COMPLETED'
    }
};

export const SubjectCard: React.FC<SubjectCardProps> = ({
    subject,
    selectedGroupId,
    professorMap,
    onGroupSelect,
    onCompare,
    conflictingGroupIds
}) => {
    const classificationStyle = subject.classification
        ? CLASSIFICATION_STYLES[subject.classification]
        : null;

    return (
        <Card className="p-3 sm:p-4 space-y-2.5 shadow-sm border-zinc-200 dark:border-zinc-800">
            {/* Header */}
            <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs uppercase tracking-tight leading-tight line-clamp-2" title={subject.name}>
                            {subject.name}
                        </h4>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{subject.code}</p>
                    </div>
                    {classificationStyle && (
                        <Badge variant="outline" className={`${classificationStyle.badge} text-[9px] shrink-0 h-fit px-1.5 py-0 rounded`}>
                            {classificationStyle.label}
                        </Badge>
                    )}
                </div>

                {/* Metadata */}
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium text-zinc-500 uppercase tracking-tighter">
                    {subject.credits !== undefined && (
                        <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 shrink-0" />
                            <span className="whitespace-nowrap">{subject.credits} CR</span>
                        </div>
                    )}
                    {subject.hours !== undefined && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="whitespace-nowrap">{subject.hours}H/WK</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Groups */}
            <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <span>{subject.groups.length} OPTIONS</span>
                </div>

                <div className="space-y-1">
                    {subject.groups.map(group => {
                        const isSelected = selectedGroupId === group.id;
                        const hasConflict = conflictingGroupIds.includes(group.id);
                        const metrics = professorMap.get(group.id);
                        const rawProfName = group.professorNames[0]?.trim() || '';
                        const professorName = metrics?.name || (rawProfName.length > 0 ? rawProfName : 'Unassigned');
                        const firstName = professorName.split(' ')[0];

                        return (
                            <button
                                key={group.id}
                                onClick={() => onGroupSelect(group.id)}
                                className={`w-full text-left px-3 py-3 sm:py-2 text-xs rounded-lg border transition-all ${isSelected
                                    ? hasConflict
                                        ? 'bg-red-600 border-red-700 text-white shadow-sm'
                                        : 'bg-primary border-primary text-primary-foreground shadow-sm font-bold'
                                    : 'bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="font-mono text-[10px] shrink-0">{group.groupCode}</span>
                                        <span className="text-[10px] opacity-90 truncate flex-1 uppercase tracking-tighter">
                                            {(() => {
                                                const parts = professorName.split(' ');
                                                return parts.length > 1 ? `${parts[0]} ${parts[1]}` : parts[0];
                                            })()}
                                        </span>
                                    </div>
                                    {metrics && (
                                        <div className={`flex items-center gap-0.5 shrink-0 font-mono ${isSelected ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                            <span className="text-[10px]">{metrics.globalScore.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
};
