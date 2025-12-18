import { CourseGroup, DayOfWeek, ScheduleData, Subject, TimeSlot } from '../types/canonical';
import { v4 as uuidv4 } from 'uuid';

// Type for the raw input (matches the mock JSON structure)
export interface RawCourseEntry {
  clave: string;
  materia: string;
  grupo: string;
  profesor: string;
  lunes: string;
  martes: string;
  miercoles: string;
  jueves: string;
  viernes: string;
  sabado: string;
  aula: string;
}

const parseTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const parseScheduleString = (day: DayOfWeek, timeRangeStr: string, classroom: string): TimeSlot | null => {
  if (!timeRangeStr || timeRangeStr.trim() === '') return null;

  try {
    const [start, end] = timeRangeStr.split('-');
    return {
      day,
      startTime: parseTime(start),
      endTime: parseTime(end),
      classroom
    };
  } catch (e) {
    console.error(`Error parsing time range: ${timeRangeStr}`, e);
    return null;
  }
};

export const adaptRawScheduleToCanonical = (rawData: RawCourseEntry[]): ScheduleData => {
  const subjectsMap = new Map<string, Subject>();
  const allGroups: CourseGroup[] = [];

  rawData.forEach((entry) => {
    // 1. Parse Schedule
    const schedule: TimeSlot[] = [];
    const days: { key: keyof RawCourseEntry; id: DayOfWeek }[] = [
      { key: 'lunes', id: 'L' },
      { key: 'martes', id: 'M' },
      { key: 'miercoles', id: 'I' },
      { key: 'jueves', id: 'J' },
      { key: 'viernes', id: 'V' },
      { key: 'sabado', id: 'S' },
    ];

    days.forEach(({ key, id }) => {
      const timeStr = entry[key] as string;
      const slot = parseScheduleString(id, timeStr, entry.aula);
      if (slot) schedule.push(slot);
    });

    // 2. Create or Get Subject
    let subject = subjectsMap.get(entry.clave);
    if (!subject) {
      subject = {
        id: uuidv4(),
        code: entry.clave,
        name: entry.materia,
        groups: [],
      };
      subjectsMap.set(entry.clave, subject);
    }

    // 3. Create Group
    const group: CourseGroup = {
      id: uuidv4(),
      subjectId: subject.id,
      subjectName: subject.name,
      groupCode: entry.grupo,
      professorIds: [], // We will link this later with the Professor Repo
      professorNames: [entry.profesor], // Keep the raw name for now
      schedule,
    };

    subject.groups.push(group);
    allGroups.push(group);
  });

  return {
    subjects: Array.from(subjectsMap.values()),
    selectedGroups: allGroups, // Since this is a "loaded schedule", all entries are implicitly selected
  };
};
