import { TimeSlot, CourseGroup } from '../types/canonical';

export interface ConflictResult {
  hasConflict: boolean;
  conflictingGroupIds: string[];
}

/**
 * Comprueba si dos bloques de tiempo se solapan
 */
export const areSlotsOverlapping = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  if (slot1.day !== slot2.day) return false;

  // El solapamiento ocurre si el inicio de uno está antes del fin del otro 
  // Y el fin de uno está después del inicio del otro.
  return slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime;
};

/**
 * Comprueba si un grupo choca con un conjunto de grupos ya seleccionados
 */
export const checkGroupConflict = (
  newGroup: CourseGroup, 
  existingGroups: CourseGroup[]
): string[] => {
  const conflicts: string[] = [];

  for (const existing of existingGroups) {
    if (existing.id === newGroup.id) continue;

    // Comparar cada slot del nuevo grupo contra cada slot del existente
    const hasOverlap = newGroup.schedule.some(newSlot => 
      existing.schedule.some(existingSlot => areSlotsOverlapping(newSlot, existingSlot))
    );

    if (hasOverlap) {
      conflicts.push(existing.id);
    }
  }

  return conflicts;
};

/**
 * Encuentra todos los conflictos en un horario completo
 */
export const findAllConflicts = (groups: CourseGroup[]): Map<string, string[]> => {
  const conflictMap = new Map<string, string[]>();

  for (let i = 0; i < groups.length; i++) {
    const groupA = groups[i];
    const groupConflicts: string[] = [];

    for (let j = 0; j < groups.length; j++) {
      if (i === j) continue;
      const groupB = groups[j];

      const hasOverlap = groupA.schedule.some(slotA => 
        groupB.schedule.some(slotB => areSlotsOverlapping(slotA, slotB))
      );

      if (hasOverlap) {
        groupConflicts.push(groupB.id);
      }
    }

    if (groupConflicts.length > 0) {
      conflictMap.set(groupA.id, groupConflicts);
    }
  }

  return conflictMap;
};
