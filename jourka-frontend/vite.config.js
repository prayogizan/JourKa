import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {
  scanJourkaOutput,
  readDesireRolesExcel,
  upsertDesireRolesExcel,
  buildCatalogFromRiasec
} from './server/uipathBridge.js';
import {
  dispatchToCloudBridge,
  fetchCloudQueueStatus,
  getBridgeMode
} from './api/_cloudBridge.js';

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GOOGLE_SHEET_WEBHOOK_URL && !process.env.GOOGLE_SHEET_WEBHOOK_URL) {
    process.env.GOOGLE_SHEET_WEBHOOK_URL = env.GOOGLE_SHEET_WEBHOOK_URL;
  }
  if (env.UIPATH_ORCHESTRATOR_URL && !process.env.UIPATH_ORCHESTRATOR_URL) {
    process.env.UIPATH_ORCHESTRATOR_URL = env.UIPATH_ORCHESTRATOR_URL;
  }

  return {
    plugins: [
      react(),
      {
        name: 'jourka-uipath-bridge',
        configureServer(server) {
          const outputDir = path.resolve(__dirname, '../JourKa/Output');
          const excelPath = path.resolve(__dirname, '../JourKa/Input/Desire Role List.xlsx');
          const rolesJsonPath = path.resolve(__dirname, './src/data/roles.json');

          server.middlewares.use(async (req, res, next) => {
            if (!req.url) return next();
            const urlPath = req.url.split('?')[0];
            const cloudMode = getBridgeMode();

            // 1. Live Two-Way API: GET /api/roles (Dynamic catalog from JourKa/Output/)
            if (urlPath === '/api/roles' && req.method === 'GET') {
              try {
                const catalog = scanJourkaOutput(outputDir, rolesJsonPath);
                return sendJson(res, 200, catalog);
              } catch (err) {
                return sendJson(res, 500, { error: err.message });
              }
            }

            // 2. Live Two-Way API: GET /api/queue-status
            // Uses Google Sheets Single Source of Truth if configured, else local Desire Role List.xlsx
            if (urlPath === '/api/queue-status' && req.method === 'GET') {
              try {
                if (cloudMode !== 'none') {
                  const status = await fetchCloudQueueStatus();
                  return sendJson(res, 200, { ...status, checkedAt: new Date().toISOString() });
                }
                const rows = readDesireRolesExcel(excelPath);
                return sendJson(res, 200, { bridgeMode: 'local-excel', rows, checkedAt: new Date().toISOString() });
              } catch (err) {
                return sendJson(res, 500, { error: err.message });
              }
            }

            // 3. Live Two-Way API: POST /api/riasec-recommendations
            if (urlPath === '/api/riasec-recommendations' && req.method === 'POST') {
              try {
                const body = await readJsonBody(req);
                const { profile, preferences, studentInfo, autoQueueToUiPath } = body;
                const catalog = buildCatalogFromRiasec(profile, preferences, outputDir, rolesJsonPath);

                let queuedToUiPath = null;
                const cleanEmail = (studentInfo?.email || '').trim();
                if (autoQueueToUiPath && cleanEmail.includes('@') && catalog.topRiasecSuggestedRoles.length > 0) {
                  const topJob = catalog.topRiasecSuggestedRoles[0];
                  const queueReq = [{
                    recipientEmail: cleanEmail,
                    job: topJob,
                    abroadMarkets: '',
                    studentName: studentInfo?.name || 'Valued Student'
                  }];
                  if (cloudMode !== 'none') {
                    const cloudRes = await dispatchToCloudBridge(queueReq);
                    queuedToUiPath = { job: topJob, recipientEmail: cleanEmail, bridgeMode: cloudMode, updated: cloudRes.updated };
                  } else {
                    const updated = upsertDesireRolesExcel(excelPath, queueReq);
                    queuedToUiPath = { job: topJob, recipientEmail: cleanEmail, bridgeMode: 'local-excel', updated };
                  }
                }

                return sendJson(res, 200, {
                  ...catalog,
                  queuedToUiPath
                });
              } catch (err) {
                return sendJson(res, 500, { error: err.message });
              }
            }

            // 4. Live Two-Way API: POST /api/queue-role
            if (urlPath === '/api/queue-role' && req.method === 'POST') {
              try {
                const body = await readJsonBody(req);
                const { requests } = body;
                if (!Array.isArray(requests) || requests.length === 0) {
                  return sendJson(res, 400, { error: 'Daftar permintaan profesi kosong.' });
                }

                if (cloudMode !== 'none') {
                  const cloudRes = await dispatchToCloudBridge(requests);
                  return sendJson(res, 200, {
                    success: true,
                    ...cloudRes,
                    message: `${cloudRes.updated.length} permintaan berhasil dikirim ke Google Spreadsheet Single Source of Truth (${cloudRes.bridgeMode}).`
                  });
                }

                const updated = upsertDesireRolesExcel(excelPath, requests);
                const rows = readDesireRolesExcel(excelPath);
                return sendJson(res, 200, {
                  success: true,
                  bridgeMode: 'local-excel',
                  updated,
                  rows,
                  message: `${updated.length} permintaan berhasil dikirim ke antrean Robot UiPath (Desire Role List.xlsx).`
                });
              } catch (err) {
                return sendJson(res, 500, { error: err.message });
              }
            }

            // 5. Serve UiPath-generated HTML/PDF dossiers directly without leaving app
            if (urlPath.startsWith('/dossiers/') || urlPath.startsWith('/Output/')) {
              const cleanPath = urlPath.replace(/^\/(dossiers|Output)\//, '');
              const decodedRelative = decodeURIComponent(cleanPath);
              const targetFile = path.resolve(outputDir, decodedRelative);

              if (targetFile.startsWith(outputDir) && fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
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
  };
});
