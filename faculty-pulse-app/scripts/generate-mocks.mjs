import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public', 'profesores_enriquecido');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src', 'mocks', 'offering.ts');

// Helper to get random int
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to get random element
const randomItem = (arr) => arr[randomInt(0, arr.length - 1)];

// Standard Schedules (simplified)
const SCHEDULE_PATTERNS = [
  // L-M-V 1 hour
  { days: ['L', 'M', 'V'], duration: 60 },
  // M-J 1.5 hours
  { days: ['M', 'J'], duration: 90 },
  // Daily 1 hour
  { days: ['L', 'M', 'I', 'J', 'V'], duration: 60 }
];

const START_TIMES = [
  420, // 7:00
  480, // 8:00
  540, // 9:00
  600, // 10:00
  660, // 11:00
  720, // 12:00
  780, // 13:00
  840, // 14:00
  900, // 15:00
  960, // 16:00
  1020, // 17:00
  1080, // 18:00
  1140, // 19:00
];

const SUBJECTS = [
  { code: 'MAT101', name: 'Cálculo Diferencial' },
  { code: 'FIS101', name: 'Mecánica Clásica' },
  { code: 'PROG101', name: 'Programación Estructurada' },
  { code: 'QUIM101', name: 'Química General' },
  { code: 'HUM101', name: 'Ética y Valores' },
  { code: 'MAT201', name: 'Álgebra Lineal' },
  { code: 'FIS201', name: 'Electricidad y Magnetismo' },
  { code: 'PROG201', name: 'Estructura de Datos' },
];

async function generateMocks() {
  console.log('🏗️ Generando Mock Data...');

  // 1. Load Professor List
  const fileListPath = path.join(PUBLIC_DIR, 'fileList.json');
  let professorFiles = [];
  try {
    const content = await fs.readFile(fileListPath, 'utf-8');
    professorFiles = JSON.parse(content);
  } catch (e) {
    console.error('❌ No se encontró fileList.json. Ejecuta npm run build primero.');
    process.exit(1);
  }

  // 2. Load a subset of professors to use as pool
  const professorPool = [];
  const numProfesToLoad = Math.min(50, professorFiles.length);
  
  console.log(`📚 Cargando ${numProfesToLoad} profesores reales...`);
  
  for (let i = 0; i < numProfesToLoad; i++) {
    const pPath = path.join(PUBLIC_DIR, professorFiles[i]);
    const pContent = await fs.readFile(pPath, 'utf-8');
    const pData = JSON.parse(pContent);
    // Use the ID from filename or generate one
    const id = professorFiles[i].replace('.json', '');
    professorPool.push({
      id,
      name: pData.nombre || id.replace(/_/g, ' ')
    });
  }

  // 3. Generate Offering
  const subjectsOutput = [];

  for (const sub of SUBJECTS) {
    const numGroups = randomInt(3, 6); // 3 to 6 groups per subject
    const groups = [];

    for (let g = 1; g <= numGroups; g++) {
      const pattern = randomItem(SCHEDULE_PATTERNS);
      const startTime = randomItem(START_TIMES);
      const endTime = startTime + pattern.duration;
      const professor = randomItem(professorPool);
      
      // Generate schedule slots
      const schedule = pattern.days.map(day => ({
        day,
        startTime,
        endTime,
        classroom: `A-${randomInt(100, 200)}`
      }));

      groups.push({
        id: crypto.randomUUID(),
        subjectId: sub.code, // temporary link
        subjectName: sub.name,
        groupCode: `00${g}`,
        professorIds: [professor.id],
        professorNames: [professor.name],
        schedule
      });
    }

    subjectsOutput.push({
      id: crypto.randomUUID(),
      code: sub.code,
      name: sub.name,
      groups
    });
  }

  // 4. Write Output
  const outputData = {
    subjects: subjectsOutput
  };

  const fileContent = `// Auto-generated mock offering
export default ${JSON.stringify(outputData, null, 2)};
`;

  await fs.writeFile(OUTPUT_FILE, fileContent, 'utf-8');
  console.log(`✅ Mock Data generado en: ${OUTPUT_FILE}`);
  console.log(`   - Materias: ${subjectsOutput.length}`);
  console.log(`   - Grupos totales: ${subjectsOutput.reduce((acc, s) => acc + s.groups.length, 0)}`);
}

generateMocks();
