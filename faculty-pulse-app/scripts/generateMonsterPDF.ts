import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.GPT_KEY
});

interface ProfessorEntry {
    id: string;
    name: string;
    metrics: {
        quality: number;
        difficulty: number;
        wouldTakeAgain: number;
        sentiment: number;
        trust: number;
        tags: any[];
        subjects: string[];
        forecast?: number;
        consistency?: number;
        qualityTrend: number[];
        difficultyTrend: number[];
        topComments: string[];
    };
    reviewCount: number;
    percentile?: number;
}

async function generateAICommentary(professor: ProfessorEntry): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Using mini for cost/speed on 500+ calls
            messages: [
                {
                    role: 'system',
                    content: `Eres un analista académico experto de EvaluaProf. 
Genera un análisis estratégico breve (3 oraciones) sobre el perfil del profesor basándote en sus métricas y comentarios. 
Sé muy directo y útil para un alumno que está armando su horario. 
Menciona su mayor fortaleza y el nivel de riesgo/beneficio de inscribirse con él.`
                },
                {
                    role: 'user',
                    content: `Profesor: ${professor.name}
Calidad: ${professor.metrics.quality.toFixed(1)}/10
Dificultad: ${professor.metrics.difficulty.toFixed(1)}/10
Comentarios destacados: ${professor.metrics.topComments.join(' | ')}
Ranking: Top ${(100 - (professor.percentile || 0)).toFixed(0)}%
Pronóstico: ${professor.metrics.forecast?.toFixed(1) || 'N/A'}/10`
                }
            ],
            temperature: 0.7,
            max_tokens: 400
        });

        return response.choices[0]?.message?.content?.trim() || 'Análisis no disponible.';
    } catch (error) {
        console.error(`Error generating commentary for ${professor.name}:`, error);
        return 'Análisis no disponible.';
    }
}

function drawSparkline(doc: any, x: number, y: number, width: number, height: number, data: number[], color: string) {
    if (!data || data.length < 2) return;

    doc.save();
    doc.translate(x, y);

    // Calculate scale
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const stepX = width / (data.length - 1);

    doc.lineWidth(1.5).strokeColor(color);
    doc.moveTo(0, height - ((data[0] - min) / range) * height);

    for (let i = 1; i < data.length; i++) {
        doc.lineTo(i * stepX, height - ((data[i] - min) / range) * height);
    }

    doc.stroke();
    doc.restore();
}

