/*
  Copia los JSON enriquecidos desde ../scraper/out/profesores_enriquecido
  hacia public/profesores_enriquecido y genera fileList.json
  - Diseñado para funcionar sin importar el cwd (usa __dirname)
*/

const fs = require('fs');
const path = require('path');

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function isJsonFile(filename) {
  return filename.toLowerCase().endsWith('.json');
}

function main() {
  const scriptsDir = __dirname;
  const projectRoot = path.resolve(scriptsDir, '..');
  const sourceDir = path.resolve(projectRoot, '../scraper/out/profesores_enriquecido');
  const destDir = path.resolve(projectRoot, 'public/profesores_enriquecido');

  ensureDirectory(destDir);

  if (fs.existsSync(sourceDir)) {
    const files = fs.readdirSync(sourceDir).filter(isJsonFile);
    const copied = [];

    for (const filename of files) {
      const src = path.join(sourceDir, filename);
      const dst = path.join(destDir, filename);
      fs.copyFileSync(src, dst);
      copied.push(filename);
    }

    const listPath = path.join(destDir, 'fileList.json');
    fs.writeFileSync(listPath, JSON.stringify(copied, null, 2), 'utf8');

    console.log(`[prepare-professors] Copiados ${copied.length} archivos a ${destDir}`);
    console.log(`[prepare-professors] Generado ${listPath}`);
  } else if (fs.existsSync(destDir)) {
    // Fallback: si ya existen en public/, solo regenerar lista
    const existing = fs.readdirSync(destDir).filter(isJsonFile).filter(f => f !== 'fileList.json');
    const listPath = path.join(destDir, 'fileList.json');
    fs.writeFileSync(listPath, JSON.stringify(existing, null, 2), 'utf8');
    console.warn('[prepare-professors] Origen no encontrado, usando archivos existentes en public/.');
    console.log(`[prepare-professors] Regenerado ${listPath} con ${existing.length} archivos.`);
  } else {
    console.warn('[prepare-professors] No se encontraron datos ni en origen ni en destino.');
    console.warn('[prepare-professors] Ejecuta el scraper o copia manualmente los JSON a public/profesores_enriquecido/.');
  }
}

main();


