/**
 * Generador de PDF para reportes de horarios
 * Lee el JSON generado y crea un PDF profesional y legible
 * 
 * Uso:
 * npx tsx generate-pdf-report.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    isRequired: boolean;
}

interface ScheduleCombination {
    groups: CourseGroup[];
    totalDifficulty: number;
    averageDifficulty: number;
    subjectCount: number;
    requiredCount: number;
    optionalCount: number;
    hasConflicts: boolean;
    conflictDetails: string[];
}

function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function getDayName(day: string): string {
    const days: { [key: string]: string } = {
        'L': 'Lun',
        'M': 'Mar',
        'I': 'Mié',
        'J': 'Jue',
        'V': 'Vie'
    };
    return days[day] || day;
}

function getDifficultyColor(difficulty: number): string {
    if (difficulty <= 3.0) return '#10b981'; // Verde - Muy fácil
    if (difficulty <= 5.0) return '#3b82f6'; // Azul - Fácil
    if (difficulty <= 7.0) return '#f59e0b'; // Amarillo - Moderado
    if (difficulty <= 9.0) return '#ef4444'; // Rojo - Difícil
    return '#991b1b'; // Rojo oscuro - Muy difícil
}

function getDifficultyLabel(difficulty: number): string {
    if (difficulty <= 3.0) return 'Muy Fácil ✓';
    if (difficulty <= 5.0) return 'Fácil';
    if (difficulty <= 7.0) return 'Moderado';
    if (difficulty <= 9.0) return 'Difícil';
    return 'Muy Difícil';
}

async function generatePDF() {
    console.log('📄 Generando PDF del reporte de horarios...\n');

    // Leer el JSON
    const jsonPath = path.join(__dirname, 'required-schedules.json');
    const data: ScheduleCombination[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // Filtrar solo los que no tienen conflictos
    const validSchedules = data.filter(s => !s.hasConflicts);

    console.log(`📊 Total de horarios: ${data.length}`);
    console.log(`✅ Sin conflictos: ${validSchedules.length}`);
    console.log(`📄 Generando PDF con top 50...\n`);

    const top50 = validSchedules.slice(0, 50);

    // Crear PDF
    const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
            Title: 'Reporte de Combinaciones de Horarios',
            Author: 'EvaluaProf - Faculty Pulse',
            Subject: 'Mejores combinaciones de horarios ordenadas por facilidad'
        }
    });

    const outputPath = path.join(__dirname, 'horarios-reporte.pdf');
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Portada
    doc.fontSize(24)
        .fillColor('#1e40af')
        .text('Reporte de Horarios', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(16)
        .fillColor('#64748b')
        .text('Mejores Combinaciones Ordenadas por Facilidad', { align: 'center' });

    doc.moveDown(2);

    // Información general
    doc.fontSize(12)
        .fillColor('#000000')
        .text('✅ Incluye SÍ O SÍ todas las materias obligatorias', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(10)
        .fillColor('#64748b')
        .text(`Total de combinaciones procesadas: ${data.length.toLocaleString()}`, { align: 'center' });

    doc.text(`Combinaciones sin conflictos: ${validSchedules.length.toLocaleString()}`, { align: 'center' });
    doc.text(`Mostrando: Top 50 mejores horarios`, { align: 'center' });

    doc.moveDown(2);

    // Leyenda de dificultad
    doc.fontSize(11)
        .fillColor('#000000')
        .text('Escala de Dificultad:', { underline: true });

    doc.moveDown(0.3);
    const legendY = doc.y;

    doc.fontSize(9);
    doc.fillColor('#10b981').text('● 1.0-3.0: Muy Fácil', 70, legendY);
    doc.fillColor('#3b82f6').text('● 3.1-5.0: Fácil', 200, legendY);
    doc.fillColor('#f59e0b').text('● 5.1-7.0: Moderado', 320, legendY);

    doc.fillColor('#ef4444').text('● 7.1-9.0: Difícil', 70, legendY + 15);
    doc.fillColor('#991b1b').text('● 9.1-10.0: Muy Difícil', 200, legendY + 15);

    doc.moveDown(3);

    // Generar cada horario
    top50.forEach((schedule, index) => {
        // Nueva página para cada horario (excepto el primero)
        if (index > 0) {
            doc.addPage();
        }

        const pageTop = 50;
        doc.y = pageTop;

        // Encabezado del horario
        const headerY = doc.y;
        doc.roundedRect(50, headerY, 512, 60, 5)
            .fillAndStroke(getDifficultyColor(schedule.averageDifficulty), '#000000');

        doc.fontSize(16)
            .fillColor('#ffffff')
            .text(`Horario #${index + 1}`, 60, headerY + 10);

        doc.fontSize(12)
            .text(`Dificultad Promedio: ${schedule.averageDifficulty.toFixed(2)}/10`, 60, headerY + 32);

        doc.fontSize(10)
            .text(`${getDifficultyLabel(schedule.averageDifficulty)}`, 350, headerY + 32);

        doc.fontSize(9)
            .text(`${schedule.subjectCount} materias (${schedule.requiredCount} oblig. + ${schedule.optionalCount} opc.)`, 60, headerY + 48);

        doc.y = headerY + 75;

        // Materias obligatorias
        const requiredGroups = schedule.groups.filter(g => g.isRequired);
        if (requiredGroups.length > 0) {
            doc.fontSize(11)
                .fillColor('#000000')
                .text('✅ MATERIAS OBLIGATORIAS', { underline: true });

            doc.moveDown(0.5);

            requiredGroups.forEach(group => {
                drawCourseBox(doc, group, '#dcfce7', '#166534');
            });
        }

        // Materias opcionales
        const optionalGroups = schedule.groups.filter(g => !g.isRequired);
        if (optionalGroups.length > 0) {
            doc.moveDown(0.5);
            doc.fontSize(11)
                .fillColor('#000000')
                .text('📘 MATERIAS OPCIONALES', { underline: true });

            doc.moveDown(0.5);

            optionalGroups.forEach(group => {
                drawCourseBox(doc, group, '#dbeafe', '#1e40af');
            });
        }

        // Pie de página
        doc.fontSize(8)
            .fillColor('#9ca3af')
            .text(
                `Página ${index + 1} de ${top50.length} | Generado: ${new Date().toLocaleString('es-MX')}`,
                50,
                doc.page.height - 30,
                { align: 'center', width: 512 }
            );
    });

    doc.end();

    // Esperar a que termine
    await new Promise((resolve) => {
        stream.on('finish', resolve);
    });

    console.log(`✅ PDF generado exitosamente: ${outputPath}`);
    console.log(`📄 Total de páginas: ${top50.length}`);
}

function drawCourseBox(doc: PDFKit.PDFDocument, group: CourseGroup, bgColor: string, textColor: string) {
    const startY = doc.y;
    const boxHeight = 85;

    // Verificar si necesitamos nueva página
    if (startY + boxHeight > doc.page.height - 80) {
        doc.addPage();
    }

    const currentY = doc.y;

    // Caja de fondo
    doc.roundedRect(50, currentY, 512, boxHeight, 3)
        .fillAndStroke(bgColor, '#d1d5db');

    // Nombre de la materia
    doc.fontSize(10)
        .fillColor(textColor)
        .font('Helvetica-Bold')
        .text(group.subjectName, 60, currentY + 8, { width: 400 });

    // Código del grupo
    doc.fontSize(8)
        .fillColor('#6b7280')
        .font('Helvetica')
        .text(`Grupo: ${group.groupCode}`, 60, currentY + 25);

    // Profesor
    doc.fontSize(9)
        .fillColor('#000000')
        .text(`Profesor: ${group.professorNames[0]}`, 60, currentY + 40, { width: 350 });

    // Dificultad
    const diffColor = getDifficultyColor(group.difficulty || 0);
    doc.fontSize(9)
        .fillColor(diffColor)
        .font('Helvetica-Bold')
        .text(`Dificultad: ${group.difficulty?.toFixed(1)}/10`, 430, currentY + 40);

    // Horario
    doc.fontSize(8)
        .fillColor('#374151')
        .font('Helvetica')
        .text('Horario:', 60, currentY + 58);

    const scheduleText = formatSchedule(group.schedule);
    doc.fontSize(8)
        .fillColor('#1f2937')
        .text(scheduleText, 110, currentY + 58, { width: 440 });

    doc.y = currentY + boxHeight + 8;
}

function formatSchedule(schedule: TimeSlot[]): string {
    const byDay: { [key: string]: string[] } = {};

    schedule.forEach(slot => {
        const day = getDayName(slot.day);
        const time = `${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`;

        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(time);
    });

    return Object.entries(byDay)
        .map(([day, times]) => `${day}: ${times.join(', ')}`)
        .join(' | ');
}

generatePDF().catch(console.error);
