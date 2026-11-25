import { loadStaticCatalog } from './_cloudBridge.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const catalog = loadStaticCatalog();
    return res.status(200).json({
      ...catalog,
      syncedAt: new Date().toISOString(),
      source: 'vercel-catalog'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
