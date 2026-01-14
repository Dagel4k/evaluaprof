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
    };
    reviewCount: number;
    percentile?: number;
}

async function generateAICommentary(professor: ProfessorEntry): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `Eres un asesor académico que ayuda a estudiantes a elegir profesores. 
Genera un comentario breve (2-3 oraciones) y natural sobre el profesor basándote en sus métricas.
Sé honesto pero constructivo. Menciona puntos fuertes y áreas de consideración.`
                },
                {
                    role: 'user',
                    content: `Profesor: ${professor.name}
Calidad: ${professor.metrics.quality.toFixed(1)}/10
Dificultad: ${professor.metrics.difficulty === 0 ? 'N/A (Sin datos)' : professor.metrics.difficulty.toFixed(1) + '/10'}
Lo tomarían de nuevo: ${(professor.metrics.wouldTakeAgain * 100).toFixed(0)}%
Reviews: ${professor.reviewCount}
Confianza de datos: ${(professor.metrics.trust * 100).toFixed(0)}%
NOTA: Si la dificultad es N/A, indica que no tenemos datos sobre su exigencia, no asumas que es fácil.`
                }
            ],
            temperature: 0.7,
            max_tokens: 300
        });

        return response.choices[0]?.message?.content?.trim() || 'Sin comentario disponible.';
    } catch (error) {
        console.error(`Error generating commentary for ${professor.name}:`, error);
        return 'Comentario no disponible.';
    }
}

