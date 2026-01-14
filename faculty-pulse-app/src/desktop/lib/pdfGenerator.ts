import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CourseGroup, Subject } from '@/types/canonical';
import { GroupMetrics } from '@/workers/scheduler.worker';

// Helper to format time
const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

// Helper to deduce day string
const DAYS = ['L', 'M', 'I', 'J', 'V', 'S'];
const fullDayName = (d: string) => {
    const map: Record<string, string> = {
        'L': 'Lunes', 'M': 'Martes', 'I': 'Miércoles', 'J': 'Jueves', 'V': 'Viernes', 'S': 'Sábado'
    };
    return map[d] || d;
};

interface SchedulePDFData {
    schedules: CourseGroup[][];
    metrics: Record<string, GroupMetrics>;
}

// Helper to compact schedule string
const compactScheduleString = (schedule: { day: string; startTime: number; endTime: number }[]) => {
    // Group days by time range
    const timeGroups: Record<string, string[]> = {};

    schedule.forEach(s => {
        const timeKey = `${formatTime(s.startTime)}-${formatTime(s.endTime)}`;
        if (!timeGroups[timeKey]) {
            timeGroups[timeKey] = [];
        }
        timeGroups[timeKey].push(s.day);
    });

    const parts: string[] = [];
    // Canonical day order for comparisons
    const dayOrder = { 'L': 0, 'M': 1, 'I': 2, 'J': 3, 'V': 4, 'S': 5 };

    Object.entries(timeGroups).forEach(([timeRange, days]) => {
        // Sort days
        days.sort((a, b) => (dayOrder[a as keyof typeof dayOrder] ?? 0) - (dayOrder[b as keyof typeof dayOrder] ?? 0));

        // Start compacting logic
        if (days.length === 0) return;

        let dayString = '';
        if (days.length >= 3) {
            // Check if consecutive
            let isConsecutive = true;
            for (let i = 0; i < days.length - 1; i++) {
                const current = dayOrder[days[i] as keyof typeof dayOrder];
                const next = dayOrder[days[i + 1] as keyof typeof dayOrder];
                if (next - current !== 1) {
                    isConsecutive = false;
                    break;
                }
            }

            if (isConsecutive) {
                dayString = `${days[0]}-${days[days.length - 1]}`;
            } else {
                dayString = days.join(',');
            }
        } else {
            dayString = days.join(',');
        }

        parts.push(`${dayString}: ${timeRange}`);
    });

    return parts.join(' | ');
};

export const generateEasySchedulesPDF = ({ schedules, metrics }: SchedulePDFData) => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    // --- Title Page ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Horarios Óptimos', 105, 40, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('EvaluaProf - Análisis de Carga Académica', 105, 50, { align: 'center' });
    doc.text(`Generado el: ${dateStr}`, 105, 58, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.line(40, 65, 170, 65);

    doc.setFontSize(10);
    doc.text('Este reporte contiene las 50 combinaciones de horarios más fáciles detectadas,', 105, 80, { align: 'center' });
    doc.text('optimizadas para minimizar la carga académica y maximizar tus calificaciones.', 105, 86, { align: 'center' });

    // --- Executive Summary (Top 5) ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('🏆 Top 5: Las Joyas de la Corona', 14, 110);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Estas son las mejores opciones absolutas en términos de facilidad.', 14, 118);

    const top5 = schedules.slice(0, 5);

    let currentY = 125;

    top5.forEach((schedule, index) => {
        // Calculate stats
        let totalDiff = 0;
        let count = 0;
        schedule.forEach(g => {
            const m = metrics[g.id];
            if (m) { totalDiff += m.difficulty; count++; }
        });
        const avgDiff = count ? (totalDiff / count).toFixed(1) : 'N/A';

        // Header for each schedule
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235); // Blue
        doc.text(`#${index + 1} - Dificultad Promedio: ${avgDiff}/10`, 14, currentY);
        doc.setTextColor(0, 0, 0);

        // Table data
        const tableBody = schedule.map(group => {
            const m = metrics[group.id];
            const diff = m ? m.difficulty.toFixed(1) : '-';
            const score = m ? m.quality.toFixed(1) : '-';

            // Use compact string
            const times = compactScheduleString(group.schedule);

            return [
                group.subjectName || group.id,
                group.professorNames[0] || 'Sin Asignar',
                `Dif: ${diff} | Score: ${score}`,
                times
            ];
        });

        autoTable(doc, {
            startY: currentY + 3,
            head: [['Materia', 'Profesor', 'Métricas', 'Horario']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40], fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            margin: { left: 14, right: 14 },
        });

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 10;

        // Page break check
        if (currentY > 250 && index < top5.length - 1) {
            doc.addPage();
            currentY = 20;
        }
    });

    // --- Grouped Sections ---
    // Categorize remaining 45
    const remaining = schedules.slice(5, 50);
    const morning: CourseGroup[][] = [];
    const afternoon: CourseGroup[][] = [];
    const mixed: CourseGroup[][] = [];

    remaining.forEach(sch => {
        let minTime = Infinity;
        sch.forEach(g => g.schedule.forEach(s => { if (s.startTime < minTime) minTime = s.startTime; }));

        // Simple heuristic: If starts before 12:00 (720 min) -> Morning preference?
        // Actually typically 'Morning Schedule' means ends by 2pm?
        // Let's check average time
        let totalTime = 0;
        let slots = 0;
        sch.forEach(g => g.schedule.forEach(s => { totalTime += s.startTime; slots++; }));
        const avgTime = slots ? totalTime / slots : 0;

        if (avgTime < 780) { // Average start before 1pm
            morning.push(sch);
        } else if (avgTime >= 840) { // Average start after 2pm
            afternoon.push(sch);
        } else {
            mixed.push(sch);
        }
    });

    const sections = [
        { title: '☀️ Mejores Horarios Matutinos', data: morning },
        { title: '🌙 Mejores Horarios Vespertinos', data: afternoon },
        { title: '⚖️ Horarios Mixtos', data: mixed }
    ];

    sections.forEach(sec => {
        if (sec.data.length === 0) return;

        doc.addPage();
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(sec.title, 14, 20);

        currentY = 30;

        sec.data.forEach((schedule, idx) => {
            // Calculate stats
            let totalDiff = 0;
            let count = 0;
            schedule.forEach(g => {
                const m = metrics[g.id];
                if (m) { totalDiff += m.difficulty; count++; }
            });
            const avgDiff = count ? (totalDiff / count).toFixed(1) : 'N/A';

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`Opción ${idx + 1} - Dificultad: ${avgDiff}`, 14, currentY);

            const tableBody = schedule.map(group => [
                group.subjectName || group.id,
                group.professorNames[0]?.split(' ').slice(0, 2).join(' ') || 'N/A', // Shorten name
                compactScheduleString(group.schedule)
            ]);

            autoTable(doc, {
                startY: currentY + 2,
                head: [['Materia', 'Profesor', 'Horario']],
                body: tableBody,
                theme: 'plain', // Cleaner look for lists
                styles: { fontSize: 8, cellPadding: 1 },
                headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' },
                margin: { left: 14, right: 14 }, // Compact
            });

            // @ts-ignore
            currentY = doc.lastAutoTable.finalY + 8;

            if (currentY > 270) {
                doc.addPage();
                currentY = 20;
            }
        });
    });

    // Save
    doc.save('evaluaprof_reporte_optimo.pdf');
};
