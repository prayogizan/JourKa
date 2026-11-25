import { dispatchToCloudBridge, getBridgeMode } from './_cloudBridge.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { requests } = req.body || {};
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ error: 'Daftar permintaan profesi kosong.' });
    }

    const mode = getBridgeMode();
    if (mode === 'none') {
      return res.status(503).json({
        bridgeConfigured: false,
        error: 'Cloud Bridge (GOOGLE_SHEET_WEBHOOK_URL atau UIPATH_ORCHESTRATOR_URL) belum disetel di Environment Variables Vercel.'
      });
    }

    const result = await dispatchToCloudBridge(requests);
    return res.status(200).json({
      success: true,
      ...result,
      message: `${result.updated.length} permintaan berhasil dikirim ke Cloud Bridge (${result.bridgeMode}) untuk Robot UiPath.`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
