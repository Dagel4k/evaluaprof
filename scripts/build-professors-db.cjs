const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../scraper/out/profesores_enriquecido');
const OUT_FILE = path.join(__dirname, '../faculty-pulse-app/public/professors-db.json');

// Ensure output directory exists
const outDir = path.dirname(OUT_FILE);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('🏗️  Building Professor Database...');

try {
  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.json'));
  const database = [];

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      // Normalize fields
      const entry = {
        id: data.professor_id || file.replace('.json', ''),
        name: data.nombre,
        metrics: {
          quality: data.bayes_analysis?.quality_bayes || data.decay_analysis?.quality_decayed || 0,
          difficulty: data.bayes_analysis?.difficulty_bayes || data.decay_analysis?.difficulty_decayed || 0,
          wouldTakeAgain: (data.recommendation_analysis?.rate || 0) * 100, // 0-1 to 0-100%
          sentiment: data.nlp_analysis?.sentiment?.overall || 0,
          trust: data.integrity_analysis?.trust_score || 1.0,
          tags: data.nlp_analysis?.topics || [], // If available
        },
        // We keep minimal data to keep file size low
        reviewCount: data.n_reviews || 0
      };

      database.push(entry);
    } catch (err) {
      console.warn(`⚠️  Skipping corrupt file: ${file}`);
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(database, null, 2));
  console.log(`✅  Database built with ${database.length} professors.`);
  console.log(`📍  Saved to: ${OUT_FILE}`);

} catch (err) {
  console.error('❌  Error building database:', err);
  process.exit(1);
}
