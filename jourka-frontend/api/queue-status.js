import { fetchCloudQueueStatus } from './_cloudBridge.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = await fetchCloudQueueStatus();
    return res.status(200).json({
      ...status,
      checkedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, rows: [] });
  }
}
