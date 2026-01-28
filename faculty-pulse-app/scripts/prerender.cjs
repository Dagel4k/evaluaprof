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

        // Optimizar carga y LOGGING para debug
        await page.setRequestInterception(true);

        // Log de consola del navegador (CRÍTICO para ver errores de React/Fetch)
        // Log de consola mejorado para ver objetos reales
        page.on('console', async msg => {
            try {
                const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => 'JSHandle')));
                console.log('PAGE LOG:', ...args);
            } catch (e) {
                console.log('PAGE LOG (Raw):', msg.text());
            }
        });

        page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));

        page.on('requestfailed', request => {
            console.error(`REQUEST FAILED [${request.resourceType()}]: ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`);
        });

        page.on('request', (req) => {
            const resourceType = req.resourceType();

            // Explicitly allow critical resources
            if (['document', 'script', 'xhr', 'fetch', 'stylesheet', 'other'].includes(resourceType)) {
                req.continue();
                return;
            }

            // Block heavy media to save bandwidth/time
            if (['image', 'font', 'media'].includes(resourceType)) {
                req.abort();
                return;
            }

            // Fallback: allow everything else
            req.continue();
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

                    // Esperar a que el título cambie (indicador de que Helmet actuó y los datos cargaron)
                    // El título debe contener "Evaluaciones" según ProfessorProfile.tsx
                    try {
                        await page.waitForFunction(
                            () => document.title.includes('Evaluaciones'),
                            { timeout: 10000 } // 10 segundos máximo para que cargue la metadata
                        );
                    } catch (e) {
                        console.warn(`⚠️ Warning: Timeout esperando metadata para ${slug}. Título actual: "${await page.title()}". Capturando de todos modos...`);
                    }

                    // Pequeña espera adicional para asegurar que otros meta tags se actualicen
                    await new Promise(r => setTimeout(r, 200));

                    const html = await page.content();

                    // Validación básica de que no estamos guardando una página de error o loading infinito
                    if (html.includes('Cargando datos...') && !html.includes('Evaluaciones')) {
                        console.warn(`⚠️ Warning: ${slug} parece estar en estado de carga.`);
                    }

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