async function generateMonsterPDF() {
    process.stdout.write('\x1Bc'); // Clear console
    console.log('📄 Generando REPORTE MONSTRUO DE FACULTAD (Ultra-Detailed)...\n');

    const dbPath = path.join(__dirname, '../public/professors-db.json');
    const professors: ProfessorEntry[] = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

    // Sort by quality (descending)
    professors.sort((a, b) => b.metrics.quality - a.metrics.quality);

    const doc = new PDFDocument({ size: 'LETTER', margin: 40, bufferPages: true });
    const outputPath = path.join(__dirname, '../reports/facultad-monster-report.pdf');

    const reportsDir = path.dirname(outputPath);
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // --- COVER PAGE ---
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#111827');
    doc.fillColor('#ffffff');
    doc.fontSize(36).font('Helvetica-Bold').text('REPORTE MAESTRO DE FACULTAD', 50, 200);
    doc.fontSize(18).font('Helvetica').text('Análisis Profundo y Guía Estratégica de Selección', 50, 250);
    doc.rect(50, 280, 50, 5).fill('#059669');

    doc.fontSize(12).font('Helvetica').text(`Base de datos: ${professors.length} Profesores`, 50, 320);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 340);
    doc.text(`Edición: BETA PRIVADA / MONSTER REPORT`, 50, 360);

    doc.addPage();

    // --- DASHBOARD PAGE ---
    doc.fillColor('#111827').fontSize(24).font('Helvetica-Bold').text('Dashboard de Facultad', 40, 50);
    doc.moveDown(1);

    const avgQuality = professors.reduce((sum, p) => sum + p.metrics.quality, 0) / professors.length;
    const avgDifficulty = professors.reduce((sum, p) => sum + p.metrics.difficulty, 0) / professors.length;

    doc.fontSize(14).text('Estadísticas Generales');
    doc.fontSize(10).font('Helvetica').fillColor('#4b5563');
    doc.text(`Calidad Promedio Institucional: ${avgQuality.toFixed(2)}/10`);
    doc.text(`Dificultad Promedio Institucional: ${avgDifficulty.toFixed(2)}/10`);

    // S-Tier Hall of Fame
    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text('⭐ Hall of Fame (S-Tier Faculty)');
    doc.moveDown(0.5);
    professors.slice(0, 10).forEach((p, i) => {
        doc.fontSize(10).font('Helvetica').text(`${i + 1}. ${p.name} - Calidad: ${p.metrics.quality.toFixed(1)}`);
    });

    doc.addPage();

    // --- PROFESSOR CARDS ---
    const batchSize = 5;
    let processed = 0;

    for (let i = 0; i < professors.length; i += batchSize) {
        const batch = professors.slice(i, i + batchSize);
        console.log(`Procesando bloque ${i + 1}-${Math.min(i + batchSize, professors.length)}...`);

        const commentaries = await Promise.all(batch.map(p => generateAICommentary(p)));

        batch.forEach((p, idx) => {
            const comment = commentaries[idx];
            processed++;

            // Two cards per page logic
            if (processed % 2 === 1 && processed > 1) {
                // doc.addPage() happens after the second card is drawn if there's more
            }

            const pageY = (processed % 2 === 1) ? 40 : 410;
            const cardHeight = 350;

            // DRAW CARD CONTAINER
            doc.save();
            doc.translate(40, pageY);

            // Background
            doc.roundedRect(0, 0, 532, cardHeight, 8).fill('#ffffff').strokeColor('#e5e7eb').lineWidth(1).stroke();

            // 1. Header Area
            const badgeW = 60;
            const colorObj = p.metrics.quality >= 8 ? '#059669' : (p.metrics.quality >= 6 ? '#2563eb' : '#dc2626');
            doc.rect(15, 15, badgeW, 18).fill(colorObj);
            doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold').text(`TOP ${(100 - (p.percentile || 0)).toFixed(0)}%`, 15, 20, { width: badgeW, align: 'center' });

            doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text(p.name, 85, 15);
            doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(`ID: ${p.id}`, 85, 30);

            // 2. Metrics Grid
            const gridTop = 45;
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151');
            doc.text('PERFIL DE CALIDAD', 15, gridTop);
            doc.text('TENDENCIAS HISTÓRICAS', 180, gridTop);
            doc.text('ANÁLISIS DE RESEÑAS', 350, gridTop);

            doc.font('Helvetica').fontSize(8).fillColor('#4b5563');
            doc.text(`Calidad: ${p.metrics.quality.toFixed(1)}/10`, 15, gridTop + 15);
            doc.text(`Dificultad: ${p.metrics.difficulty.toFixed(1)}/10`, 15, gridTop + 27);
            doc.text(`Recomienda: ${(p.metrics.wouldTakeAgain * 100).toFixed(0)}%`, 15, gridTop + 39);
            doc.text(`Reviews: ${p.reviewCount}`, 15, gridTop + 51);

            // Sentiment Bar
            const sent = p.metrics.sentiment; // -1 to 1
            const sentW = 100;
            const posW = Math.max(0, (sent + 1) / 2 * sentW);
            doc.rect(15, gridTop + 65, sentW, 8).fill('#f1f5f9');
            doc.rect(15, gridTop + 65, posW, 8).fill('#10b981');
            doc.fillColor('#6b7280').fontSize(7).text('Sentimiento Alumnos', 15, gridTop + 75);

            // Sparklines
            drawSparkline(doc, 180, gridTop + 15, 130, 30, p.metrics.qualityTrend, '#059669');
            doc.fillColor('#6b7280').fontSize(7).text('Evolución Calidad (Semestres)', 180, gridTop + 50);
            drawSparkline(doc, 180, gridTop + 65, 130, 30, p.metrics.difficultyTrend, '#dc2626');
            doc.fillColor('#6b7280').fontSize(7).text('Evolución Dificultad (Semestres)', 180, gridTop + 100);

            // Reviews List
            const reviews = p.metrics.topComments;
            if (reviews.length > 0) {
                reviews.forEach((r, rIdx) => {
                    const cleanR = r.length > 80 ? r.substring(0, 77) + '...' : r;
                    doc.fontSize(7).font('Helvetica-Oblique').fillColor('#334155').text(`"${cleanR}"`, 350, gridTop + 15 + (rIdx * 28), { width: 160 });
                });
            } else {
                doc.text('Sin comentarios disponibles', 350, gridTop + 15);
            }

            // 3. AI Strategic Insight
            doc.rect(15, 160, 502, 60).fill('#f8fafc');
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#059669').text('💡 ANÁLISIS ESTRATÉGICO IA:', 20, 168);
            doc.fillColor('#334155').font('Helvetica').fontSize(8).text(comment, 20, 180, { width: 490 });

            // 4. Subjects & Meta
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151').text('MATERIAS:', 15, 230);
            doc.font('Helvetica').text(p.metrics.subjects.join(', ') || 'Varios', 75, 230);

            doc.restore();

            if (processed % 2 === 0 && processed < professors.length) {
                doc.addPage();
            }
        });

        // Small delay to prevent API flooding
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Footers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#94a3b8').text(
            `EvaluaProf Reporte Maestro v1.0 | Página ${i + 1} de ${pages.count}`,
            40,
            doc.page.height - 30,
            { align: 'center' }
        );
    }

    doc.end();

    await new Promise<void>((resolve) => {
        stream.on('finish', () => resolve());
    });

    console.log(`\n✅ REPORTE MONSTRUO generado: ${outputPath}`);
}

generateMonsterPDF().catch(console.error);
