export type DayOfWeek = 'L' | 'M' | 'I' | 'J' | 'V' | 'S';

export interface TimeSlot {
  day: DayOfWeek;
  startTime: number; // Minutes from 00:00
  endTime: number;   // Minutes from 00:00
  classroom?: string;
}

export interface CourseGroup {
  id: string;             // Unique ID (UUID)
  subjectId: string;      // Link to Subject
  subjectName: string;    // Denormalized for UI
  groupCode: string;      // e.g., "001", "002"
  professorIds: string[]; // Link to Professor dataset
  professorNames: string[]; // Denormalized name
  schedule: TimeSlot[];
}

export interface Subject {
  id: string;
  code: string; // Course code
  name: string;
  groups: CourseGroup[]; // All available options for this subject
  classification?: 'DISPONIBLE' | 'AVANCE' | 'CURSADA'; // Subject classification
  credits?: number; // Credit hours
  hours?: number; // Weekly hours
}

export interface ProfessorMetrics {
  id: string;
  name: string;
  globalScore: number;
  difficulty: number;
  takeAgainPercent: number;
  tags: string[];
  sentimentScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  trust: number;
}

// Result of the adaptation process
export interface ScheduleData {
  subjects: Subject[];
  // If we are loading a "selected" schedule, it might just be a list of selected groups
  selectedGroups?: CourseGroup[];
}
