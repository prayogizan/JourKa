#!/usr/bin/env node
/**
 * JourKa Cloud Queue Sync Worker (Vercel / Google Sheets <-> UiPath Desire Role List.xlsx)
 *
 * Menarik permintaan baru dari Vercel (melalui Google Sheets Webhook) langsung ke
 * JourKa/Input/Desire Role List.xlsx, dan mengembalikan status "Sent/Failed" dari
 * Excel ke Google Sheet tanpa perlu mengubah Main.xaml.
 *
 * Cara pakai:
 *   node scripts/sync_cloud_queue.mjs --url "https://script.google.com/macros/s/.../exec"
 *   node scripts/sync_cloud_queue.mjs --url "https://script.google.com/macros/s/.../exec" --watch
 */

import path from 'path';
import { fileURLToPath } from 'url';
import {
  readDesireRolesExcel,
  upsertDesireRolesExcel
} from '../jourka-frontend/server/uipathBridge.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEL_PATH = path.resolve(__dirname, '../JourKa/Input/Desire Role List.xlsx');

function parseArgs() {
  const args = process.argv.slice(2);
  let url = process.env.GOOGLE_SHEET_WEBHOOK_URL || '';
  let watch = false;
  let intervalMs = 10000;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      url = args[++i];
    } else if (args[i] === '--watch') {
      watch = true;
    } else if (args[i] === '--interval' && args[i + 1]) {
      intervalMs = Math.max(3000, parseInt(args[++i], 10) || 10000);
    }
  }
  return { url: url.trim(), watch, intervalMs };
}

function canonicalKey(email) {
  return String(email || '')
    .split(/[;,]/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
    .filter((t, idx, arr) => arr.indexOf(t) === idx)
    .join(';');
}

async function syncOnce(webhookUrl) {
  const res = await fetch(webhookUrl, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} saat membaca Google Sheet`);
  }
  const cloudData = await res.json();
  const cloudRows = cloudData.rows || [];
  const localRows = readDesireRolesExcel(EXCEL_PATH);

  const localByEmail = new Map();
  for (const lr of localRows) {
    localByEmail.set(canonicalKey(lr.recipientEmail), lr);
  }

  // 1. Pull pending cloud requests that are missing or whose job changed without local status
  const toQueueLocally = [];
  for (const cr of cloudRows) {
    const key = canonicalKey(cr.recipientEmail);
    if (!key || !cr.job) continue;
    const localMatch = localByEmail.get(key);
    if (!localMatch || (!cr.emailStatus && localMatch.job !== cr.job)) {
      toQueueLocally.push({
        recipientEmail: key,
        job: cr.job,
        abroadMarkets: cr.abroadMarkets || '',
        studentName: cr.studentName || 'Valued Student'
      });
    }
  }

  if (toQueueLocally.length > 0) {
    const updated = upsertDesireRolesExcel(EXCEL_PATH, toQueueLocally);
    console.log(`[${new Date().toLocaleTimeString()}] + Menarik ${updated.length} request baru dari Vercel -> Desire Role List.xlsx`);
  }

  // 2. Push local UiPath statuses (Sent / Skipped / Failed) back to Google Sheet
  const statusesToPush = [];
  for (const cr of cloudRows) {
    const key = canonicalKey(cr.recipientEmail);
    const localMatch = localByEmail.get(key);
    if (
      localMatch &&
      localMatch.emailStatus &&
      localMatch.emailStatus !== cr.emailStatus &&
      localMatch.job === cr.job
    ) {
      statusesToPush.push({
        recipientEmail: key,
        emailStatus: localMatch.emailStatus,
        emailTimestamp: localMatch.emailTimestamp,
        errorMessage: localMatch.errorMessage
      });
    }
  }

  if (statusesToPush.length > 0) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', statuses: statusesToPush })
    });
    console.log(`[${new Date().toLocaleTimeString()}] ↑ Mengirim ${statusesToPush.length} status selesai dari UiPath -> Google Sheet`);
  }

  if (toQueueLocally.length === 0 && statusesToPush.length === 0) {
    console.log(`[${new Date().toLocaleTimeString()}] ✓ Sinkron (${localRows.length} baris lokal, ${cloudRows.length} baris cloud)`);
  }
}

async function main() {
  const { url, watch, intervalMs } = parseArgs();
  if (!url) {
    console.error('Error: Sertakan --url "<GOOGLE_SHEET_WEBHOOK_URL>" atau set env GOOGLE_SHEET_WEBHOOK_URL.');
    process.exit(1);
  }

  console.log(`🔄 JourKa Cloud Sync Worker aktif`);
  console.log(`   Excel Lokal : ${EXCEL_PATH}`);
  console.log(`   Cloud Sheet : ${url}`);

  await syncOnce(url);
  if (watch) {
    console.log(`👀 Watch mode aktif (cek tiap ${intervalMs / 1000} detik)... Tekan Ctrl+C untuk berhenti.`);
    setInterval(() => {
      syncOnce(url).catch(err => console.error('Sync error:', err.message));
    }, intervalMs);
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
