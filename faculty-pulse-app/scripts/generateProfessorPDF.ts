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
    };
    reviewCount: number;
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

    // Sort by quality (descending)
    professors.sort((a, b) => b.metrics.quality - a.metrics.quality);

    // TESTING: Only process first 5 professors
    const professorsToProcess = professors.slice(0, 5);

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

        // Generate AI commentary for batch
        const commentaries = await Promise.all(
            batch.map(prof => generateAICommentary(prof))
        );

        // Add each professor to PDF
        for (let j = 0; j < batch.length; j++) {
            const prof = batch[j];
            const commentary = commentaries[j];
            processedCount++;

            // Check if we need a new page
            if (doc.y > 650) {
                doc.addPage();
            }

            // Professor Header
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af')
                .text(`${processedCount}. ${prof.name}`, { continued: false });
            doc.fillColor('#000000');
            doc.moveDown(0.2);

            // Metrics
            doc.fontSize(9).font('Helvetica');
            const metricsY = doc.y;

            // Left column
            doc.text(`Calidad: ${prof.metrics.quality.toFixed(1)}/10`, 50, metricsY);
            doc.text(`Dificultad: ${prof.metrics.difficulty === 0 ? 'N/A' : prof.metrics.difficulty.toFixed(1) + '/10'}`, 50, metricsY + 12);
            doc.text(`Reviews: ${prof.reviewCount}`, 50, metricsY + 24);

            // Right column
            doc.text(`Lo tomarían de nuevo: ${(prof.metrics.wouldTakeAgain * 100).toFixed(0)}%`, 300, metricsY);
            doc.text(`Confianza: ${(prof.metrics.trust * 100).toFixed(0)}%`, 300, metricsY + 12);

            doc.moveDown(2.5);

            // AI Commentary Box
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#059669')
                .text('💬 Comentario IA:', 50, doc.y);
            doc.fillColor('#000000');
            doc.moveDown(0.2);

            doc.fontSize(9).font('Helvetica-Oblique')
                .text(commentary, 50, doc.y, {
                    width: 480,
                    align: 'left'
                });

            doc.moveDown(1);

            // Separator line
            doc.strokeColor('#e5e7eb')
                .lineWidth(0.5)
                .moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();

            doc.moveDown(0.8);
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
