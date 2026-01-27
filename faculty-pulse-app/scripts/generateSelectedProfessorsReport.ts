import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const openaiApiKey = process.env.GPT_KEY || process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

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

// Type definition for message.json structure
interface MessageData {
    esValido: boolean;
    data: {
        materias: {
            grupos: {
                docente: string;
            }[];
        }[];
    };
}

async function generateAICommentary(professor: ProfessorEntry): Promise<string> {
    if (!openai) {
        // Fallback: Use top comments or generic text
        if (professor.metrics.topComments && professor.metrics.topComments.length > 0) {
            return `Resumen de opiniones: ${professor.metrics.topComments[0].substring(0, 150)}...`;
        }
        return 'Análisis detallado no disponible (API Key faltante).';
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
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

function normalizeName(name: string): string {
    if (!name) return '';
    return name.trim().toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/\s+/g, ' '); // Normalize spaces
}

async function generateSelectedProfessorsReport() {
    process.stdout.write('\x1Bc'); // Clear console
    console.log('📄 Generando REPORTE PERSONALIZADO DE PROFESORES...\n');

    // 1. Load Professors DB
    const dbPath = path.join(__dirname, '../public/professors-db.json');
    const allProfessors: ProfessorEntry[] = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

    // 2. Load Message JSON (Selected Professors)
    const messagePath = path.join(__dirname, '../public/message.json');
    const messageData: MessageData = JSON.parse(fs.readFileSync(messagePath, 'utf-8'));

    // 3. Extract Unique Professor Names from Message JSON
    const selectedNames = new Set<string>();

    if (messageData.data && messageData.data.materias) {
        messageData.data.materias.forEach((materia: any) => {
            if (materia.grupos) {
                materia.grupos.forEach((grupo: any) => {
                    const name = grupo.docente;
                    if (name && name.trim().length > 0) {
                        selectedNames.add(normalizeName(name));
                    }
                });
            }
        });
    }

    console.log(`Información: Se encontraron ${selectedNames.size} profesores únicos en message.json.`);

    // 4. Filter Professors DB
    const professors = allProfessors.filter(p => {
        const normalizedDBName = normalizeName(p.name);
        // We check if the DB name is included in the selected names or vice versa to overlap
        // A simple exact match on normalized strings is best, but names might vary slightly.
        // Let's try direct match first.
        return selectedNames.has(normalizedDBName);
    });

    console.log(`Información: Se encontraron ${professors.length} coincidencias en la base de datos de profesores.`);

    if (professors.length === 0) {
        console.log('⚠️ No se encontraron profesores coincidentes. Verifica los nombres.');
        return;
    }

    // Sort by quality (descending)
    professors.sort((a, b) => b.metrics.quality - a.metrics.quality);

    // Set margin to 0 to prevent auto-page creation when writing footers near edges.
    // We will handle margins manually in our layout.
    const doc = new PDFDocument({ size: 'LETTER', margin: 0, bufferPages: true });
    const outputPath = path.join(__dirname, '../reports/reporte-personalizado-message.pdf');

    const reportsDir = path.dirname(outputPath);
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // --- COVER PAGE ---
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#111827');
    doc.fillColor('#ffffff');
    doc.fontSize(36).font('Helvetica-Bold').text('REPORTE PERSONALIZADO', 50, 200);
    doc.fontSize(18).font('Helvetica').text('Análisis de Profesores Disponibles (message.json)', 50, 250);
    doc.rect(50, 280, 50, 5).fill('#3b82f6'); // Blue for personalized

    doc.fontSize(12).font('Helvetica').text(`Profesores Analizados: ${professors.length}`, 50, 320);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 340);

    doc.addPage();

    // --- DASHBOARD PAGE ---
    doc.fillColor('#111827').fontSize(24).font('Helvetica-Bold').text('Resumen de Selección', 40, 50);
    doc.moveDown(1);

    const avgQuality = professors.reduce((sum, p) => sum + p.metrics.quality, 0) / professors.length;

    doc.fontSize(14).text('Estadísticas del Grupo');
    doc.fontSize(10).font('Helvetica').fillColor('#4b5563');
    doc.text(`Calidad Promedio: ${avgQuality.toFixed(2)}/10`);

    // Top 5 Recommendations
    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text('⭐ Top Recomendaciones');
    doc.moveDown(0.5);
    professors.slice(0, 5).forEach((p, i) => {
        doc.fontSize(10).font('Helvetica').text(`${i + 1}. ${p.name} - Calidad: ${p.metrics.quality.toFixed(1)}`);
    });

    doc.addPage();

    // --- PROFESSOR CARDS ---
    const batchSize = 5;
    let cardCountOnPage = 0;

    for (let i = 0; i < professors.length; i += batchSize) {
        const batch = professors.slice(i, i + batchSize);
        console.log(`Procesando bloque ${i + 1}-${Math.min(i + batchSize, professors.length)}...`);

        const commentaries = await Promise.all(batch.map(p => generateAICommentary(p)));

        batch.forEach((p, idx) => {
            const comment = commentaries[idx];

            // Pagination Logic:
            // If we have already drawn 2 cards on this page, add a new page and reset counter.
            if (cardCountOnPage === 2) {
                doc.addPage();
                cardCountOnPage = 0;
            }

            const cardHeight = 320;
            const margin = 40;
            const topY = margin;
            const bottomY = margin + cardHeight + 20;

            const pageY = (cardCountOnPage === 0) ? topY : bottomY;

            // DRAW CARD CONTAINER
            doc.save();
            doc.translate(margin, pageY);

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
                reviews.forEach((r: any, rIdx: any) => {
                    const cleanR = r.length > 80 ? r.substring(0, 77) + '...' : r;
                    doc.fontSize(7).font('Helvetica-Oblique').fillColor('#334155').text(`"${cleanR}"`, 350, gridTop + 15 + (rIdx * 28), { width: 160 });
                });
            } else {
                doc.text('Sin comentarios disponibles', 350, gridTop + 15);
            }

            // 3. AI Strategic Insight
            doc.rect(15, 160, 502, 60).fill('#f8fafc');
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#059669').text('💡 REALIDAD SIN FILTRO (IA):', 20, 168);
            doc.fillColor('#334155').font('Helvetica').fontSize(8).text(comment, 20, 180, { width: 490 });

            // 4. Subjects & Meta
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151').text('MATERIAS:', 15, 230);
            doc.font('Helvetica').text(p.metrics.subjects.join(', ') || 'Varios', 75, 230);

            doc.restore();

            cardCountOnPage++;
        });

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Footers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#94a3b8').text(
            `EvaluaProf Reporte Personalizado | Página ${i + 1} de ${pages.count}`,
            40,
            doc.page.height - 30,
            { align: 'center' }
        );
    }

    doc.end();

    await new Promise<void>((resolve) => {
        stream.on('finish', () => resolve());
    });

    console.log(`\n✅ REPORTE PERSONALIZADO generado: ${outputPath}`);
}

generateSelectedProfessorsReport().catch(console.error);
