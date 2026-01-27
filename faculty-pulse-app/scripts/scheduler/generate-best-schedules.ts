/**
 * Script OPTIMIZADO para generar combinaciones de horarios
 * Genera combinaciones de 7 a 1 materias
 * Mantiene solo las TOP N mejores combinaciones en memoria
 * Ordena por facilidad (dificultad promedio más baja)
 * 
 * Uso:
 * npx tsx generate-best-schedules.ts [top_n]
 * Ejemplo: npx tsx generate-best-schedules.ts 1000
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Para compatibilidad con ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const TOP_N = parseInt(process.argv[2] || '500'); // Mantener solo las mejores N combinaciones

// Tipos básicos
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
}

interface ScheduleCombination {
    groups: CourseGroup[];
    totalDifficulty: number;
    averageDifficulty: number;
    subjectCount: number;
    hasConflicts: boolean;
    conflictDetails: string[];
}

// Clase para mantener solo las mejores N combinaciones
class TopNHeap {
    private heap: ScheduleCombination[] = [];
    private maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    add(combo: ScheduleCombination) {
        // Priorizar sin conflictos
        if (this.heap.length < this.maxSize) {
            this.heap.push(combo);
            if (this.heap.length === this.maxSize) {
                this.heap.sort(this.compare);
            }
        } else {
            // Solo agregar si es mejor que el peor en el heap
            if (this.compare(combo, this.heap[this.heap.length - 1]) < 0) {
                this.heap[this.heap.length - 1] = combo;
                this.heap.sort(this.compare);
            }
        }
    }

    private compare(a: ScheduleCombination, b: ScheduleCombination): number {
        // Primero, sin conflictos
        if (a.hasConflicts !== b.hasConflicts) {
            return a.hasConflicts ? 1 : -1;
        }
        // Luego, por dificultad
        return a.averageDifficulty - b.averageDifficulty;
    }

    getAll(): ScheduleCombination[] {
        return [...this.heap].sort(this.compare);
    }

    size(): number {
        return this.heap.length;
    }
}

// Funciones de utilidad
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

    // Usar enfoque iterativo en lugar de recursivo
    const indices = new Array(arrays.length).fill(0);

    while (true) {
        // Generar combinación actual
        const result: T[] = [];
        for (let i = 0; i < arrays.length; i++) {
            result.push(arrays[i][indices[i]]);
        }
        yield result;

        // Incrementar índices
        let pos = arrays.length - 1;
        while (pos >= 0) {
            indices[pos]++;
            if (indices[pos] < arrays[pos].length) {
                break;
            }
            indices[pos] = 0;
            pos--;
        }

        // Si pos < 0, hemos terminado
        if (pos < 0) {
            break;
        }
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

// Función principal
async function generateBestSchedules() {
    console.log(`🚀 Generando las MEJORES ${TOP_N.toLocaleString()} combinaciones de horarios...\n`);

    const dataPath = path.join(__dirname, 'public', 'message.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);

    if (!data.esValido || !data.data || !data.data.materias) {
        throw new Error('Formato de datos inválido');
    }

    // Convertir materias a grupos
    const allGroups: CourseGroup[] = [];

    for (const materia of data.data.materias) {
        for (const grupo of materia.grupos) {
            const schedule: TimeSlot[] = grupo.horario.map((h: any) => ({
                day: h.dia as 'L' | 'M' | 'I' | 'J' | 'V',
                startTime: parseTime(h.inicio),
                endTime: parseTime(h.fin),
                classroom: h.aliasAula
            }));

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

    console.log(`📚 Total de grupos: ${allGroups.length}`);
    console.log(`📊 Materias únicas: ${new Set(allGroups.map(g => g.subjectCode)).size}\n`);

    const topHeap = new TopNHeap(TOP_N);
    let totalProcessed = 0;

    // Generar combinaciones de 7 a 1 materias
    for (let numSubjects = 7; numSubjects >= 1; numSubjects--) {
        console.log(`\n🔄 Procesando combinaciones de ${numSubjects} materias...`);

        const uniqueSubjects = Array.from(new Set(allGroups.map(g => g.subjectCode)));

        if (numSubjects > uniqueSubjects.length) {
            console.log(`⚠️  Solo hay ${uniqueSubjects.length} materias, saltando ${numSubjects}`);
            continue;
        }

        let count = 0;
        const startTime = Date.now();

        for (const subjectCombo of combinations(uniqueSubjects, numSubjects)) {
            const groupsBySubject = subjectCombo.map(sc =>
                allGroups.filter(g => g.subjectCode === sc)
            );

            for (const groups of cartesianProduct(groupsBySubject)) {
                const { hasConflicts, details } = checkConflicts(groups);
                const totalDifficulty = groups.reduce((sum, g) => sum + (g.difficulty || 0), 0);
                const averageDifficulty = totalDifficulty / groups.length;

                topHeap.add({
                    groups,
                    totalDifficulty,
                    averageDifficulty,
                    subjectCount: numSubjects,
                    hasConflicts,
                    conflictDetails: details
                });

                count++;
                totalProcessed++;

                // Mostrar progreso cada 100k
                if (count % 100000 === 0) {
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                    console.log(`  Procesadas ${count.toLocaleString()} (${elapsed}s)`);
                }
            }
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ ${count.toLocaleString()} combinaciones en ${elapsed}s`);
    }

    console.log(`\n📊 TOTAL PROCESADAS: ${totalProcessed.toLocaleString()}`);
    console.log(`💾 Mejores ${topHeap.size()} guardadas en memoria\n`);

    // Obtener resultados finales
    const bestCombinations = topHeap.getAll();

    // Generar reporte
    console.log('📝 Generando reporte...\n');
    const report = generateReport(bestCombinations, totalProcessed);

    const reportPath = path.join(__dirname, 'best-schedules-report.txt');
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`✅ Reporte: ${reportPath}`);

    const jsonPath = path.join(__dirname, 'best-schedules.json');
    fs.writeFileSync(jsonPath, JSON.stringify(bestCombinations, null, 2), 'utf-8');
    console.log(`✅ JSON: ${jsonPath}`);

    // Mostrar top 10
    console.log('\n🏆 TOP 10 HORARIOS MÁS FÁCILES (SIN CONFLICTOS):\n');
    const top10 = bestCombinations.filter(c => !c.hasConflicts).slice(0, 10);

    top10.forEach((combo, index) => {
        console.log(`${index + 1}. Dificultad: ${combo.averageDifficulty.toFixed(2)}/10 (${combo.subjectCount} materias)`);
        combo.groups.forEach(g => {
            console.log(`   • ${g.subjectName} (${g.groupCode}) - ${g.professorNames[0]} - Dif: ${g.difficulty?.toFixed(1)}`);
        });
        console.log('');
    });
}

function generateReport(combinations: ScheduleCombination[], totalProcessed: number): string {
    let report = '═══════════════════════════════════════════════════════════════\n';
    report += `  TOP ${combinations.length} MEJORES COMBINACIONES DE HORARIOS\n`;
    report += '  Ordenadas por Facilidad (Dificultad Promedio)\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';

    report += '📊 ESTADÍSTICAS\n';
    report += '─────────────────────────────────────────────────────────────\n';
    report += `Total procesadas: ${totalProcessed.toLocaleString()}\n`;
    report += `Mejores guardadas: ${combinations.length}\n`;
    report += `Sin conflictos: ${combinations.filter(c => !c.hasConflicts).length}\n`;
    report += `Con conflictos: ${combinations.filter(c => c.hasConflicts).length}\n\n`;

    report += '📚 DISTRIBUCIÓN POR MATERIAS\n';
    report += '─────────────────────────────────────────────────────────────\n';
    for (let i = 7; i >= 1; i--) {
        const count = combinations.filter(c => c.subjectCount === i).length;
        const noConflict = combinations.filter(c => c.subjectCount === i && !c.hasConflicts).length;
        if (count > 0) {
            report += `${i} materias: ${count} (${noConflict} sin conflictos)\n`;
        }
    }
    report += '\n';

    report += '🏆 TOP 50 SIN CONFLICTOS\n';
    report += '─────────────────────────────────────────────────────────────\n\n';

    const top50 = combinations.filter(c => !c.hasConflicts).slice(0, 50);

    top50.forEach((combo, index) => {
        report += `${(index + 1).toString().padStart(2, '0')}. DIFICULTAD: ${combo.averageDifficulty.toFixed(2)}/10 (${combo.subjectCount} materias)\n`;
        combo.groups.forEach(g => {
            report += `    • ${g.subjectName} (${g.groupCode})\n`;
            report += `      ${g.professorNames[0]} - Dif: ${g.difficulty?.toFixed(1)}/10\n`;
        });
        report += '\n';
    });

    report += '\n═══════════════════════════════════════════════════════════════\n';
    report += '📖 CRITERIOS DE ORDENAMIENTO OBJETIVOS\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';
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

generateBestSchedules().catch(console.error);
