import { CourseGroup, DayOfWeek, ScheduleData, Subject, TimeSlot } from '../types/canonical';
import { v4 as uuidv4 } from 'uuid';

export interface OfferingJson {
    esValido: boolean;
    data: {
        materias: Array<{
            claveMateria: string;
            nombre: string;
            creditos: number;
            horas: number;
            clasificacion: string;
            grupos: Array<{
                claveGrupo: string;
                docente: string;
                horario: Array<{
                    dia: string;
                    inicio: string;
                    fin: string;
                    claveAula: string;
                }>;
            }>;
        }>;
    };
}

const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
};

const dayMap: Record<string, DayOfWeek> = {
    'LUN': 'L',
    'MAR': 'M',
    'MIE': 'I',
    'JUE': 'J',
    'VIE': 'V',
    'SAB': 'S'
};

export const adaptOfferingJsonToCanonical = (json: OfferingJson): ScheduleData => {
    const subjects: Subject[] = json.data.materias.map(m => {
        const subjectId = uuidv4();
        const groups: CourseGroup[] = m.grupos.map(g => ({
            id: uuidv4(),
            subjectId: subjectId,
            subjectName: m.nombre,
            groupCode: g.claveGrupo,
            professorIds: [],
            professorNames: [g.docente.trim()],
            schedule: g.horario.map(h => ({
                day: dayMap[h.dia] || 'L',
                startTime: parseTime(h.inicio),
                endTime: parseTime(h.fin),
                classroom: h.claveAula
            }))
        }));

        return {
            id: subjectId,
            code: m.claveMateria,
            name: m.nombre,
            credits: m.creditos,
            hours: m.horas,
            classification: m.clasificacion as any,
            groups
        };
    });

    return {
        subjects,
        selectedGroups: [] // For an offering, we don't pre-select anything by default, or we can auto-select first ones
    };
};
