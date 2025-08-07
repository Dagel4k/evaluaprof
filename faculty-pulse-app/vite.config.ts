import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import type { Connect } from 'vite';
import type { ServerResponse } from 'http';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    fs: {
      // Permitir acceso a archivos fuera del directorio del proyecto
      allow: ['..']
    }
  },
  plugins: [
    react(),
    {
      name: 'serve-json-files',
      configureServer(server) {
        // Endpoint para obtener la lista de archivos JSON
        server.middlewares.use('/api/professors-list', (req: Connect.IncomingMessage, res: ServerResponse) => {
          try {
            const professorsDir = path.resolve(__dirname, '../scraper/out/profesores_enriquecido');
            console.log('Buscando archivos en:', professorsDir);
            
            if (!fs.existsSync(professorsDir)) {
              console.error('Directorio no encontrado:', professorsDir);
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Directorio no encontrado' }));
              return;
            }
            
            const files = fs.readdirSync(professorsDir)
              .filter(file => file.endsWith('.json'))
              .map(file => file);
            
            console.log(`Encontrados ${files.length} archivos JSON:`, files);
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(files));
          } catch (error) {
            console.error('Error leyendo directorio:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Error interno del servidor' }));
          }
        });

        // Middleware para servir archivos JSON individuales
        server.middlewares.use('/scraper/out/profesores_enriquecido/', (req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          const url = req.url;
          console.log('URL original:', url);
          
          if (!url) {
            console.log('URL vacía, pasando al siguiente middleware');
            return next();
          }
          
          // Extraer el nombre del archivo de la URL
          // La URL será algo como: /scraper/out/profesores_enriquecido/Aaron_Cuen_Marquez.json
          const urlParts = url.split('/');
          const filename = urlParts[urlParts.length - 1]; // Obtener el último elemento
          
          console.log('Nombre del archivo extraído:', filename);
          
          // Decodificar caracteres especiales en el nombre del archivo
          const decodedFilename = decodeURIComponent(filename);
          console.log('Nombre del archivo decodificado:', decodedFilename);
          
          // Construir la ruta completa
          const professorsDir = path.resolve(__dirname, '../scraper/out/profesores_enriquecido');
          const fullPath = path.join(professorsDir, decodedFilename);
          
          console.log('Directorio de profesores:', professorsDir);
          console.log('Ruta completa del archivo:', fullPath);
          console.log('¿Existe el archivo?', fs.existsSync(fullPath));
          
          // Verificar que el archivo existe y está dentro del directorio permitido
          if (fs.existsSync(fullPath) && fullPath.startsWith(professorsDir)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(content);
              console.log(`Archivo servido exitosamente: ${decodedFilename}`);
            } catch (error) {
              console.error(`Error leyendo archivo ${decodedFilename}:`, error);
              res.statusCode = 500;
              res.end('Internal Server Error');
            }
          } else {
            console.warn(`Archivo no encontrado: ${fullPath}`);
            console.warn(`¿Está dentro del directorio permitido?`, fullPath.startsWith(professorsDir));
            res.statusCode = 404;
            res.end('File not found');
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-toast'],
          charts: ['recharts', 'react-wordcloud'],
        },
      },
    },
  },
  publicDir: "public",
  // Configurar para servir archivos desde la carpeta scraper
  assetsInclude: ['**/*.json'],
});
