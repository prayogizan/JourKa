/**
 * JourKa Cloud Queue Bridge — Google Apps Script (Single Source of Truth)
 *
 * Cara Pasang:
 * 1. Buka Google Spreadsheet yang dipakai sebagai Single Source of Truth oleh Robot UiPath.
 * 2. Pastikan sheet pertama punya header (baris 1):
 *    RecipientEmail | Job | AbroadMarkets | StudentName | EmailStatus | EmailTimestamp | ErrorMessage
 *    (Jika sheet masih kosong, script otomatis membuatkan ke-7 header tersebut).
 * 3. Buka menu: Extensions -> Apps Script.
 * 4. Tempel seluruh kode ini lalu Save.
 * 5. Klik "Deploy" -> "New deployment" -> Type: "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy Web App URL (akhiran /exec) ke Vercel Environment Variable:
 *    GOOGLE_SHEET_WEBHOOK_URL = https://script.google.com/macros/s/.../exec
 */

const DEFAULT_HEADERS = [
  'RecipientEmail',
  'Job',
  'AbroadMarkets',
  'StudentName',
  'EmailStatus',
  'EmailTimestamp',
  'ErrorMessage'
];

function getTargetSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Sheet1') || ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(DEFAULT_HEADERS);
    sheet.getRange(1, 1, 1, DEFAULT_HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function getColumnMap(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), DEFAULT_HEADERS.length);
  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  headerRow.forEach(function (name, idx) {
    const key = String(name || '').trim().toLowerCase();
    if (key) map[key] = idx;
  });

  // Fallback positional indices if custom/blank headers
  return {
    totalCols: lastCol,
    recipientEmail: map['recipientemail'] !== undefined ? map['recipientemail'] : 0,
    job: map['job'] !== undefined ? map['job'] : 1,
    abroadMarkets: map['abroadmarkets'] !== undefined ? map['abroadmarkets'] : 2,
    studentName: map['studentname'] !== undefined ? map['studentname'] : 3,
    emailStatus: map['emailstatus'] !== undefined ? map['emailstatus'] : 4,
    emailTimestamp: map['emailtimestamp'] !== undefined ? map['emailtimestamp'] : 5,
    errorMessage: map['errormessage'] !== undefined ? map['errormessage'] : 6
  };
}

function canonicalizeEmail(raw) {
  return String(raw || '')
    .split(/[;,]/)
    .map(function (t) { return t.trim().toLowerCase(); })
    .filter(Boolean)
    .filter(function (t, i, arr) { return arr.indexOf(t) === i; })
    .join(';');
}

function readAllRows(sheet, colMap) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, colMap.totalCols).getValues();
  return values
    .map(function (row, idx) {
      return {
        rowNumber: idx + 2,
        recipientEmail: String(row[colMap.recipientEmail] || ''),
        job: String(row[colMap.job] || ''),
        abroadMarkets: String(row[colMap.abroadMarkets] || ''),
        studentName: String(row[colMap.studentName] || ''),
        emailStatus: String(row[colMap.emailStatus] || ''),
        emailTimestamp: String(row[colMap.emailTimestamp] || ''),
        errorMessage: String(row[colMap.errorMessage] || '')
      };
    })
    .filter(function (r) { return r.recipientEmail.trim() !== '' || r.job.trim() !== ''; });
}

function doGet() {
  const sheet = getTargetSheet();
  const colMap = getColumnMap(sheet);
  const rows = readAllRows(sheet, colMap);
  return ContentService
    .createTextOutput(JSON.stringify({ rows: rows, checkedAt: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getTargetSheet();
    const colMap = getColumnMap(sheet);
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action || 'upsert';
    const existing = readAllRows(sheet, colMap);
    const updated = [];

    if (action === 'updateStatus' && Array.isArray(payload.statuses)) {
      payload.statuses.forEach(function (st) {
        const key = canonicalizeEmail(st.recipientEmail);
        const match = existing.find(function (r) {
          return canonicalizeEmail(r.recipientEmail) === key;
        });
        if (match) {
          sheet.getRange(match.rowNumber, colMap.emailStatus + 1).setValue(st.emailStatus || '');
          sheet.getRange(match.rowNumber, colMap.emailTimestamp + 1).setValue(st.emailTimestamp || '');
          sheet.getRange(match.rowNumber, colMap.errorMessage + 1).setValue(st.errorMessage || '');
          updated.push({ action: 'status-synced', recipientEmail: key, emailStatus: st.emailStatus });
        }
      });
    } else if (Array.isArray(payload.requests)) {
      payload.requests.forEach(function (req) {
        const key = canonicalizeEmail(req.recipientEmail);
        if (!key || !req.job) return;
        const match = existing.find(function (r) {
          return canonicalizeEmail(r.recipientEmail) === key;
        });

        if (match) {
          sheet.getRange(match.rowNumber, colMap.recipientEmail + 1).setValue(key);
          sheet.getRange(match.rowNumber, colMap.job + 1).setValue(String(req.job || ''));
          sheet.getRange(match.rowNumber, colMap.abroadMarkets + 1).setValue(String(req.abroadMarkets || ''));
          sheet.getRange(match.rowNumber, colMap.studentName + 1).setValue(String(req.studentName || 'Valued Student'));
          sheet.getRange(match.rowNumber, colMap.emailStatus + 1).setValue('');
          sheet.getRange(match.rowNumber, colMap.emailTimestamp + 1).setValue('');
          sheet.getRange(match.rowNumber, colMap.errorMessage + 1).setValue('');
          updated.push({ action: 'updated', rowNumber: match.rowNumber, recipientEmail: key, job: req.job });
        } else {
          const rowArr = new Array(colMap.totalCols).fill('');
          rowArr[colMap.recipientEmail] = key;
          rowArr[colMap.job] = String(req.job || '');
          rowArr[colMap.abroadMarkets] = String(req.abroadMarkets || '');
          rowArr[colMap.studentName] = String(req.studentName || 'Valued Student');
          sheet.appendRow(rowArr);
          updated.push({ action: 'appended', rowNumber: sheet.getLastRow(), recipientEmail: key, job: req.job });
        }
      });
    }

    const rows = readAllRows(sheet, colMap);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, updated: updated, rows: rows }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
