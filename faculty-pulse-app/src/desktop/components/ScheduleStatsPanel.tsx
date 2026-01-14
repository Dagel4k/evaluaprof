import React from 'react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Clock, TrendingUp, TrendingDown, Calendar, BookOpen, Lightbulb, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import type { ScheduleStatistics } from '../../workers/scheduler.worker';

interface ScheduleStatsPanelProps {
    stats: ScheduleStatistics;
    index: number;
    total: number;
}

export const ScheduleStatsPanel: React.FC<ScheduleStatsPanelProps> = ({ stats, index, total }) => {
    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
    };

    const formatGaps = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}min`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}min`;
    };

    const getQualityColor = (score: number) => {
        if (score >= 8) return 'text-emerald-600 dark:text-emerald-400';
        if (score >= 7) return 'text-amber-600 dark:text-amber-400';
        return 'text-orange-600 dark:text-orange-400';
    };

    const getDifficultyColor = (score: number) => {
        if (score <= 4) return 'text-emerald-600 dark:text-emerald-400';
        if (score <= 6) return 'text-amber-600 dark:text-amber-400';
        return 'text-red-600 dark:text-red-400';
    };

    return (
        <Card className="p-4 space-y-4 bg-card border-zinc-200 dark:border-zinc-800 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                        <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">{index + 1}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Option {index + 1} <span className="text-zinc-400 font-normal">/ {total}</span></h3>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">Perf Score: {stats.score.toFixed(1)}</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono uppercase px-1.5 py-0 rounded">
                    {stats.subjectsCount} CODES
                </Badge>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 gap-2">
                {/* Quality */}
                <div className="flex items-start gap-2 p-2 rounded-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <TrendingUp className={`h-3.5 w-3.5 mt-0.5 ${getQualityColor(stats.avgQuality)}`} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">Quality</p>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-2.5 w-2.5 text-zinc-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-zinc-900 border-zinc-700 text-white p-3 max-w-xs shadow-xl">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Puntaje de Calidad AI</p>
                                        <p className="text-[10px] leading-snug text-zinc-300">
                                            Promedio bayesiano que pondera la calificación bruta con el volumen de reseñas y el índice de confiabilidad del profesor.
                                        </p>
                                        <p className="text-[10px] leading-snug text-zinc-400 italic border-t border-zinc-800 pt-1">
                                            Evita que profesores con pocas reseñas (pero perfectas) superen a docentes consistentes con trayectoria.
                                        </p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className={`text-base font-mono font-bold ${getQualityColor(stats.avgQuality)}`}>
                            {stats.avgQuality.toFixed(1)}
                        </p>
                    </div>
                </div>

                {/* Difficulty */}
                <div className="flex items-start gap-2 p-2 rounded-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <TrendingDown className={`h-3.5 w-3.5 mt-0.5 ${getDifficultyColor(stats.avgDifficulty)}`} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">Hardness</p>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-2.5 w-2.5 text-zinc-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-zinc-900 border-zinc-700 text-white p-3 max-w-xs shadow-xl">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Índice de Hardness</p>
                                        <p className="text-[10px] leading-snug text-zinc-300">
                                            Nivel de exigencia y carga de trabajo normalizado. Representa la dificultad histórica reportada para aprobar y la densidad de tareas.
                                        </p>
                                        <p className="text-[10px] leading-snug text-zinc-400 italic border-t border-zinc-800 pt-1">
                                            Escala de 1 a 10. Un valor bajo indica un semestre con menor carga académica y mayor facilidad de acreditación.
                                        </p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className={`text-base font-mono font-bold ${getDifficultyColor(stats.avgDifficulty)}`}>
                            {stats.avgDifficulty.toFixed(1)}
                        </p>
                    </div>
                </div>

                {/* Schedule Time */}
                <div className="flex items-start gap-2 p-2 rounded-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <Clock className="h-3.5 w-3.5 mt-0.5 text-zinc-500" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">Timeline</p>
                        <p className="text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                            {formatTime(stats.earliestClass).split(' ')[0]}-{formatTime(stats.latestClass)}
                        </p>
                    </div>
                </div>

                {/* Gaps */}
                <div className="flex items-start gap-2 p-2 rounded-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <Calendar className="h-3.5 w-3.5 mt-0.5 text-zinc-500" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">Idle Time</p>
                        <p className="text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                            {stats.totalGaps > 0 ? formatGaps(stats.totalGaps) : '0M'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Days Used */}
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-sm border border-zinc-100 dark:border-zinc-800">
                <BookOpen className="h-3 w-3 text-zinc-400" />
                <div className="flex gap-1">
                    {['L', 'M', 'I', 'J', 'V', 'S'].map((day) => (
                        <div
                            key={day}
                            className={`h-5 w-5 rounded-px flex items-center justify-center text-[9px] font-mono font-bold ${stats.daysUsed.includes(day)
                                ? 'bg-primary text-primary-foreground border border-primary'
                                : 'bg-transparent text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                                }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>
            </div>

            {/* Explanations */}
            {(stats.explanation.length > 0 || stats.difficultyContext || stats.difficultyDriver) && (
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                        <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Logic Analysis</h4>
                    </div>

                    {stats.difficultyContext && (
                        <div className="p-2 rounded bg-cyan-500/5 border border-cyan-500/10 mb-2">
                            <p className="text-[10px] text-cyan-700 dark:text-cyan-400 font-bold uppercase tracking-tight italic">
                                "{stats.difficultyContext}"
                            </p>
                            {stats.difficultyDriver && (
                                <p className="text-[9px] text-zinc-500 mt-1 flex items-center gap-1">
                                    <TrendingUp className="h-2.5 w-2.5 text-red-500" />
                                    Impulsor de dificultad: <span className="font-bold text-zinc-700 dark:text-zinc-300">{stats.difficultyDriver.name} ({stats.difficultyDriver.score})</span>
                                </p>
                            )}
                        </div>
                    )}

                    <ul className="space-y-1">
                        {stats.explanation.map((reason, i) => (
                            <li key={i} className="text-[10px] text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                                <span className="text-zinc-400 mt-1 uppercase text-[8px] font-bold tracking-tighter">INFO</span>
                                <span className="font-medium">{reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Recommendations (if any) */}
            {stats.recommendations && stats.recommendations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest tracking-widest">Optimization Tips</h4>
                    <div className="space-y-1.5">
                        {stats.recommendations.map((rec, i) => (
                            <div key={i} className="p-2 rounded bg-zinc-100 dark:bg-zinc-800 border-l-2 border-primary">
                                <p className="text-[10px] font-bold uppercase tracking-tight">{rec.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{rec.action.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};
