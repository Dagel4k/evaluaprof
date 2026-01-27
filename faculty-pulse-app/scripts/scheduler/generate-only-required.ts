/**
 * Generador de combinaciones SOLO con las 6 materias OBLIGATORIAS
 * Genera PDF con tablas mostrando datos de cada profesor
 * 
 * Uso:
 * npx tsx generate-only-required.ts [top_n]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOP_N = parseInt(process.argv[2] || '100');

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
            if (indices[pos] < arrays[pos].length) break;
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

function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function simulateDifficulty(professorName: string): number {
    let hash = 0;
    for (let i = 0; i < professorName.length; i++) {
        hash = ((hash << 5) - hash) + professorName.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash % 10) + 1;
}

function getDayName(day: string): string {
    const days: { [key: string]: string } = {
        'L': 'Lun', 'M': 'Mar', 'I': 'Mié', 'J': 'Jue', 'V': 'Vie'
    };
    return days[day] || day;
}

async function generateOnlyRequired() {
    console.log(`🚀 Generando combinaciones SOLO con las 6 materias OBLIGATORIAS\n`);

    const dataPath = path.join(__dirname, 'public', 'message.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);

    if (!data.esValido || !data.data || !data.data.materias) {
        throw new Error('Formato de datos inválido');
    }

    // Obtener SOLO materias obligatorias
    const requiredGroups: CourseGroup[] = [];

    for (const materia of data.data.materias) {
        if (materia.clasificacion !== 'DISPONIBLE') continue;

        for (const grupo of materia.grupos) {
            const schedule: TimeSlot[] = grupo.horario.map((h: any) => ({
                day: h.dia as 'L' | 'M' | 'I' | 'J' | 'V',
                startTime: parseTime(h.inicio),
                endTime: parseTime(h.fin),
                classroom: h.aliasAula
            }));

            requiredGroups.push({
                id: `${materia.claveMateria}-${grupo.claveGrupo}`,
                subjectCode: materia.claveMateria,
                subjectName: materia.nombre,
                groupCode: grupo.claveGrupo,
                professorNames: [grupo.docente],
                schedule,
                difficulty: simulateDifficulty(grupo.docente)
            });
        }
    }

    const requiredSubjects = Array.from(new Set(requiredGroups.map(g => g.subjectCode)));

    console.log(`📚 Materias OBLIGATORIAS: ${requiredSubjects.length}`);
    requiredSubjects.forEach(code => {
        const name = requiredGroups.find(g => g.subjectCode === code)?.subjectName;
        const groupCount = requiredGroups.filter(g => g.subjectCode === code).length;
        console.log(`   • ${name} (${groupCount} grupos)`);
    });

    const topHeap = new TopNHeap(TOP_N);
    let totalProcessed = 0;

    console.log(`\n🔄 Generando combinaciones de las 6 materias obligatorias...\n`);

    const startTime = Date.now();
    const groupsBySubject = requiredSubjects.map(code =>
        requiredGroups.filter(g => g.subjectCode === code)
    );

    for (const groups of cartesianProduct(groupsBySubject)) {
        const { hasConflicts, details } = checkConflicts(groups);
        const totalDifficulty = groups.reduce((sum, g) => sum + (g.difficulty || 0), 0);
        const averageDifficulty = totalDifficulty / groups.length;

        topHeap.add({
            groups,
            totalDifficulty,
            averageDifficulty,
            hasConflicts,
            conflictDetails: details
        });

        totalProcessed++;

        if (totalProcessed % 1000 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            process.stdout.write(`\r  Procesadas ${totalProcessed.toLocaleString()} (${elapsed}s)`);
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ ${totalProcessed.toLocaleString()} combinaciones en ${elapsed}s`);
    console.log(`💾 Mejores ${topHeap.getAll().length} guardadas\n`);

    const bestCombinations = topHeap.getAll();
    const validCombinations = bestCombinations.filter(c => !c.hasConflicts);

    console.log(`✅ Sin conflictos: ${validCombinations.length}\n`);

    // Generar PDF
    await generatePDF(validCombinations.slice(0, 50));

    // Guardar JSON
    const jsonPath = path.join(__dirname, 'horarios-obligatorias.json');
    fs.writeFileSync(jsonPath, JSON.stringify(validCombinations, null, 2), 'utf-8');
    console.log(`✅ JSON: ${jsonPath}\n`);

    // Mostrar top 5
    console.log('🏆 TOP 5 HORARIOS MÁS FÁCILES:\n');
    validCombinations.slice(0, 5).forEach((combo, index) => {
        console.log(`${index + 1}. Dificultad Promedio: ${combo.averageDifficulty.toFixed(2)}/10`);
        combo.groups.forEach(g => {
            console.log(`   • ${g.subjectName} (${g.groupCode}) - ${g.professorNames[0]} - Dif: ${g.difficulty?.toFixed(1)}`);
        });
        console.log('');
    });
}

async function generatePDF(combinations: ScheduleCombination[]) {
    console.log('📄 Generando PDF con tablas...\n');

    const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    const outputPath = path.join(__dirname, 'horarios-obligatorias.pdf');
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Portada
    doc.fontSize(22).fillColor('#1e40af').text('Combinaciones de Horarios', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor('#64748b').text('6 Materias Obligatorias', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000000').text(`Top ${combinations.length} ordenadas por facilidad`, { align: 'center' });
    doc.moveDown(2);

    combinations.forEach((combo, index) => {
        if (index > 0) doc.addPage();

        // Encabezado
        doc.fontSize(18).fillColor('#1e40af').text(`Opción #${index + 1}`, 40, 40);
        doc.fontSize(12).fillColor('#000000').text(`Dificultad Promedio: ${combo.averageDifficulty.toFixed(2)}/10`, 40, 65);

        // Explicación
        doc.fontSize(10).fillColor('#374151');
        const reasons = [];
        const avgDiff = combo.averageDifficulty;
        if (avgDiff <= 3.0) reasons.push('Dificultad muy baja (≤3.0)');
        else if (avgDiff <= 5.0) reasons.push('Dificultad baja (≤5.0)');
        else reasons.push('Dificultad moderada');

        reasons.push(`Sin conflictos de horario`);
        reasons.push(`Promedio calculado: ${combo.groups.map(g => g.difficulty?.toFixed(1)).join(' + ')} / 6 = ${avgDiff.toFixed(2)}`);

        doc.text(`Por qué esta combinación: ${reasons.join('. ')}.`, 40, 85, { width: 532 });

        let yPos = 115;

        // Tabla para cada materia
        combo.groups.forEach((group, gIndex) => {
            if (yPos > 680) {
                doc.addPage();
                yPos = 40;
            }

            // Encabezado de materia
            doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold');
            doc.text(`${gIndex + 1}. ${group.subjectName}`, 40, yPos);
            yPos += 20;

            // Tabla
            const tableTop = yPos;
            const colWidths = [120, 200, 80, 130];
            const rowHeight = 18;

            // Headers
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
            doc.rect(40, tableTop, colWidths[0], rowHeight).fillAndStroke('#4b5563', '#000');
            doc.text('Grupo', 45, tableTop + 5, { width: colWidths[0] - 10 });

            doc.rect(40 + colWidths[0], tableTop, colWidths[1], rowHeight).fillAndStroke('#4b5563', '#000');
            doc.text('Profesor', 45 + colWidths[0], tableTop + 5, { width: colWidths[1] - 10 });

            doc.rect(40 + colWidths[0] + colWidths[1], tableTop, colWidths[2], rowHeight).fillAndStroke('#4b5563', '#000');
            doc.text('Dificultad', 45 + colWidths[0] + colWidths[1], tableTop + 5, { width: colWidths[2] - 10 });

            doc.rect(40 + colWidths[0] + colWidths[1] + colWidths[2], tableTop, colWidths[3], rowHeight).fillAndStroke('#4b5563', '#000');
            doc.text('Horario', 45 + colWidths[0] + colWidths[1] + colWidths[2], tableTop + 5, { width: colWidths[3] - 10 });

            // Data row
            const dataTop = tableTop + rowHeight;
            doc.font('Helvetica').fillColor('#000000');

            doc.rect(40, dataTop, colWidths[0], rowHeight).stroke('#d1d5db');
            doc.text(group.groupCode, 45, dataTop + 5, { width: colWidths[0] - 10 });

            doc.rect(40 + colWidths[0], dataTop, colWidths[1], rowHeight).stroke('#d1d5db');
            doc.fontSize(7).text(group.professorNames[0], 45 + colWidths[0], dataTop + 5, { width: colWidths[1] - 10 });

            doc.rect(40 + colWidths[0] + colWidths[1], dataTop, colWidths[2], rowHeight).stroke('#d1d5db');
            doc.fontSize(9).text(`${group.difficulty?.toFixed(1)}/10`, 45 + colWidths[0] + colWidths[1], dataTop + 5, { width: colWidths[2] - 10 });

            // Horario
            const scheduleText = group.schedule.map(s =>
                `${getDayName(s.day)} ${formatTime(s.startTime)}-${formatTime(s.endTime)}`
            ).join(', ');

            doc.rect(40 + colWidths[0] + colWidths[1] + colWidths[2], dataTop, colWidths[3], rowHeight).stroke('#d1d5db');
            doc.fontSize(6).text(scheduleText, 45 + colWidths[0] + colWidths[1] + colWidths[2], dataTop + 3, {
                width: colWidths[3] - 10,
                lineGap: 1
            });

            yPos = dataTop + rowHeight + 15;
        });

        // Pie de página
        doc.fontSize(8).fillColor('#9ca3af').text(
            `Página ${index + 1} de ${combinations.length}`,
            40, 750, { align: 'center', width: 532 }
        );
    });

    doc.end();

    await new Promise((resolve) => stream.on('finish', resolve));

    console.log(`✅ PDF generado: ${outputPath}`);
}

generateOnlyRequired().catch(console.error);
