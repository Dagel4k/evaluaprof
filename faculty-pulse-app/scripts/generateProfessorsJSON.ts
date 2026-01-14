import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function generateDB() {
    const enrichedDir = path.join(__dirname, '../public/profesores_enriquecido');
    const dbPath = path.join(__dirname, '../public/professors-db.json');

    if (!fs.existsSync(enrichedDir)) {
        console.error('❌ Enriched directory not found:', enrichedDir);
        return;
    }

    const files = fs.readdirSync(enrichedDir).filter(f => f.endsWith('.json') && f !== 'fileList.json');
    const professors: ProfessorEntry[] = [];

    console.log(`📂 Processing ${files.length} enriched files...`);

    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(enrichedDir, file), 'utf-8'));

            professors.push({
                id: data.professor_id,
                name: data.nombre,
                metrics: {
                    quality: data.bayes_analysis?.quality_bayes || 0,
                    difficulty: data.bayes_analysis?.difficulty_bayes || 0,
                    wouldTakeAgain: data.recommendation_analysis?.rate || 0,
                    sentiment: data.nlp_analysis?.sentiment?.overall || 0,
                    trust: data.integrity_analysis?.trust_score || 1.0,
                    tags: data.nlp_analysis?.topics?.flatMap((t: any) => t.words) || [],
                    subjects: data.subject_normalization?.per_subject?.slice(0, 3).map((s: any) => s.materia) || [],
                    forecast: data.trends_analysis?.forecast?.quality_next,
                    consistency: data.integrity_analysis?.low_variance_flag === 1 ? 0.9 : 0.6,
                    qualityTrend: data.trends_analysis?.quality_trend?.series || [],
                    difficultyTrend: data.trends_analysis?.difficulty_trend?.series || [],
                    topComments: data.reviews_public?.slice(0, 3).map((r: any) => r.comentario) || []
                },
                reviewCount: data.n_reviews || 0
            });
        } catch (e) {
            console.error(`⚠️ Error processing ${file}:`, e);
        }
    }

    // Calculate percentiles (sort descending: best first)
    professors.sort((a, b) => b.metrics.quality - a.metrics.quality);
    professors.forEach((p, idx) => {
        p.percentile = 100 - (idx / (professors.length - 1)) * 100;
    });

    fs.writeFileSync(dbPath, JSON.stringify(professors, null, 2));
    console.log(`✅ Database generated with ${professors.length} professors at ${dbPath}`);
}

generateDB();
