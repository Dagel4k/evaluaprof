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
        badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700',
        label: 'Disponible'
    },
    AVANCE: {
        badge: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700',
        label: 'Avance'
    },
    CURSADA: {
        badge: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
        label: 'Cursada'
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
        <Card className="p-3 space-y-2.5 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-tight line-clamp-2" title={subject.name}>
                            {subject.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{subject.code}</p>
                    </div>
                    {classificationStyle && (
                        <Badge variant="outline" className={`${classificationStyle.badge} text-[10px] shrink-0 h-fit`}>
                            {classificationStyle.label}
                        </Badge>
                    )}
                </div>

                {/* Metadata */}
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {subject.credits !== undefined && (
                        <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 shrink-0" />
                            <span className="whitespace-nowrap">{subject.credits} créditos</span>
                        </div>
                    )}
                    {subject.hours !== undefined && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="whitespace-nowrap">{subject.hours}h</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Groups */}
            <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{subject.groups.length} grupo{subject.groups.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="space-y-1.5">
                    {subject.groups.map(group => {
                        const isSelected = selectedGroupId === group.id;
                        const hasConflict = conflictingGroupIds.includes(group.id);
                        const metrics = professorMap.get(group.id);
                        const rawProfName = group.professorNames[0]?.trim() || '';
                        const professorName = metrics?.name || (rawProfName.length > 0 ? rawProfName : 'No Asignado');
                        const firstName = professorName.split(' ')[0];

                        return (
                            <button
                                key={group.id}
                                onClick={() => onGroupSelect(group.id)}
                                className={`w-full text-left px-2.5 py-2 text-xs rounded border transition-all ${isSelected
                                    ? hasConflict
                                        ? 'bg-red-500 border-red-600 text-white shadow-sm'
                                        : 'bg-primary border-primary text-primary-foreground shadow-sm'
                                    : 'bg-background hover:bg-muted border-border'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="font-medium shrink-0">{group.groupCode}</span>
                                        <span className="text-[10px] opacity-75 truncate flex-1">{firstName}</span>
                                    </div>
                                    {metrics && (
                                        <div className={`flex items-center gap-0.5 shrink-0 ${isSelected ? 'text-white/90' : metrics.globalScore >= 8 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                                            }`}>
                                            <span className="font-bold text-[11px]">{metrics.globalScore.toFixed(1)}</span>
                                            <span className="text-[10px]">★</span>
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
