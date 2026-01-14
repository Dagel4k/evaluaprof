import { CourseGroup, DayOfWeek, ScheduleData, Subject, TimeSlot } from '../types/canonical';
import { v4 as uuidv4 } from 'uuid';

// ===== Interfaces para el formato real del portal universitario =====

interface HorarioSlot {
  claveGrupo: string;
  idHorarioGrupo: number;
  claveEdificio: string;
  aliasEdificio: string;
  claveAula: string;
  aliasAula: string;
  nombreAula: string;
  dia: string; // "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"
  inicio: string; // "HH:MM:SS"
  fin: string; // "HH:MM:SS"
}

interface Grupo {
  claveMateria: string;
  claveGrupo: string;
  idSubPlantel: number;
  claveEspecialidad: string;
  docente: string;
  horaInicio: string;
  horaFin: string;
  claveAula: string;
  claveEdificio: string;
  clavePlan: string;
  estatus: string;
  limite: number;
  inscritos: number;
  lleno: boolean;
  paquete: string;
  horario: HorarioSlot[];
}

interface Materia {
  claveMateria: string;
  claveRequisito: string;
  tipoRequisito: string;
  nombre: string;
  aliasMateria: string;
  creditos: number;
  horas: number;
  clasificacion: string; // "DISPONIBLE", "AVANCE", etc.
  grupos: Grupo[];
}

interface CargaDisponibleData {
  clavePeriodo: string;
  clavePlantel: string;
  numeroControl: string;
  idCarreraAlumno: number;
  materias: Materia[];
}

export interface CargaDisponible {
  esValido: boolean;
  data: CargaDisponibleData;
}

// ===== Funciones de conversión =====

/**
 * Convierte un string de tiempo "HH:MM:SS" a minutos desde medianoche
 */
const parseTimeToMinutes = (timeStr: string): number => {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
};

/**
 * Mapea los días en español a los códigos usados en la aplicación
 */
const mapDayToDayOfWeek = (dia: string): DayOfWeek | null => {
  const dayMap: Record<string, DayOfWeek> = {
    'LUN': 'L',
    'MAR': 'M',
    'MIE': 'I',
    'MIER': 'I', // Variante
    'JUE': 'J',
    'VIE': 'V',
    'SAB': 'S',
  };

  return dayMap[dia.toUpperCase()] || null;
};

/**
 * Convierte el formato CargaDisponible al formato canónico de la aplicación
 */
export const adaptCargaDisponibleToCanonical = (cargaData: CargaDisponible): ScheduleData => {
  if (!cargaData.esValido || !cargaData.data || !cargaData.data.materias) {
    console.warn('Datos de carga no válidos');
    return { subjects: [] };
  }

  const subjects: Subject[] = [];

  cargaData.data.materias.forEach((materia) => {
    // Crear el Subject
    const subject: Subject = {
      id: uuidv4(),
      code: materia.claveMateria,
      name: materia.nombre || materia.aliasMateria,
      groups: [],
      classification: materia.clasificacion as 'DISPONIBLE' | 'AVANCE' | 'CURSADA',
      credits: materia.creditos,
      hours: materia.horas,
    };

    // Procesar cada grupo de la materia
    materia.grupos.forEach((grupo) => {
      // Convertir horarios individuales a TimeSlots
      const schedule: TimeSlot[] = [];

      grupo.horario.forEach((slot) => {
        const day = mapDayToDayOfWeek(slot.dia);
        if (day) {
          const timeSlot: TimeSlot = {
            day,
            startTime: parseTimeToMinutes(slot.inicio),
            endTime: parseTimeToMinutes(slot.fin),
            classroom: slot.aliasAula || slot.claveAula,
          };
          schedule.push(timeSlot);
        }
      });

      // Limpiar nombre del docente (remover espacios extras y detectar nombres vacíos)
      const cleanedName = grupo.docente?.trim().replace(/\s+/g, ' ') || '';
      const professorName = cleanedName.length > 0 ? cleanedName : '';

      // Crear el CourseGroup
      const courseGroup: CourseGroup = {
        id: uuidv4(),
        subjectId: subject.id,
        subjectName: subject.name,
        groupCode: grupo.claveGrupo,
        professorIds: [], // Se enlazará después con el repositorio de profesores
        professorNames: professorName ? [professorName] : [],
        schedule,
      };

      subject.groups.push(courseGroup);
    });

    // Solo agregar materias que tengan grupos
    if (subject.groups.length > 0) {
      subjects.push(subject);
    }
  });

  return {
    subjects,
  };
};

/**
 * Detecta si un JSON es del formato CargaDisponible
 */
export const isCargaDisponibleFormat = (data: any): data is CargaDisponible => {
  return (
    data &&
    typeof data === 'object' &&
    'esValido' in data &&
    'data' in data &&
    data.data &&
    'materias' in data.data &&
    Array.isArray(data.data.materias)
  );
};
