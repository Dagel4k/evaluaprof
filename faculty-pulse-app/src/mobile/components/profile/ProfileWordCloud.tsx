import React from 'react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import ReactWordcloud from 'react-wordcloud';
import { Professor } from '@/types/professor';
import { IGNORED_WORDS, POSITIVE_TAGS, NEGATIVE_TAGS } from '@/shared/lib/constants';

interface ProfileWordCloudProps {
  professor: Professor;
}

export const ProfileWordCloud: React.FC<ProfileWordCloudProps> = ({ professor }) => {
  // Word Cloud Data Logic
  const wordCloudData = React.useMemo(() => {
    const freq = new Map<string, number>();
    professor.calificaciones.forEach(c => {
      (c.etiquetas_comentario || []).forEach(t => {
        const k = (t || '').toLowerCase().trim();
        if (!k || IGNORED_WORDS.has(k)) return;
        freq.set(k, (freq.get(k) || 0) + 1);
      });
    });
     // fallback: usar etiquetas agregadas si no hay por comentario
    if (!freq.size) {
      professor.etiquetas.forEach(t => {
        const k = (t || '').toLowerCase().trim();
        if (!k || IGNORED_WORDS.has(k)) return;
        freq.set(k, (freq.get(k) || 0) + 1);
      });
    }
    return Array.from(freq.entries())
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 40);
  }, [professor]);

  // Word Cloud Options
  const wordCloudOptions = React.useMemo(() => ({
    rotations: 1,
    rotationAngles: [0, 0] as [number, number],
    fontSizes: [12, 48] as [number, number],
    padding: 5,
    enableTooltip: true,
    deterministic: true,
    fontFamily: 'Inter, sans-serif',
  }), []);

  const topTags = wordCloudData.map(d => d.text).slice(0, 10);
  const topPositives = topTags.filter(t => POSITIVE_TAGS.has(t)).slice(0, 5);
  const topNegatives = topTags.filter(t => NEGATIVE_TAGS.has(t)).slice(0, 5);

  return (
    <>
      {/* Word Cloud */}
      {wordCloudData.length > 0 && (
        <Card className="p-6 mt-6 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4">Temas Frecuentes</h3>
          <div className="h-[300px] w-full">
            <ReactWordcloud words={wordCloudData} options={wordCloudOptions} />
          </div>
        </Card>
      )}

      {/* Top 5 adjetivos */}
      {(topPositives.length > 0 || topNegatives.length > 0) && (
        <Card className="p-6 mt-6 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50">
          <h3 className="text-lg font-semibold mb-4">Top 5 adjetivos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-emerald-300 mb-2">👍 Positivos</div>
              {topPositives.length ? (
                <div className="flex flex-wrap gap-2">
                  {topPositives.map((t, i) => (
                    <Badge key={i} variant="secondary" className="bg-emerald-500/15 text-emerald-300 border-0">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Sin datos</div>
              )}
            </div>
            <div>
              <div className="text-sm text-rose-300 mb-2">👎 Negativos</div>
              {topNegatives.length ? (
                <div className="flex flex-wrap gap-2">
                  {topNegatives.map((t, i) => (
                    <Badge key={i} variant="secondary" className="bg-rose-500/15 text-rose-300 border-0">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Sin datos</div>
              )}
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
