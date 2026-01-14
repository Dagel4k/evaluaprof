import React from 'react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Clock, TrendingUp, TrendingDown, Calendar, BookOpen, Lightbulb } from 'lucide-react';
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
        if (score >= 8) return 'text-green-500';
        if (score >= 7) return 'text-yellow-500';
        return 'text-orange-500';
    };

    const getDifficultyColor = (score: number) => {
        if (score <= 4) return 'text-green-500';
        if (score <= 6) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <Card className="p-4 space-y-4 bg-card/50 backdrop-blur">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Opción {index + 1} de {total}</h3>
                        <p className="text-xs text-muted-foreground">Score: {stats.score.toFixed(1)}</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-xs">
                    {stats.subjectsCount} materias
                </Badge>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Quality */}
                <div className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
                    <TrendingUp className={`h-4 w-4 mt-0.5 ${getQualityColor(stats.avgQuality)}`} />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Calidad</p>
                        <p className={`text-lg font-bold ${getQualityColor(stats.avgQuality)}`}>
                            {stats.avgQuality.toFixed(1)}
                            <span className="text-xs text-muted-foreground">/10</span>
                        </p>
                    </div>
                </div>

                {/* Difficulty */}
                <div className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
                    <TrendingDown className={`h-4 w-4 mt-0.5 ${getDifficultyColor(stats.avgDifficulty)}`} />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Dificultad</p>
                        <p className={`text-lg font-bold ${getDifficultyColor(stats.avgDifficulty)}`}>
                            {stats.avgDifficulty.toFixed(1)}
                            <span className="text-xs text-muted-foreground">/10</span>
                        </p>
                    </div>
                </div>

                {/* Schedule Time */}
                <div className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
                    <Clock className="h-4 w-4 mt-0.5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Horario</p>
                        <p className="text-sm font-semibold">
                            {formatTime(stats.earliestClass)} - {formatTime(stats.latestClass)}
                        </p>
                    </div>
                </div>

                {/* Gaps */}
                <div className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
                    <Calendar className="h-4 w-4 mt-0.5 text-purple-500" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Gaps</p>
                        <p className="text-sm font-semibold">
                            {stats.totalGaps > 0 ? formatGaps(stats.totalGaps) : 'Sin gaps'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Days Used */}
            <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1">
                    {['L', 'M', 'I', 'J', 'V', 'S'].map((day) => (
                        <div
                            key={day}
                            className={`h-6 w-6 rounded flex items-center justify-center text-xs font-medium ${stats.daysUsed.includes(day)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>
            </div>

            {/* Explanations */}
            {stats.explanation.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase">Por qué este horario</h4>
                    </div>
                    <ul className="space-y-1">
                        {stats.explanation.map((reason, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>{reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Recommendations (if any) */}
            {stats.recommendations && stats.recommendations.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">💡 Recomendaciones</h4>
                    <div className="space-y-2">
                        {stats.recommendations.map((rec, i) => (
                            <div key={i} className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                <p className="text-xs font-medium">{rec.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">{rec.action.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};
