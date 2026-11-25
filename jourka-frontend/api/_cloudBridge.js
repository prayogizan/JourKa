import fs from 'fs';
import path from 'path';

export function loadStaticCatalog() {
  const rolesPath = path.resolve(process.cwd(), 'src/data/roles.json');
  const raw = fs.readFileSync(rolesPath, 'utf8');
  return JSON.parse(raw);
}

export function rankCatalogForRiasec(profile, catalog) {
  const scores = profile?.scores || {};
  const topDims = profile?.topDimensions || [];
  const ranked = (catalog.roles || [])
    .map(role => {
      let riasecSum = 0;
      let weightSum = 0;
      for (const [dim, w] of Object.entries(role.riasec_weights || {})) {
        riasecSum += (scores[dim] || 0) * w;
        weightSum += w;
      }
      const rScore = weightSum > 0 ? riasecSum / weightSum : 50;
      const bonus = topDims.some(d => (role.riasec_weights?.[d] || 0) >= 0.7) ? 12 : 0;
      return { role, score: rScore + bonus };
    })
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, 3).map(x => x.role.title);
}

export function getBridgeMode() {
  if (process.env.GOOGLE_SHEET_WEBHOOK_URL) return 'google-sheets-webhook';
  if (process.env.UIPATH_ORCHESTRATOR_URL && process.env.UIPATH_ACCESS_TOKEN) return 'uipath-orchestrator';
  return 'none';
}

export async function dispatchToCloudBridge(requests) {
  const mode = getBridgeMode();

  if (mode === 'google-sheets-webhook') {
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL.trim();
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', requests })
    });
    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Google Apps Script returned non-JSON response (${res.status}). Pastikan Web App Access diset "Anyone".`);
    }
    if (!res.ok || parsed.error) {
      throw new Error(parsed.error || `Google Sheets Webhook error (${res.status})`);
    }
    return {
      bridgeMode: mode,
      updated: parsed.updated || requests,
      rows: parsed.rows || []
    };
  }

  if (mode === 'uipath-orchestrator') {
    const baseUrl = process.env.UIPATH_ORCHESTRATOR_URL.replace(/\/$/, '');
    const token = process.env.UIPATH_ACCESS_TOKEN.trim();
    const folderId = (process.env.UIPATH_FOLDER_ID || '').trim();
    const queueName = (process.env.UIPATH_QUEUE_NAME || 'JourKa_Career_Requests').trim();

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
    if (folderId) {
      headers['X-UIPATH-OrganizationUnitId'] = folderId;
    }

    const updated = [];
    for (const reqItem of requests) {
      const payload = {
        itemData: {
          Name: queueName,
          Priority: 'Normal',
          Reference: `${reqItem.recipientEmail}|${reqItem.job}`.slice(0, 128),
          SpecificContent: {
            RecipientEmail: reqItem.recipientEmail,
            Job: reqItem.job,
            AbroadMarkets: reqItem.abroadMarkets || '',
            StudentName: reqItem.studentName || 'Valued Student'
          }
        }
      };

      const res = await fetch(`${baseUrl}/odata/Queues/UiPathODataServices.AddQueueItem`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`UiPath Orchestrator API error (${res.status}): ${errBody.slice(0, 200)}`);
      }
      updated.push({
        action: 'orchestrator-queued',
        recipientEmail: reqItem.recipientEmail,
        job: reqItem.job
      });
    }

    return {
      bridgeMode: mode,
      updated,
      rows: updated.map((u, idx) => ({
        rowNumber: idx + 1,
        recipientEmail: u.recipientEmail,
        job: u.job,
        emailStatus: 'Queued in Orchestrator'
      }))
    };
  }

  return {
    bridgeMode: 'none',
    updated: [],
    rows: []
  };
}

export async function fetchCloudQueueStatus() {
  const mode = getBridgeMode();

  if (mode === 'google-sheets-webhook') {
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL.trim();
    const res = await fetch(webhookUrl, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Gagal membaca Google Sheets status (${res.status})`);
    }
    const data = await res.json();
    return { bridgeMode: mode, rows: data.rows || [] };
  }

  if (mode === 'uipath-orchestrator') {
    const baseUrl = process.env.UIPATH_ORCHESTRATOR_URL.replace(/\/$/, '');
    const token = process.env.UIPATH_ACCESS_TOKEN.trim();
    const folderId = (process.env.UIPATH_FOLDER_ID || '').trim();
    const headers = { Authorization: `Bearer ${token}` };
    if (folderId) headers['X-UIPATH-OrganizationUnitId'] = folderId;

    const res = await fetch(`${baseUrl}/odata/QueueItems?$top=10&$orderby=CreationTime desc`, { headers });
    if (!res.ok) {
      throw new Error(`Gagal membaca Orchestrator QueueItems (${res.status})`);
    }
    const data = await res.json();
    const rows = (data.value || []).map((item, idx) => ({
      rowNumber: idx + 1,
      recipientEmail: item.SpecificContent?.RecipientEmail || item.Reference || '-',
      job: item.SpecificContent?.Job || '-',
      emailStatus: item.Status || 'New'
    }));
    return { bridgeMode: mode, rows };
  }

  return { bridgeMode: 'none', rows: [] };
}
