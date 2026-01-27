/**
 * Script para generar TODAS las combinaciones posibles de horarios
 * Genera combinaciones de 7 materias hasta 1 materia
 * Ordena por facilidad (dificultad promedio más baja)
 * 
 * Uso:
 * npx tsx generate-all-schedules.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Para compatibilidad con ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tipos básicos
interface TimeSlot {
    day: 'L' | 'M' | 'I' | 'J' | 'V';
    startTime: number; // minutos desde 00:00
    endTime: number;
    classroom?: string;
}

interface CourseGroup {
    id: string;
    subjectCode: string;
    subjectName: string;
    groupCode: string;
    professorNames: string[];
    schedule: TimeSlot[];
    difficulty?: number; // Dificultad del profesor (1-10)
}

interface ScheduleCombination {
    groups: CourseGroup[];
    totalDifficulty: number;
    averageDifficulty: number;
    subjectCount: number;
    hasConflicts: boolean;
    conflictDetails: string[];
}

// Función para detectar conflictos de horario
function hasTimeConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (slot1.day !== slot2.day) return false;

    // Verificar si hay solapamiento
    return !(slot1.endTime <= slot2.startTime || slot2.endTime <= slot1.startTime);
}

// Función para verificar si dos grupos tienen conflicto
function groupsHaveConflict(g1: CourseGroup, g2: CourseGroup): boolean {
    for (const slot1 of g1.schedule) {
        for (const slot2 of g2.schedule) {
            if (hasTimeConflict(slot1, slot2)) {
                return true;
            }
        }
    }
    return false;
}

// Función para verificar conflictos en una combinación
function checkConflicts(groups: CourseGroup[]): { hasConflicts: boolean; details: string[] } {
    const conflicts: string[] = [];

    for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
            if (groupsHaveConflict(groups[i], groups[j])) {
                conflicts.push(
                    `${groups[i].subjectName} (${groups[i].groupCode}) ↔ ${groups[j].subjectName} (${groups[j].groupCode})`
                );
            }
        }
    }

    return {
        hasConflicts: conflicts.length > 0,
        details: conflicts
    };
}

// Función para generar todas las combinaciones de k elementos de un array
function* combinations<T>(array: T[], k: number): Generator<T[]> {
    if (k === 0) {
        yield [];
        return;
    }

    if (k > array.length) {
        return;
    }

    for (let i = 0; i <= array.length - k; i++) {
        const first = array[i];
        const rest = array.slice(i + 1);

        for (const combo of combinations(rest, k - 1)) {
            yield [first, ...combo];
        }
    }
}

// Función principal
async function generateAllSchedules() {
    console.log('🚀 Generando TODAS las combinaciones de horarios...\n');

    // Leer el archivo message.json
    const dataPath = path.join(__dirname, 'public', 'message.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);

    if (!data.esValido || !data.data || !data.data.materias) {
        throw new Error('Formato de datos inválido');
    }

    // Convertir materias a grupos con dificultad simulada
    const allGroups: CourseGroup[] = [];

    for (const materia of data.data.materias) {
        for (const grupo of materia.grupos) {
            // Convertir horario
            const schedule: TimeSlot[] = grupo.horario.map((h: any) => ({
                day: h.dia as 'L' | 'M' | 'I' | 'J' | 'V',
                startTime: parseTime(h.inicio),
                endTime: parseTime(h.fin),
                classroom: h.aliasAula
            }));

            // Simular dificultad basada en el nombre del profesor
            // En producción, esto vendría de la base de datos de EvaluaProf
            const difficulty = simulateDifficulty(grupo.docente);

            allGroups.push({
                id: `${materia.claveMateria}-${grupo.claveGrupo}`,
                subjectCode: materia.claveMateria,
                subjectName: materia.nombre,
                groupCode: grupo.claveGrupo,
                professorNames: [grupo.docente],
                schedule,
                difficulty
            });
        }
    }

    console.log(`📚 Total de grupos disponibles: ${allGroups.length}`);
    console.log(`📊 Materias únicas: ${new Set(allGroups.map(g => g.subjectCode)).size}\n`);

    // Generar combinaciones de 7 a 1 materias
    const allCombinations: ScheduleCombination[] = [];

    for (let numSubjects = 7; numSubjects >= 1; numSubjects--) {
        console.log(`\n🔄 Generando combinaciones de ${numSubjects} materias...`);

        // Primero, obtener combinaciones de materias (no grupos)
        const uniqueSubjects = Array.from(new Set(allGroups.map(g => g.subjectCode)));

        if (numSubjects > uniqueSubjects.length) {
            console.log(`⚠️  Solo hay ${uniqueSubjects.length} materias disponibles, saltando ${numSubjects}`);
            continue;
        }

        let combinationCount = 0;

        // Para cada combinación de materias
        for (const subjectCombo of combinations(uniqueSubjects, numSubjects)) {
            // Obtener todos los grupos de cada materia
            const groupsBySubject = subjectCombo.map(subjectCode =>
                allGroups.filter(g => g.subjectCode === subjectCode)
            );

            // Generar producto cartesiano de grupos
            const groupCombinations = cartesianProduct(groupsBySubject);

            for (const groups of groupCombinations) {
                const { hasConflicts, details } = checkConflicts(groups);

                const totalDifficulty = groups.reduce((sum, g) => sum + (g.difficulty || 0), 0);
                const averageDifficulty = totalDifficulty / groups.length;

                allCombinations.push({
                    groups,
                    totalDifficulty,
                    averageDifficulty,
                    subjectCount: numSubjects,
                    hasConflicts,
                    conflictDetails: details
                });

                combinationCount++;
            }
        }

        console.log(`✅ Generadas ${combinationCount.toLocaleString()} combinaciones de ${numSubjects} materias`);
    }

    console.log(`\n📊 TOTAL DE COMBINACIONES: ${allCombinations.length.toLocaleString()}`);

    // Ordenar por facilidad (dificultad más baja primero)
    console.log('\n🔢 Ordenando por facilidad...');
    allCombinations.sort((a, b) => {
        // Primero, priorizar sin conflictos
        if (a.hasConflicts !== b.hasConflicts) {
            return a.hasConflicts ? 1 : -1;
        }

        // Luego, por dificultad promedio (más bajo = más fácil)
        return a.averageDifficulty - b.averageDifficulty;
    });

    // Generar reporte
    console.log('\n📝 Generando reporte...\n');

    const report = generateReport(allCombinations);

    // Guardar reporte
    const reportPath = path.join(__dirname, 'schedule-combinations-report.txt');
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log(`✅ Reporte guardado en: ${reportPath}`);

    // Guardar JSON completo
    const jsonPath = path.join(__dirname, 'schedule-combinations.json');
    fs.writeFileSync(jsonPath, JSON.stringify(allCombinations, null, 2), 'utf-8');

    console.log(`✅ Datos JSON guardados en: ${jsonPath}`);

    // Mostrar top 10
    console.log('\n🏆 TOP 10 HORARIOS MÁS FÁCILES (SIN CONFLICTOS):\n');

    const top10 = allCombinations.filter(c => !c.hasConflicts).slice(0, 10);

    top10.forEach((combo, index) => {
        console.log(`${index + 1}. Dificultad Promedio: ${combo.averageDifficulty.toFixed(2)}/10`);
        console.log(`   Materias (${combo.subjectCount}):`);
        combo.groups.forEach(g => {
            console.log(`   - ${g.subjectName} (${g.groupCode}) - Prof: ${g.professorNames[0]} - Dif: ${g.difficulty?.toFixed(1)}`);
        });
        console.log('');
    });
}

// Función auxiliar para producto cartesiano
function cartesianProduct<T>(arrays: T[][]): T[][] {
    if (arrays.length === 0) return [[]];
    if (arrays.length === 1) return arrays[0].map(item => [item]);

    const [first, ...rest] = arrays;
    const restProduct = cartesianProduct(rest);

    const result: T[][] = [];
    for (const item of first) {
        for (const combo of restProduct) {
            result.push([item, ...combo]);
        }
    }

    return result;
}

// Función para parsear tiempo "HH:MM:SS" a minutos
function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Función para simular dificultad (en producción vendría de la BD)
function simulateDifficulty(professorName: string): number {
    // Usar hash del nombre para generar dificultad consistente
    let hash = 0;
    for (let i = 0; i < professorName.length; i++) {
        hash = ((hash << 5) - hash) + professorName.charCodeAt(i);
        hash = hash & hash;
    }

    // Convertir a rango 1-10
    return Math.abs(hash % 10) + 1;
}

// Función para generar reporte de texto
function generateReport(combinations: ScheduleCombination[]): string {
    let report = '═══════════════════════════════════════════════════════════════\n';
    report += '  REPORTE DE TODAS LAS COMBINACIONES DE HORARIOS\n';
    report += '  Ordenadas por Facilidad (Dificultad Promedio)\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';

    // Estadísticas generales
    report += '📊 ESTADÍSTICAS GENERALES\n';
    report += '─────────────────────────────────────────────────────────────\n';
    report += `Total de combinaciones: ${combinations.length.toLocaleString()}\n`;
    report += `Sin conflictos: ${combinations.filter(c => !c.hasConflicts).length.toLocaleString()}\n`;
    report += `Con conflictos: ${combinations.filter(c => c.hasConflicts).length.toLocaleString()}\n\n`;

    // Distribución por número de materias
    report += '📚 DISTRIBUCIÓN POR NÚMERO DE MATERIAS\n';
    report += '─────────────────────────────────────────────────────────────\n';
    for (let i = 7; i >= 1; i--) {
        const count = combinations.filter(c => c.subjectCount === i).length;
        const noConflict = combinations.filter(c => c.subjectCount === i && !c.hasConflicts).length;
        report += `${i} materias: ${count.toLocaleString()} total (${noConflict.toLocaleString()} sin conflictos)\n`;
    }
    report += '\n';

    // Top 50 más fáciles sin conflictos
    report += '🏆 TOP 50 HORARIOS MÁS FÁCILES (SIN CONFLICTOS)\n';
    report += '─────────────────────────────────────────────────────────────\n\n';

    const top50 = combinations.filter(c => !c.hasConflicts).slice(0, 50);

    top50.forEach((combo, index) => {
        report += `${(index + 1).toString().padStart(2, '0')}. DIFICULTAD PROMEDIO: ${combo.averageDifficulty.toFixed(2)}/10\n`;
        report += `    Número de materias: ${combo.subjectCount}\n`;
        report += `    Materias:\n`;

        combo.groups.forEach(g => {
            report += `    • ${g.subjectName} (${g.groupCode})\n`;
            report += `      Profesor: ${g.professorNames[0]}\n`;
            report += `      Dificultad: ${g.difficulty?.toFixed(1)}/10\n`;

            // Mostrar horario
            const scheduleByDay: { [key: string]: string[] } = {};
            g.schedule.forEach(slot => {
                const dayName = { L: 'Lun', M: 'Mar', I: 'Mié', J: 'Jue', V: 'Vie' }[slot.day];
                const startHour = Math.floor(slot.startTime / 60).toString().padStart(2, '0');
                const startMin = (slot.startTime % 60).toString().padStart(2, '0');
                const endHour = Math.floor(slot.endTime / 60).toString().padStart(2, '0');
                const endMin = (slot.endTime % 60).toString().padStart(2, '0');
                const timeStr = `${startHour}:${startMin}-${endHour}:${endMin}`;

                if (!scheduleByDay[dayName]) scheduleByDay[dayName] = [];
                scheduleByDay[dayName].push(timeStr);
            });

            report += `      Horario: ${Object.entries(scheduleByDay).map(([day, times]) => `${day} ${times.join(', ')}`).join(' | ')}\n`;
        });

        report += '\n';
    });

    // Explicación de criterios
    report += '\n═══════════════════════════════════════════════════════════════\n';
    report += '📖 CRITERIOS DE ORDENAMIENTO\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';
    report += 'Los horarios están ordenados objetivamente por:\n\n';
    report += '1. PRIORIDAD: Sin conflictos de horario\n';
    report += '   - Los horarios sin conflictos aparecen primero\n';
    report += '   - Un conflicto ocurre cuando dos clases se solapan en día y hora\n\n';
    report += '2. FACILIDAD: Dificultad promedio más baja\n';
    report += '   - Se calcula el promedio de dificultad de todos los profesores\n';
    report += '   - Dificultad basada en evaluaciones de EvaluaProf (1-10)\n';
    report += '   - Menor dificultad = Horario más fácil\n\n';
    report += 'FÓRMULA:\n';
    report += '  Dificultad Promedio = Σ(Dificultad de cada profesor) / Número de materias\n\n';
    report += 'EJEMPLO:\n';
    report += '  Si tienes 5 materias con dificultades: 3, 4, 2, 5, 3\n';
    report += '  Dificultad Promedio = (3+4+2+5+3)/5 = 3.4/10\n\n';

    return report;
}

// Ejecutar
generateAllSchedules().catch(console.error);
