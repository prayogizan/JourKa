import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-jourka-output-dossiers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/dossiers/') || req.url.startsWith('/Output/'))) {
            const cleanPath = req.url.replace(/^\/(dossiers|Output)\//, '');
            const decodedRelative = decodeURIComponent(cleanPath.split('?')[0]);
            const targetFile = path.resolve(__dirname, '../JourKa/Output', decodedRelative);

            if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
              const ext = path.extname(targetFile).toLowerCase();
              const mimeTypes = {
                '.html': 'text/html; charset=utf-8',
                '.pdf': 'application/pdf',
                '.md': 'text/markdown; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.js': 'application/javascript; charset=utf-8',
                '.json': 'application/json; charset=utf-8',
                '.jpg': 'image/jpeg',
                '.png': 'image/png',
                '.svg': 'image/svg+xml'
              };
              res.setHeader('Content-Type', mimeTypes[ext] || 'text/html; charset=utf-8');
              return fs.createReadStream(targetFile).pipe(res);
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3000,
    open: false,
    fs: {
      allow: ['..']
    }
  }
});
