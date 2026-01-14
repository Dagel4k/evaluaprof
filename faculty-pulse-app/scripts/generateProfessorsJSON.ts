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
    };
    reviewCount: number;
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
                    tags: data.nlp_analysis?.topics?.flatMap((t: any) => t.words) || []
                },
                reviewCount: data.n_reviews || 0
            });
        } catch (e) {
            console.error(`⚠️ Error processing ${file}:`, e);
        }
    }

    fs.writeFileSync(dbPath, JSON.stringify(professors, null, 2));
    console.log(`✅ Database generated with ${professors.length} professors at ${dbPath}`);
}

generateDB();
