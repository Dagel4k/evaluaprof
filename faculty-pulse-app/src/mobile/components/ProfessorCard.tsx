import React from 'react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { Professor } from '@/types/professor';
import { Native } from '@/shared/lib/native';
import { capitalizeName } from '@/shared/lib/formatters';

interface ProfessorCardProps {
  professor: Professor;
  onClick: () => void;
}

const ProfessorCardComponent: React.FC<ProfessorCardProps> = ({ professor, onClick }) => {
  const grade = professor.calidad_general;
  const gradeColor = grade >= 8 ? 'emerald' : grade >= 6 ? 'amber' : 'rose';
  const gradeCircleClasses =
    gradeColor === 'emerald'
      ? 'ring-emerald-400/40 from-emerald-500/20 to-emerald-500/10 text-emerald-300'
      : gradeColor === 'amber'
      ? 'ring-amber-400/40 from-amber-500/20 to-amber-500/10 text-amber-300'
      : 'ring-rose-400/40 from-rose-500/20 to-rose-500/10 text-rose-300';

  const difficulty = professor.nivel_dificultad <= 2
    ? { text: 'Fácil', tone: 'emerald' }
    : professor.nivel_dificultad <= 3.5
      ? { text: 'Moderado', tone: 'amber' }
      : { text: 'Difícil', tone: 'rose' };

  const mostCommonSubject = React.useMemo(() => {
    const map = new Map<string, number>();
    professor.calificaciones.forEach(c => {
      const key = (c.materia || '').trim();
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    let best = '';
    let count = 0;
    for (const [k, v] of map) {
      if (v > count) { best = k; count = v; }
    }
    return best;
  }, [professor.calificaciones]);

  const isHighlyRecommended = professor.porcentaje_recomienda >= 80;

  const handleClick = async () => {
    await Native.hapticSelect();
    onClick();
  };

  return (
    <Card
      onClick={handleClick}
      className="p-5 sm:p-6 rounded-2xl border-border/50 bg-card/70 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Grade circle */}
        <div
          className={
            `flex items-center justify-center shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full ring-1 bg-gradient-to-br ` +
            gradeCircleClasses
          }
        >
          <span className="font-bold text-base sm:text-lg">{grade.toFixed(1)}</span>
        </div>

        {/* Textual info */}
        <div className="flex-1 min-w-0">
          <h3 
            className="text-base sm:text-lg font-semibold text-foreground leading-tight"
            title={professor.nombre}
          >
            Prof. {capitalizeName(professor.nombre)}
          </h3>
          <p 
            className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-snug"
            title={`${mostCommonSubject || professor.departamento}${professor.universidad ? ` • ${professor.universidad}` : ''}`}
          >
            {capitalizeName(mostCommonSubject) || professor.departamento}
            {professor.universidad && ` • ${professor.universidad}`}
          </p>

          {/* Badges row */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className={
                `text-[10px] sm:text-xs border-0 ` +
                (difficulty.tone === 'emerald'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : difficulty.tone === 'amber'
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-rose-500/15 text-rose-300')
              }
            >
              {difficulty.text}
            </Badge>
            {isHighlyRecommended && (
              <Badge
                variant="secondary"
                className="text-[10px] sm:text-xs border-0 bg-indigo-500/15 text-indigo-300"
              >
                Muy recomendado
              </Badge>
            )}
          </div>

          {/* Low grade subtle warning */}
          {grade < 6.0 && (
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] sm:text-xs text-rose-300/90">
              <AlertTriangle className="h-3 w-3" />
              <span>Calificación baja</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export const ProfessorCard = React.memo(ProfessorCardComponent);

export default ProfessorCard;
