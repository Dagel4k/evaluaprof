import React from 'react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Calendar, Star } from 'lucide-react';
import { Professor, Calificacion } from '@/types/professor';
import { capitalizeName } from '@/shared/lib/formatters';

interface ProfileReviewsProps {
  professor: Professor;
}

export const ProfileReviews: React.FC<ProfileReviewsProps> = ({ professor }) => {
  const getGradeColor = (grade: number) => {
    // Duplicate logic for now, ideally passed or centralized hook but simple enough to repeat
    if (grade >= 8.0) return 'text-green-600';
    if (grade >= 6.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    try {
      const months: {[key: string]: string} = {
        'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12'
      };
      
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parts[0];
        const monthAbbr = parts[1];
        const year = parts[2];
        const month = months[monthAbbr] || '01';
        return new Date(`${year}-${month}-${day}`).toLocaleDateString('es-ES');
      }
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };

  const reviews = professor.calificaciones
    .filter(c => {
      const comment = (c.comentario || '').toLowerCase();
      return !comment.includes('comentario esperando') && 
             !comment.includes('esperando revision') &&
             !comment.includes('esperando revisión');
    })
    .slice(0, 5);

  return (
    <Card className="p-6 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50">
      <h3 className="text-lg font-semibold mb-4">Reseñas Recientes</h3>
      <div className="space-y-4">
        {reviews.map((calificacion, index) => (
          <div key={index} className="border-l-4 border-primary/60 pl-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-4 flex-wrap min-w-0">
                <Badge variant="outline">{capitalizeName(calificacion.materia)}</Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className={`font-semibold ${getGradeColor(calificacion.puntaje_calidad_general)}`}>
                    {calificacion.puntaje_calidad_general.toFixed(1)}
                  </span>
                </div>
                {calificacion.tipo_calificacion && (
                  <Badge variant="secondary" className="text-xs">
                    {calificacion.tipo_calificacion}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground sm:ml-auto break-anywhere">
                <Calendar className="h-4 w-4" />
                <span className="break-anywhere">{formatDate(calificacion.fecha)}</span>
              </div>
            </div>
            <div className="space-y-2">
              {calificacion.comentario && (
                <p className="text-foreground whitespace-pre-wrap break-anywhere">{calificacion.comentario}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {calificacion.asistencia && (
                  <span>Asistencia: {calificacion.asistencia}</span>
                )}
                {calificacion.calificacion_recibida && (
                  <span>Calificación: {calificacion.calificacion_recibida}</span>
                )}
                {calificacion.interes_clase && (
                  <span>Interés: {calificacion.interes_clase}</span>
                )}
              </div>
              {calificacion.etiquetas_comentario && calificacion.etiquetas_comentario.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {calificacion.etiquetas_comentario.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {index < reviews.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </div>
    </Card>
  );
};