async function generateProfessorComparisonPDF() {
    console.log('📄 Generando PDF de comparación de profesores...\n');

    // Load professors database
    const dbPath = path.join(__dirname, '../public/professors-db.json');
    const professors: ProfessorEntry[] = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

    // CONFIGURATION: Set the number of top professors to get AI commentary
    // This is to avoid excessive API usage and time for the full list of 500+ profs
    const TOP_N_AI_COMMENTARY = 30;

    // Sort by quality (descending)
    professors.sort((a, b) => b.metrics.quality - a.metrics.quality);

    const professorsToProcess = professors; // Process ALL professors

    // Create PDF
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const outputPath = path.join(__dirname, '../reports/professor-comparison.pdf');

    // Ensure reports directory exists
    const reportsDir = path.dirname(outputPath);
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Title Page
    doc.fontSize(24).font('Helvetica-Bold').text('Comparación de Profesores', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text('EvaluaProf - Reporte Generado', { align: 'center' });
    doc.fontSize(10).text(new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }), { align: 'center' });
    doc.moveDown(2);

    // Summary Statistics
    const avgQuality = professors.reduce((sum, p) => sum + p.metrics.quality, 0) / professors.length;
    const avgDifficulty = professors.reduce((sum, p) => sum + p.metrics.difficulty, 0) / professors.length;
    const totalReviews = professors.reduce((sum, p) => sum + p.reviewCount, 0);

    doc.fontSize(14).font('Helvetica-Bold').text('Resumen General', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total de profesores: ${professors.length}`);
    doc.text(`Calidad promedio: ${avgQuality.toFixed(2)}/10`);
    doc.text(`Dificultad promedio: ${avgDifficulty.toFixed(2)}/10`);
    doc.text(`Total de reviews: ${totalReviews}`);
    doc.moveDown(2);

    // Process professors in batches
    const batchSize = 5;
    let processedCount = 0;

    for (let i = 0; i < professorsToProcess.length; i += batchSize) {
        const batch = professorsToProcess.slice(i, i + batchSize);

        console.log(`Procesando profesores ${i + 1}-${Math.min(i + batchSize, professorsToProcess.length)}...`);

        // Generate AI commentary for batch ONLY if they are in the TOP N
        const commentaries = await Promise.all(
            batch.map(prof => {
                const globalIndex = i + batch.indexOf(prof);
                if (globalIndex < TOP_N_AI_COMMENTARY) {
                    return generateAICommentary(prof);
                }
                return Promise.resolve(null); // Skip AI for lower ranked profs
            })
        );

        // Add each professor to PDF
        for (let j = 0; j < batch.length; j++) {
            const prof = batch[j];
            const commentary = commentaries[j];
            processedCount++;

            // Use a bit more space per entry for the enriched data
            const entryHeight = 140;
            if (doc.y + entryHeight > 750) {
                doc.addPage();
            }

            const startY = doc.y;

            // --- 1. Header with Badge & Name ---
            const percentileLabel = prof.percentile !== undefined
                ? `TOP ${(100 - prof.percentile).toFixed(0)}%`
                : 'FACULTAD';

            // Badge background
            const badgeColor = prof.metrics.quality >= 8 ? '#059669' : (prof.metrics.quality >= 6 ? '#2563eb' : '#4b5563');
            doc.rect(50, startY, 60, 18).fill(badgeColor);
            doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
                .text(percentileLabel, 50, startY + 5, { width: 60, align: 'center' });

            // Name
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827')
                .text(prof.name, 120, startY + 2);
            doc.fillColor('#4b5563').fontSize(8).font('Helvetica')
                .text(`ID: ${prof.id}`, 120, startY + 16);

            doc.moveDown(0.5);
            const contentY = doc.y;

            // --- 2. Main Metrics (Grid) ---
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151');
            doc.text('MÉTRICAS CORE', 50, contentY);
            doc.text('MATERIAS CLAVE', 220, contentY);
            doc.text('INSIGHTS TÉCNICOS', 400, contentY);

            doc.fontSize(9).font('Helvetica').fillColor('#4b5563');
            const gridY = contentY + 14;

            // Column 1: Core Metrics
            doc.text(`Calidad:`, 50, gridY);
            doc.font('Helvetica-Bold').text(`${prof.metrics.quality.toFixed(1)}/10`, 110, gridY);
            doc.font('Helvetica').text(`Dificultad:`, 50, gridY + 12);
            doc.font('Helvetica-Bold').text(`${prof.metrics.difficulty === 0 ? 'N/A' : prof.metrics.difficulty.toFixed(1) + '/10'}`, 110, gridY + 12);
            doc.font('Helvetica').text(`Muestra:`, 50, gridY + 24);
            doc.font('Helvetica-Bold').text(`${prof.reviewCount} reviews`, 110, gridY + 24);

            // Column 2: Subjects
            const subs = prof.metrics.subjects || [];
            if (subs.length > 0) {
                subs.forEach((s, idx) => {
                    doc.fontSize(8).text(`• ${s}`, 220, gridY + (idx * 12), { width: 170 });
                });
            } else {
                doc.fontSize(8).font('Helvetica-Oblique').text('Sin datos de materia', 220, gridY);
            }

            // Column 3: Technical Insights
            doc.font('Helvetica').fontSize(8);
            const forecastText = prof.metrics.forecast ? `${prof.metrics.forecast.toFixed(1)}/10` : 'N/A';
            const consistencyText = prof.metrics.consistency ? `${(prof.metrics.consistency * 100).toFixed(0)}%` : 'N/A';

            doc.text(`Pronóstico:`, 400, gridY);
            doc.font('Helvetica-Bold').text(forecastText, 470, gridY);
            doc.font('Helvetica').text(`Consistencia:`, 400, gridY + 12);
            doc.font('Helvetica-Bold').text(consistencyText, 470, gridY + 12);
            doc.font('Helvetica').text(`Recomendación:`, 400, gridY + 24);
            doc.font('Helvetica-Bold').text(`${(prof.metrics.wouldTakeAgain * 100).toFixed(0)}%`, 470, gridY + 24);

            doc.y = gridY + 45;

            // --- 3. AI Commentary (Enriched Tier Only) ---
            if (commentary) {
                doc.rect(50, doc.y, 500, 35).fill('#f8fafc');
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#059669')
                    .text('💬 ANÁLISIS ESTRATÉGICO IA:', 55, doc.y + 5);
                doc.fillColor('#334155').font('Helvetica-Oblique')
                    .text(commentary, 55, doc.y + 15, { width: 480 });
                doc.moveDown(1.5);
            } else {
                doc.moveDown(0.5);
            }

            // Separator line
            doc.strokeColor('#e5e7eb')
                .lineWidth(0.5)
                .moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();

            doc.moveDown(1.2);
        }

        // Small delay to avoid rate limits
        if (i + batchSize < professorsToProcess.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Footer on last page
    doc.fontSize(8).font('Helvetica').fillColor('#6b7280')
        .text('Generado por EvaluaProf con tecnología GPT', 50, 720, { align: 'center' });

    doc.end();

    await new Promise<void>((resolve) => {
        stream.on('finish', () => resolve());
    });

    console.log(`\n✅ PDF generado exitosamente: ${outputPath}`);
    console.log(`📊 Total de profesores procesados: ${processedCount}`);
}

generateProfessorComparisonPDF().catch(console.error);
