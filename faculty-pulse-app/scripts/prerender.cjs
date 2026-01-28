const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const PORT = 4173; // Vite preview port by default
const BASE_URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = path.resolve(__dirname, '../dist/profesores');
const PUBLIC_DIR = path.resolve(__dirname, '../public');

// Función para obtener slugs desde el fileList.json (misma lógica que la app)
function getProfessorSlugs() {
    const fileListPath = path.join(PUBLIC_DIR, 'profesores_enriquecido', 'fileList.json');
    if (!fs.existsSync(fileListPath)) {
        console.error('❌ No se encontró fileList.json. Ejecuta npm run dev primero o asegura que los datos existan.');
        return [];
    }

    const files = JSON.parse(fs.readFileSync(fileListPath, 'utf8'));
    return files.map(file => {
        // Extraer nombre del archivo y convertir a slug
        // Aaron_Cuen_Marquez.json -> Aaron Cuen Marquez -> aaron-cuen-marquez
        const name = file.replace('.json', '').replace(/_/g, ' ');
        return name
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    });
}

async function main() {
    console.log('🚀 Iniciando proceso de pre-rendering...');

    // 1. Iniciar servidor de preview
    console.log('📦 Iniciando servidor de preview...');
    const server = spawn('npm', ['run', 'preview', '--', '--port', PORT.toString()], {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
        shell: false
    });

    // Esperar a que el servidor arranque
    await new Promise(resolve => setTimeout(resolve, 5000));

    let browser;
    try {
        let launchOptions = {
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        };

        const chromium = require("@sparticuz/chromium");
        const puppeteerCore = require("puppeteer-core");

        // Detectar si estamos en Vercel (AWS Lambda environment)
        if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
            console.log('🚀 Usando @sparticuz/chromium para Vercel...');
            launchOptions = {
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            };
            browser = await puppeteerCore.launch(launchOptions);
        } else {
            console.log('💻 Usando Puppeteer local...');
            // Fallback para local
            const puppeteer = require('puppeteer');
            browser = await puppeteer.launch(launchOptions);
        }

        const page = await browser.newPage();

        // Optimizar carga
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        const slugs = getProfessorSlugs();
        console.log(`📋 Encontrados ${slugs.length} profesores para pre-renderizar.`);

        // Crear directorio base
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        // Procesar en lotes para no saturar memoria
        const BATCH_SIZE = 5;
        for (let i = 0; i < slugs.length; i += BATCH_SIZE) {
            const batch = slugs.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${i + 1}-${Math.min(i + BATCH_SIZE, slugs.length)}...`);

            for (const slug of batch) {
                try {
                    const url = `${BASE_URL}/profesores/${slug}`;
                    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

                    // Esperar un poco extra para asegurar que React terminó de hidratar y Helmet actuó
                    await new Promise(r => setTimeout(r, 500));

                    const html = await page.content();

                    // Guardar archivo
                    // Estructura: /profesores/[slug]/index.html (para URLs limpias)
                    const slugDir = path.join(OUTPUT_DIR, slug);
                    if (!fs.existsSync(slugDir)) {
                        fs.mkdirSync(slugDir, { recursive: true });
                    }

                    fs.writeFileSync(path.join(slugDir, 'index.html'), html);
                    // console.log(`✅ Renderizado: ${slug}`);
                } catch (err) {
                    console.error(`❌ Error renderizando ${slug}:`, err.message);
                }
            }
        }

        // Generar Sitemap
        console.log('🗺️ Generando Sitemap.xml...');
        const SITE_URL = process.env.VITE_SITE_URL || 'https://evaluaprof-qcgd.vercel.app';
        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/profesores</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  ${slugs.map(slug => `
  <url>
    <loc>${SITE_URL}/profesores/${slug}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

        fs.writeFileSync(path.join(path.resolve(__dirname, '../dist'), 'sitemap.xml'), sitemapContent);
        console.log('✅ Sitemap generado en dist/sitemap.xml');
    } catch (err) {
        console.error('🔥 Error fatal:', err);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        server.kill();
        console.log('🏁 Pre-rendering finalizado.');
    }
}

main();
