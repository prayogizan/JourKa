import {
  loadStaticCatalog,
  rankCatalogForRiasec,
  dispatchToCloudBridge,
  getBridgeMode
} from './_cloudBridge.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profile, studentInfo, autoQueueToUiPath } = req.body || {};
    const catalog = loadStaticCatalog();
    const topRiasecSuggestedRoles = rankCatalogForRiasec(profile, catalog);

    let queuedToUiPath = null;
    const cleanEmail = (studentInfo?.email || '').trim();
    const bridgeMode = getBridgeMode();

    if (autoQueueToUiPath && cleanEmail.includes('@') && topRiasecSuggestedRoles.length > 0 && bridgeMode !== 'none') {
      const topJob = topRiasecSuggestedRoles[0];
      const dispatchResult = await dispatchToCloudBridge([
        {
          recipientEmail: cleanEmail,
          job: topJob,
          abroadMarkets: '',
          studentName: studentInfo?.name || 'Valued Student'
        }
      ]);
      queuedToUiPath = {
        job: topJob,
        recipientEmail: cleanEmail,
        bridgeMode,
        updated: dispatchResult.updated
      };
    }

    return res.status(200).json({
      ...catalog,
      topRiasecSuggestedRoles,
      queuedToUiPath,
      bridgeMode,
      syncedAt: new Date().toISOString(),
      source: 'riasec-uipath-dynamic'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
