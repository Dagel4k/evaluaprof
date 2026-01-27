/**
 * Script para generar combinaciones de horarios
 * INCLUYE SÍ O SÍ TODAS LAS MATERIAS OBLIGATORIAS (clasificación DISPONIBLE)
 * Genera combinaciones de 7 a 1 materias
 * Ordena por facilidad (dificultad promedio más baja)
 * 
 * Uso:
 * npx tsx generate-required-schedules.ts [top_n]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOP_N = parseInt(process.argv[2] || '500');

interface TimeSlot {
    day: 'L' | 'M' | 'I' | 'J' | 'V';
    startTime: number;
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
    difficulty?: number;
    isRequired: boolean; // Nueva propiedad para identificar obligatorias
}

interface ScheduleCombination {
    groups: CourseGroup[];
    totalDifficulty: number;
    averageDifficulty: number;
    subjectCount: number;
    requiredCount: number; // Número de materias obligatorias
    optionalCount: number; // Número de materias opcionales
    hasConflicts: boolean;
    conflictDetails: string[];
}

class TopNHeap {
    private heap: ScheduleCombination[] = [];
    private maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    add(combo: ScheduleCombination) {
        if (this.heap.length < this.maxSize) {
            this.heap.push(combo);
            if (this.heap.length === this.maxSize) {
                this.heap.sort(this.compare);
            }
        } else {
            if (this.compare(combo, this.heap[this.heap.length - 1]) < 0) {
                this.heap[this.heap.length - 1] = combo;
                this.heap.sort(this.compare);
            }
        }
    }

    private compare(a: ScheduleCombination, b: ScheduleCombination): number {
        if (a.hasConflicts !== b.hasConflicts) {
            return a.hasConflicts ? 1 : -1;
        }
        return a.averageDifficulty - b.averageDifficulty;
    }

    getAll(): ScheduleCombination[] {
        return [...this.heap].sort(this.compare);
    }

    size(): number {
        return this.heap.length;
    }
}

function hasTimeConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (slot1.day !== slot2.day) return false;
    return !(slot1.endTime <= slot2.startTime || slot2.endTime <= slot1.startTime);
}

function groupsHaveConflict(g1: CourseGroup, g2: CourseGroup): boolean {
    for (const slot1 of g1.schedule) {
        for (const slot2 of g2.schedule) {
            if (hasTimeConflict(slot1, slot2)) return true;
        }
    }
    return false;
}

function checkConflicts(groups: CourseGroup[]): { hasConflicts: boolean; details: string[] } {
    const conflicts: string[] = [];
    for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
            if (groupsHaveConflict(groups[i], groups[j])) {
                conflicts.push(`${groups[i].subjectName} ↔ ${groups[j].subjectName}`);
            }
        }
    }
    return { hasConflicts: conflicts.length > 0, details: conflicts };
}

function* combinations<T>(array: T[], k: number): Generator<T[]> {
    if (k === 0) {
        yield [];
        return;
    }
    if (k > array.length) return;

    for (let i = 0; i <= array.length - k; i++) {
        for (const combo of combinations(array.slice(i + 1), k - 1)) {
            yield [array[i], ...combo];
        }
    }
}

function* cartesianProduct<T>(arrays: T[][]): Generator<T[]> {
    if (arrays.length === 0) {
        yield [];
        return;
    }

    const indices = new Array(arrays.length).fill(0);

    while (true) {
        const result: T[] = [];
        for (let i = 0; i < arrays.length; i++) {
            result.push(arrays[i][indices[i]]);
        }
        yield result;

        let pos = arrays.length - 1;
        while (pos >= 0) {
            indices[pos]++;
            if (indices[pos] < arrays[pos].length) {
                break;
            }
            indices[pos] = 0;
            pos--;
        }

        if (pos < 0) break;
    }
}

function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function simulateDifficulty(professorName: string): number {
    let hash = 0;
    for (let i = 0; i < professorName.length; i++) {
        hash = ((hash << 5) - hash) + professorName.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash % 10) + 1;
}

async function generateRequiredSchedules() {
    console.log(`🚀 Generando las MEJORES ${TOP_N.toLocaleString()} combinaciones`);
    console.log(`✅ INCLUYE SÍ O SÍ TODAS LAS MATERIAS OBLIGATORIAS\n`);

    const dataPath = path.join(__dirname, 'public', 'message.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);

    if (!data.esValido || !data.data || !data.data.materias) {
        throw new Error('Formato de datos inválido');
    }

    // Separar grupos por tipo
    const requiredGroups: CourseGroup[] = [];
    const optionalGroups: CourseGroup[] = [];

    for (const materia of data.data.materias) {
        const isRequired = materia.clasificacion === 'DISPONIBLE';

        for (const grupo of materia.grupos) {
            const schedule: TimeSlot[] = grupo.horario.map((h: any) => ({
                day: h.dia as 'L' | 'M' | 'I' | 'J' | 'V',
                startTime: parseTime(h.inicio),
                endTime: parseTime(h.fin),
                classroom: h.aliasAula
            }));

            const difficulty = simulateDifficulty(grupo.docente);

            const courseGroup: CourseGroup = {
                id: `${materia.claveMateria}-${grupo.claveGrupo}`,
                subjectCode: materia.claveMateria,
                subjectName: materia.nombre,
                groupCode: grupo.claveGrupo,
                professorNames: [grupo.docente],
                schedule,
                difficulty,
                isRequired
            };

            if (isRequired) {
                requiredGroups.push(courseGroup);
            } else {
                optionalGroups.push(courseGroup);
            }
        }
    }

    const requiredSubjects = Array.from(new Set(requiredGroups.map(g => g.subjectCode)));
    const optionalSubjects = Array.from(new Set(optionalGroups.map(g => g.subjectCode)));

    console.log(`📚 Materias OBLIGATORIAS: ${requiredSubjects.length}`);
    requiredSubjects.forEach(code => {
        const name = requiredGroups.find(g => g.subjectCode === code)?.subjectName;
        const groupCount = requiredGroups.filter(g => g.subjectCode === code).length;
        console.log(`   • ${name} (${groupCount} grupos)`);
    });

    console.log(`\n📚 Materias OPCIONALES: ${optionalSubjects.length}`);
    optionalSubjects.forEach(code => {
        const name = optionalGroups.find(g => g.subjectCode === code)?.subjectName;
        const groupCount = optionalGroups.filter(g => g.subjectCode === code).length;
        console.log(`   • ${name} (${groupCount} grupos)`);
    });

    const topHeap = new TopNHeap(TOP_N);
    let totalProcessed = 0;

    // Generar combinaciones de 7 a 12 materias
    // SIEMPRE incluyendo TODAS las 6 materias obligatorias
    for (let totalSubjects = 7; totalSubjects <= 12; totalSubjects++) {
        // Calcular cuántas materias opcionales podemos agregar
        const numOptional = totalSubjects - requiredSubjects.length;

        if (numOptional < 0) {
            console.log(`\n⚠️  No se puede generar horario de ${totalSubjects} materias (hay ${requiredSubjects.length} obligatorias)`);
            continue;
        }

        if (numOptional > optionalSubjects.length) {
            console.log(`\n⚠️  Solo hay ${optionalSubjects.length} materias opcionales, no se puede llegar a ${totalSubjects} materias`);
            continue;
        }

        console.log(`\n🔄 Generando horarios de ${totalSubjects} materias (${requiredSubjects.length} obligatorias + ${numOptional} opcionales)...`);

        let count = 0;
        const startTime = Date.now();

        // Si numOptional es 0, solo generar combinaciones de las obligatorias
        if (numOptional === 0) {
            // Producto cartesiano de grupos de materias obligatorias
            const requiredGroupsBySubject = requiredSubjects.map(code =>
                requiredGroups.filter(g => g.subjectCode === code)
            );

            for (const groups of cartesianProduct(requiredGroupsBySubject)) {
                const { hasConflicts, details } = checkConflicts(groups);
                const totalDifficulty = groups.reduce((sum, g) => sum + (g.difficulty || 0), 0);
                const averageDifficulty = totalDifficulty / groups.length;

                topHeap.add({
                    groups,
                    totalDifficulty,
                    averageDifficulty,
                    subjectCount: totalSubjects,
                    requiredCount: requiredSubjects.length,
                    optionalCount: 0,
                    hasConflicts,
                    conflictDetails: details
                });

                count++;
                totalProcessed++;

                if (count % 100000 === 0) {
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                    console.log(`  Procesadas ${count.toLocaleString()} (${elapsed}s)`);
                }
            }
        } else {
            // Generar combinaciones de materias opcionales
            for (const optionalCombo of combinations(optionalSubjects, numOptional)) {
                // Combinar con todas las materias obligatorias
                const allSubjects = [...requiredSubjects, ...optionalCombo];

                // Obtener grupos de cada materia
                const groupsBySubject = allSubjects.map(code => {
                    const isReq = requiredSubjects.includes(code);
                    return isReq
                        ? requiredGroups.filter(g => g.subjectCode === code)
                        : optionalGroups.filter(g => g.subjectCode === code);
                });

                // Producto cartesiano de grupos
                for (const groups of cartesianProduct(groupsBySubject)) {
                    const { hasConflicts, details } = checkConflicts(groups);
                    const totalDifficulty = groups.reduce((sum, g) => sum + (g.difficulty || 0), 0);
                    const averageDifficulty = totalDifficulty / groups.length;

                    topHeap.add({
                        groups,
                        totalDifficulty,
                        averageDifficulty,
                        subjectCount: totalSubjects,
                        requiredCount: requiredSubjects.length,
                        optionalCount: numOptional,
                        hasConflicts,
                        conflictDetails: details
                    });

                    count++;
                    totalProcessed++;

                    if (count % 100000 === 0) {
                        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                        console.log(`  Procesadas ${count.toLocaleString()} (${elapsed}s)`);
                    }
                }
            }
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ ${count.toLocaleString()} combinaciones en ${elapsed}s`);
    }

    console.log(`\n📊 TOTAL PROCESADAS: ${totalProcessed.toLocaleString()}`);
    console.log(`💾 Mejores ${topHeap.size()} guardadas\n`);

    const bestCombinations = topHeap.getAll();

    console.log('📝 Generando reporte...\n');
    const report = generateReport(bestCombinations, totalProcessed, requiredSubjects.length);

    const reportPath = path.join(__dirname, 'required-schedules-report.txt');
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`✅ Reporte: ${reportPath}`);

    const jsonPath = path.join(__dirname, 'required-schedules.json');
    fs.writeFileSync(jsonPath, JSON.stringify(bestCombinations, null, 2), 'utf-8');
    console.log(`✅ JSON: ${jsonPath}`);

    console.log('\n🏆 TOP 10 HORARIOS MÁS FÁCILES (SIN CONFLICTOS):\n');
    const top10 = bestCombinations.filter(c => !c.hasConflicts).slice(0, 10);

    top10.forEach((combo, index) => {
        console.log(`${index + 1}. Dificultad: ${combo.averageDifficulty.toFixed(2)}/10`);
        console.log(`   Materias: ${combo.subjectCount} (${combo.requiredCount} obligatorias + ${combo.optionalCount} opcionales)`);
        combo.groups.forEach(g => {
            const type = g.isRequired ? '✅ OBLIGATORIA' : '📘 OPCIONAL';
            console.log(`   ${type}: ${g.subjectName} (${g.groupCode})`);
            console.log(`      ${g.professorNames[0]} - Dif: ${g.difficulty?.toFixed(1)}`);
        });
        console.log('');
    });
}

function generateReport(combinations: ScheduleCombination[], totalProcessed: number, requiredCount: number): string {
    let report = '═══════════════════════════════════════════════════════════════\n';
    report += `  TOP ${combinations.length} MEJORES COMBINACIONES\n`;
    report += '  ✅ INCLUYE SÍ O SÍ TODAS LAS MATERIAS OBLIGATORIAS\n';
    report += '  Ordenadas por Facilidad (Dificultad Promedio)\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';

    report += '📊 ESTADÍSTICAS\n';
    report += '─────────────────────────────────────────────────────────────\n';
    report += `Total procesadas: ${totalProcessed.toLocaleString()}\n`;
    report += `Mejores guardadas: ${combinations.length}\n`;
    report += `Materias obligatorias: ${requiredCount}\n`;
    report += `Sin conflictos: ${combinations.filter(c => !c.hasConflicts).length}\n`;
    report += `Con conflictos: ${combinations.filter(c => c.hasConflicts).length}\n\n`;

    report += '📚 DISTRIBUCIÓN POR MATERIAS\n';
    report += '─────────────────────────────────────────────────────────────\n';
    for (let i = 12; i >= 7; i--) {
        const count = combinations.filter(c => c.subjectCount === i).length;
        const noConflict = combinations.filter(c => c.subjectCount === i && !c.hasConflicts).length;
        if (count > 0) {
            const sample = combinations.find(c => c.subjectCount === i);
            report += `${i} materias (${sample?.requiredCount} oblig. + ${sample?.optionalCount} opc.): ${count} (${noConflict} sin conflictos)\n`;
        }
    }
    report += '\n';

    report += '🏆 TOP 50 SIN CONFLICTOS\n';
    report += '─────────────────────────────────────────────────────────────\n\n';

    const top50 = combinations.filter(c => !c.hasConflicts).slice(0, 50);

    top50.forEach((combo, index) => {
        report += `${(index + 1).toString().padStart(2, '0')}. DIFICULTAD: ${combo.averageDifficulty.toFixed(2)}/10\n`;
        report += `    Total: ${combo.subjectCount} materias (${combo.requiredCount} obligatorias + ${combo.optionalCount} opcionales)\n\n`;

        // Primero las obligatorias
        const required = combo.groups.filter(g => g.isRequired);
        if (required.length > 0) {
            report += `    ✅ OBLIGATORIAS:\n`;
            required.forEach(g => {
                report += `    • ${g.subjectName} (${g.groupCode})\n`;
                report += `      ${g.professorNames[0]} - Dif: ${g.difficulty?.toFixed(1)}/10\n`;
            });
            report += '\n';
        }

        // Luego las opcionales
        const optional = combo.groups.filter(g => !g.isRequired);
        if (optional.length > 0) {
            report += `    📘 OPCIONALES:\n`;
            optional.forEach(g => {
                report += `    • ${g.subjectName} (${g.groupCode})\n`;
                report += `      ${g.professorNames[0]} - Dif: ${g.difficulty?.toFixed(1)}/10\n`;
            });
            report += '\n';
        }
    });

    report += '\n═══════════════════════════════════════════════════════════════\n';
    report += '📖 CRITERIOS OBJETIVOS\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';
    report += '✅ REGLA PRINCIPAL: Todas las combinaciones incluyen SÍ O SÍ\n';
    report += `   las ${requiredCount} materias OBLIGATORIAS (clasificación DISPONIBLE)\n\n`;
    report += '1. PRIORIDAD: Sin conflictos de horario\n';
    report += '   Los horarios sin solapamientos aparecen primero\n\n';
    report += '2. FACILIDAD: Dificultad promedio más baja\n';
    report += '   Promedio de dificultad de todos los profesores\n\n';
    report += 'FÓRMULA:\n';
    report += '  Dificultad Promedio = Σ(Dificultad profesor) / N materias\n\n';
    report += 'ESCALA:\n';
    report += '  1.0-3.0: Muy fácil ✅\n';
    report += '  3.1-5.0: Fácil 👍\n';
    report += '  5.1-7.0: Moderado ⚠️\n';
    report += '  7.1-9.0: Difícil 🔥\n';
    report += '  9.1-10.0: Muy difícil ❌\n\n';

    return report;
}

generateRequiredSchedules().catch(console.error);
