import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Build CRC32 lookup table once for pure-Node ZIP creation
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function decodeXml(str) {
  return String(str ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Parse a standard ZIP archive buffer into an ordered array of { name, data, method, dosTime, dosDate }.
 */
function readZipEntries(zipBuffer) {
  let eocdOffset = -1;
  for (let i = zipBuffer.length - 22; i >= Math.max(0, zipBuffer.length - 65557); i--) {
    if (zipBuffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Invalid XLSX/ZIP archive: EOCD record not found.');
  }

  const totalEntries = zipBuffer.readUInt16LE(eocdOffset + 10);
  let cdOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
  const entries = [];

  for (let i = 0; i < totalEntries; i++) {
    if (zipBuffer.readUInt32LE(cdOffset) !== 0x02014b50) {
      throw new Error('Corrupt ZIP Central Directory header.');
    }
    const method = zipBuffer.readUInt16LE(cdOffset + 10);
    const dosTime = zipBuffer.readUInt16LE(cdOffset + 12);
    const dosDate = zipBuffer.readUInt16LE(cdOffset + 14);
    const compSize = zipBuffer.readUInt32LE(cdOffset + 20);
    const nameLen = zipBuffer.readUInt16LE(cdOffset + 28);
    const extraLen = zipBuffer.readUInt16LE(cdOffset + 30);
    const commentLen = zipBuffer.readUInt16LE(cdOffset + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(cdOffset + 42);
    const name = zipBuffer.subarray(cdOffset + 46, cdOffset + 46 + nameLen).toString('utf8');

    const localNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const rawData = zipBuffer.subarray(dataStart, dataStart + compSize);

    let data;
    if (method === 0) {
      data = Buffer.from(rawData);
    } else if (method === 8) {
      data = zlib.inflateRawSync(rawData);
    } else {
      throw new Error(`Unsupported ZIP compression method ${method} for ${name}`);
    }

    entries.push({ name, data, dosTime, dosDate });
    cdOffset += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

/**
 * Rebuild a valid ZIP archive buffer from entries [{ name, data, dosTime, dosDate }].
 */
function buildZipBuffer(entries) {
  const localParts = [];
  const cdParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const uncompressed = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const compressed = zlib.deflateRawSync(uncompressed);
    const crc = crc32(uncompressed);
    const dosTime = entry.dosTime ?? 0;
    const dosDate = entry.dosDate ?? 0x5421;

    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4); // version needed
    lfh.writeUInt16LE(0x0800, 6); // UTF-8 flag
    lfh.writeUInt16LE(8, 8); // deflate
    lfh.writeUInt16LE(dosTime, 10);
    lfh.writeUInt16LE(dosDate, 12);
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(compressed.length, 18);
    lfh.writeUInt32LE(uncompressed.length, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28);

    localParts.push(lfh, nameBuf, compressed);

    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0);
    cdh.writeUInt16LE(20, 4);
    cdh.writeUInt16LE(20, 6);
    cdh.writeUInt16LE(0x0800, 8);
    cdh.writeUInt16LE(8, 10);
    cdh.writeUInt16LE(dosTime, 12);
    cdh.writeUInt16LE(dosDate, 14);
    cdh.writeUInt32LE(crc, 16);
    cdh.writeUInt32LE(compressed.length, 20);
    cdh.writeUInt32LE(uncompressed.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt16LE(0, 30);
    cdh.writeUInt16LE(0, 32);
    cdh.writeUInt16LE(0, 34);
    cdh.writeUInt16LE(0, 36);
    cdh.writeUInt32LE(0, 38);
    cdh.writeUInt32LE(offset, 42);

    cdParts.push(cdh, nameBuf);
    offset += lfh.length + nameBuf.length + compressed.length;
  }

  const cdBuffer = Buffer.concat(cdParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, cdBuffer, eocd]);
}

function parseSharedStrings(xmlStr) {
  const strings = [];
  const siRegex = /<x:si\b[^>]*>([\s\S]*?)<\/x:si>|<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let match;
  while ((match = siRegex.exec(xmlStr)) !== null) {
    const inner = match[1] ?? match[2] ?? '';
    const tParts = [];
    const tRegex = /<(?:x:)?t\b[^>]*>([\s\S]*?)<\/(?:x:)?t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(inner)) !== null) {
      tParts.push(decodeXml(tMatch[1]));
    }
    strings.push(tParts.join(''));
  }
  return strings;
}

function parseSheetRows(sheetXml, sharedStrings) {
  const rows = [];
  const rowRegex = /<(?:x:)?row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/(?:x:)?row>/g;
  let rMatch;

  while ((rMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowNumber = parseInt(rMatch[1], 10);
    const rowInner = rMatch[2];
    const cells = {};
    const cellRegex = /<(?:x:)?c\b([^>]*)>([\s\S]*?)<\/(?:x:)?c>/g;
    let cMatch;

    while ((cMatch = cellRegex.exec(rowInner)) !== null) {
      const attrs = cMatch[1];
      const cellInner = cMatch[2];
      const refMatch = attrs.match(/\br="([A-Z]+)\d+"/);
      if (!refMatch) continue;
      const col = refMatch[1];
      const typeMatch = attrs.match(/\bt="([^"]+)"/);
      const cellType = typeMatch ? typeMatch[1] : '';

      let value = '';
      if (cellType === 's') {
        const vMatch = cellInner.match(/<(?:x:)?v[^>]*>(\d+)<\/(?:x:)?v>/);
        if (vMatch) {
          value = sharedStrings[parseInt(vMatch[1], 10)] ?? '';
        }
      } else if (cellType === 'inlineStr') {
        const tMatch = cellInner.match(/<(?:x:)?t[^>]*>([\s\S]*?)<\/(?:x:)?t>/);
        value = tMatch ? decodeXml(tMatch[1]) : '';
      } else {
        const vMatch = cellInner.match(/<(?:x:)?v[^>]*>([\s\S]*?)<\/(?:x:)?v>/);
        value = vMatch ? decodeXml(vMatch[1]) : '';
      }
      cells[col] = value;
    }

    rows.push({ rowNumber, cells });
  }

  return rows;
}

/**
 * Reads all data rows (excluding header row 1) from JourKa/Input/Desire Role List.xlsx.
 */
export function readDesireRolesExcel(excelPath) {
  if (!fs.existsSync(excelPath)) {
    throw new Error(`File Excel UiPath tidak ditemukan: ${excelPath}`);
  }
  const zipBuf = fs.readFileSync(excelPath);
  const entries = readZipEntries(zipBuf);
  const ssEntry = entries.find(e => e.name === 'xl/sharedStrings.xml');
  const s1Entry = entries.find(e => e.name === 'xl/worksheets/sheet1.xml');
  if (!s1Entry) {
    throw new Error('Sheet1 tidak ditemukan di Desire Role List.xlsx');
  }

  const sharedStrings = ssEntry ? parseSharedStrings(ssEntry.data.toString('utf8')) : [];
  const parsedRows = parseSheetRows(s1Entry.data.toString('utf8'), sharedStrings);

  return parsedRows
    .filter(r => r.rowNumber >= 2)
    .filter(r => (r.cells.A || '').trim() !== '' || (r.cells.B || '').trim() !== '')
    .map(r => ({
      rowNumber: r.rowNumber,
      recipientEmail: r.cells.A || '',
      job: r.cells.B || '',
      abroadMarkets: r.cells.C || '',
      studentName: r.cells.D || '',
      emailStatus: r.cells.E || '',
      emailTimestamp: r.cells.F || '',
      errorMessage: r.cells.G || ''
    }));
}

function canonicalizeEmailKey(raw) {
  return String(raw || '')
    .split(/[;,]/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .join(';');
}

/**
 * Upserts queued student role requests directly into JourKa/Input/Desire Role List.xlsx.
 * Preserves existing styles, sheet2 instructions, frozen panes, and existing rows.
 */
export function upsertDesireRolesExcel(excelPath, requests) {
  if (!fs.existsSync(excelPath)) {
    throw new Error(`File Excel UiPath tidak ditemukan: ${excelPath}`);
  }

  const zipBuf = fs.readFileSync(excelPath);
  const entries = readZipEntries(zipBuf);
  const ssEntry = entries.find(e => e.name === 'xl/sharedStrings.xml');
  const s1Entry = entries.find(e => e.name === 'xl/worksheets/sheet1.xml');

  if (!ssEntry || !s1Entry) {
    throw new Error('Struktur Desire Role List.xlsx tidak lengkap (sharedStrings/sheet1).');
  }

  let ssXml = ssEntry.data.toString('utf8');
  let s1Xml = s1Entry.data.toString('utf8');

  const sharedStrings = parseSharedStrings(ssXml);
  const parsedRows = parseSheetRows(s1Xml, sharedStrings);

  const getOrAddStringIndex = (text) => {
    const val = String(text ?? '');
    let idx = sharedStrings.indexOf(val);
    if (idx === -1) {
      idx = sharedStrings.length;
      sharedStrings.push(val);
      const newSi = `<x:si><x:t>${escapeXml(val)}</x:t></x:si>`;
      ssXml = ssXml.replace('</x:sst>', `${newSi}</x:sst>`);
    }
    return idx;
  };

  const buildRowXml = (rowNum, rowObj) => {
    const idxA = getOrAddStringIndex(rowObj.recipientEmail);
    const idxB = getOrAddStringIndex(rowObj.job);
    const idxC = getOrAddStringIndex(rowObj.abroadMarkets || '');
    const idxD = getOrAddStringIndex(rowObj.studentName || '');
    const idxE = getOrAddStringIndex(''); // Clear status so UiPath processes it
    const idxF = getOrAddStringIndex('');
    const idxG = getOrAddStringIndex('');
    return `<x:row r="${rowNum}" spans="1:7">` +
      `<x:c r="A${rowNum}" s="0" t="s"><x:v>${idxA}</x:v></x:c>` +
      `<x:c r="B${rowNum}" s="0" t="s"><x:v>${idxB}</x:v></x:c>` +
      `<x:c r="C${rowNum}" s="0" t="s"><x:v>${idxC}</x:v></x:c>` +
      `<x:c r="D${rowNum}" s="0" t="s"><x:v>${idxD}</x:v></x:c>` +
      `<x:c r="E${rowNum}" s="0" t="s"><x:v>${idxE}</x:v></x:c>` +
      `<x:c r="F${rowNum}" s="0" t="s"><x:v>${idxF}</x:v></x:c>` +
      `<x:c r="G${rowNum}" s="0" t="s"><x:v>${idxG}</x:v></x:c>` +
      `</x:row>`;
  };

  let maxRow = parsedRows.reduce((m, r) => Math.max(m, r.rowNumber), 1);
  const results = [];

  for (const req of requests) {
    const canonical = canonicalizeEmailKey(req.recipientEmail);
    if (!canonical || !req.job) continue;

    // Check if canonical primary key email already exists on Sheet1
    const existing = parsedRows.find(
      r => r.rowNumber >= 2 && canonicalizeEmailKey(r.cells.A) === canonical
    );

    if (existing) {
      const updatedXml = buildRowXml(existing.rowNumber, {
        recipientEmail: canonical,
        job: req.job,
        abroadMarkets: req.abroadMarkets || '',
        studentName: req.studentName || ''
      });
      const existingRowRegex = new RegExp(
        `<(?:x:)?row\\b[^>]*r="${existing.rowNumber}"[^>]*>[\\s\\S]*?<\\/(?:x:)?row>`
      );
      s1Xml = s1Xml.replace(existingRowRegex, updatedXml);
      existing.cells.B = req.job;
      results.push({ action: 'updated', rowNumber: existing.rowNumber, recipientEmail: canonical, job: req.job });
    } else {
      maxRow += 1;
      const newRowXml = buildRowXml(maxRow, {
        recipientEmail: canonical,
        job: req.job,
        abroadMarkets: req.abroadMarkets || '',
        studentName: req.studentName || ''
      });
      s1Xml = s1Xml.replace('</x:sheetData>', `${newRowXml}</x:sheetData>`);
      parsedRows.push({
        rowNumber: maxRow,
        cells: { A: canonical, B: req.job, C: req.abroadMarkets || '', D: req.studentName || '' }
      });
      results.push({ action: 'appended', rowNumber: maxRow, recipientEmail: canonical, job: req.job });
    }
  }

  // Update Sheet1 dimension tag cleanly
  s1Xml = s1Xml.replace(/<(?:x:)?dimension ref="[^"]*"\s*\/>/, `<x:dimension ref="A1:G${maxRow}" />`);

  // Update count/uniqueCount if present on sst root
  ssXml = ssXml.replace(/\buniqueCount="\d+"/, `uniqueCount="${sharedStrings.length}"`);

  ssEntry.data = Buffer.from(ssXml, 'utf8');
  s1Entry.data = Buffer.from(s1Xml, 'utf8');

  const updatedZip = buildZipBuffer(entries);
  fs.writeFileSync(excelPath, updatedZip);

  return results;
}

function cleanMarkdown(text) {
  return String(text || '')
    .replace(/\[[A-Z0-9,\s]+\]/g, '')
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferDomainProfile(roleName, mdContent) {
  const titleLower = roleName.toLowerCase();
  const fullLower = `${roleName} ${mdContent.slice(0, 600)}`.toLowerCase();

  // 1. Check role title first for deterministic domain matching
  if (titleLower.includes('video') || titleLower.includes('editor') || titleLower.includes('desain') || titleLower.includes('design') || titleLower.includes('ui/ux') || titleLower.includes('animasi')) {
    return {
      majorId: 'dkv',
      riasec: { R: 0.5, I: 0.2, A: 0.9, S: 0.2, E: 0.3, C: 0.2 },
      prefEnv: ['creative_studio', 'remote_flexible'],
      prefPath: ['vokasi_politeknik', 'bootcamp_training', 'direct_work'],
      relatedMajors: ['Desain Komunikasi Visual (DKV)', 'Desain Film & Media Kreatif'],
      altPathway: 'Kursus Spesialis & Showreel Portofolio (Behance/YouTube)'
    };
  }
  if (titleLower.includes('apoteker') || titleLower.includes('farmasi') || titleLower.includes('perawat') || titleLower.includes('dokter') || titleLower.includes('medis')) {
    return {
      majorId: 'farmasi',
      riasec: { R: 0.3, I: 0.8, A: 0.1, S: 0.7, E: 0.2, C: 0.7 },
      prefEnv: ['structured_lab', 'corporate_business'],
      prefPath: ['s1_academic'],
      relatedMajors: ['Farmasi (S1)', 'Ilmu Kesehatan / Biologi Medis'],
      altPathway: 'D3 Farmasi untuk Tenaga Teknis Kefarmasian (TTK)'
    };
  }
  if (titleLower.includes('kotlin') || titleLower.includes('multiplatform')) {
    return {
      majorId: 'ti',
      riasec: { R: 0.4, I: 0.85, A: 0.1, S: 0.1, E: 0.2, C: 0.4 },
      prefEnv: ['remote_flexible', 'corporate_business'],
      prefPath: ['s1_academic', 'vokasi_politeknik'],
      relatedMajors: ['Teknik Informatika', 'Ilmu Komputer'],
      altPathway: 'Spesialisasi Android & Multiplatform (Kotlin / Jetpack Compose)'
    };
  }
  if (titleLower.includes('android') || titleLower.includes('mobile') || titleLower.includes('software') || titleLower.includes('developer') || titleLower.includes('engineer') || titleLower.includes('data') || titleLower.includes('cyber') || titleLower.includes('ai')) {
    return {
      majorId: 'ti',
      riasec: { R: 0.4, I: 0.8, A: 0.2, S: 0.1, E: 0.2, C: 0.3 },
      prefEnv: ['remote_flexible', 'corporate_business'],
      prefPath: ['s1_academic', 'vokasi_politeknik', 'bootcamp_training'],
      relatedMajors: ['Teknik Informatika', 'Rekayasa Perangkat Lunak', 'Sistem Informasi'],
      altPathway: 'Google Bangkit Academy / Bootcamp Intensif + Portofolio GitHub'
    };
  }
  if (titleLower.includes('bisnis') || titleLower.includes('product') || titleLower.includes('marketing') || titleLower.includes('analyst') || titleLower.includes('akuntan') || titleLower.includes('manajemen')) {
    return {
      majorId: 'si',
      riasec: { R: 0.2, I: 0.7, A: 0.2, S: 0.5, E: 0.8, C: 0.6 },
      prefEnv: ['corporate_business', 'remote_flexible'],
      prefPath: ['s1_academic', 'vokasi_politeknik', 'bootcamp_training'],
      relatedMajors: ['Sistem Informasi & Bisnis Digital', 'Manajemen / Ekonomi'],
      altPathway: 'Sertifikasi Analitik Bisnis / Digital Marketing + Studi Kasus Portofolio'
    };
  }

  // 2. Fallback to dossier text cues if custom/unfamiliar title
  if (fullLower.includes('farmasi') || fullLower.includes('klinis')) {
    return {
      majorId: 'farmasi',
      riasec: { R: 0.3, I: 0.8, A: 0.1, S: 0.7, E: 0.2, C: 0.7 },
      prefEnv: ['structured_lab', 'corporate_business'],
      prefPath: ['s1_academic'],
      relatedMajors: ['Farmasi (S1)', 'Ilmu Kesehatan'],
      altPathway: 'Jalur Sertifikasi Profesi Terkait'
    };
  }

  return {
    majorId: 'si',
    riasec: { R: 0.3, I: 0.6, A: 0.4, S: 0.4, E: 0.6, C: 0.5 },
    prefEnv: ['corporate_business', 'remote_flexible'],
    prefPath: ['s1_academic', 'vokasi_politeknik', 'bootcamp_training'],
    relatedMajors: ['Sistem Informasi & Bisnis Digital', 'Manajemen / Teknik'],
    altPathway: 'Pelatihan Spesialis & Portofolio Proyek Mandiri'
  };
}

/**
 * Dynamically scans JourKa/Output/ for all UiPath-generated career dossiers,
 * updates src/data/roles.json cache, and returns the fresh catalog.
 */
export function scanJourkaOutput(outputDir, targetJsonPath) {
  const majorsMap = {
    ti: {
      id: 'ti',
      name: 'Teknik Informatika / Ilmu Komputer',
      type: 'S1 Akademik / D4 Terapan',
      top_match_dimensions: ['I', 'R'],
      description: 'Mempelajari algoritma, rekayasa perangkat lunak, arsitektur sistem, dan AI untuk membangun platform digital.',
      key_subjects: ['Struktur Data & Algoritma', 'Pemrograman Native & Web', 'Basis Data', 'Jaringan & Keamanan'],
      career_links: []
    },
    dkv: {
      id: 'dkv',
      name: 'Desain Komunikasi Visual (DKV) & Media',
      type: 'S1 Akademik / D4 Vokasi',
      top_match_dimensions: ['A', 'R'],
      description: 'Mengolah cerita dan pesan visual melalui video editing, motion graphics, ilustrasi digital, dan branding.',
      key_subjects: ['Digital Video Editing', 'Tipografi & Estetika', 'Audio Visual Storytelling', 'Motion Design'],
      career_links: []
    },
    farmasi: {
      id: 'farmasi',
      name: 'Farmasi & Farmakologi Klinis',
      type: 'S1 Farmasi + Program Profesi',
      top_match_dimensions: ['I', 'S', 'C'],
      description: 'Mempelajari formulasi obat, biokimia medis, pelayanan resep klinis, serta kepatuhan regulasi BPOM/Kemenkes.',
      key_subjects: ['Kimia Farmasi', 'Farmakologi & Toksikologi', 'Teknologi Sediaan Obat', 'Farmasi Rumah Sakit'],
      career_links: []
    },
    si: {
      id: 'si',
      name: 'Sistem Informasi & Bisnis Digital',
      type: 'S1 Akademik',
      top_match_dimensions: ['I', 'E', 'C'],
      description: 'Menghubungkan proses bisnis modern dengan solusi arsitektur teknologi informasi dan manajemen data.',
      key_subjects: ['Analisis & Desain Sistem', 'Manajemen Proyek TI', 'Enterprise Architecture', 'E-Commerce Strategy'],
      career_links: []
    }
  };

  const roles = [];
  if (fs.existsSync(outputDir)) {
    const entries = fs.readdirSync(outputDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const dir of entries) {
      const roleName = dir.name;
      const roleDir = path.join(outputDir, roleName);
      const idMdPath = path.join(roleDir, `${roleName} - ID.md`);
      const htmlFile = `${roleName} - ID.html`;
      const pdfFile = `${roleName} - ID.pdf`;
      const hasHtml = fs.existsSync(path.join(roleDir, htmlFile));

      let mdContent = '';
      let brief = 'Membangun dan mengembangkan solusi profesional sesuai riset pasar kerja terkini.';
      let degreeVerdict = 'S1/D4 Sangat Dianjurkan (Bisa Jalur Portofolio)';
      let salary = 'Rp 5.500.000 - Rp 9.000.000 (Entry-Level)';

      if (fs.existsSync(idMdPath)) {
        mdContent = fs.readFileSync(idMdPath, 'utf8').replace(/^\uFEFF/, '');

        // Extract executive summary sentences from Section 1
        const sec1Match = mdContent.match(/## 1\.\s*Deskripsi Peran[^\n]*\n+([\s\S]*?)(?=\n+###|\n+##|$)/);
        if (sec1Match) {
          const cleaned = cleanMarkdown(sec1Match[1]);
          const sentences = cleaned.split('. ').map(s => s.trim()).filter(Boolean);
          if (sentences.length >= 2) {
            brief = `${sentences[0]}. ${sentences[1].replace(/\.$/, '')}.`;
          } else if (sentences.length === 1) {
            brief = `${sentences[0].replace(/\.$/, '')}.`;
          }
        }

        // Extract degree requirement verdict
        const degMatch = mdContent.match(/###[^\n]*(?:Pendidikan|Gelar|Kualifikasi)[^\n]*\n+([\s\S]*?)(?=\n+###|\n+##|$)/i);
        if (degMatch) {
          const degText = degMatch[1];
          if (degText.includes('Wajib') || degText.includes('Regulasi')) {
            degreeVerdict = 'S1 Formal + Profesi (Wajib Regulasi)';
          } else if (degText.includes('Opsional')) {
            degreeVerdict = 'S1/D4 Dianjurkan (Portofolio Prioritas)';
          } else if (degText.includes('Sangat Direkomendasikan') || degText.includes('Sangat Dianjurkan')) {
            degreeVerdict = 'S1/D4 Sangat Diutamakan';
          }
        }

        // Extract salary estimate from Section 5
        const sec5Match = mdContent.match(/## 5\.\s*Estimasi Gaji[^\n]*\n+([\s\S]*?)(?=\n+##|$)/);
        if (sec5Match) {
          const salMatch = sec5Match[1].match(/IDR\s*([0-9.,]+)\s*[–-]\s*([0-9.,]+)/);
          if (salMatch) {
            salary = `Rp ${salMatch[1]} - Rp ${salMatch[2]} (Entry-Level)`;
          }
        }
      }

      const domain = inferDomainProfile(roleName, mdContent);
      const slug = roleName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      if (majorsMap[domain.majorId] && !majorsMap[domain.majorId].career_links.includes(roleName)) {
        majorsMap[domain.majorId].career_links.push(roleName);
      }

      roles.push({
        id: slug,
        title: roleName,
        riasec_weights: domain.riasec,
        preferred_env: domain.prefEnv,
        preferred_pathways: domain.prefPath,
        degree_verdict: degreeVerdict,
        salary_idr: salary,
        brief_desc: brief,
        related_majors: domain.relatedMajors,
        alternative_pathway: domain.altPathway,
        dossier_available: hasHtml,
        dossier_html_path: `${roleName}/${htmlFile}`,
        dossier_pdf_path: `${roleName}/${pdfFile}`,
        source: 'uipath-output'
      });
    }
  }

  const majors = Object.values(majorsMap).map(m => ({
    ...m,
    career_links: m.career_links.length > 0 ? m.career_links : ['Eksplorasi Karier Lintas Bidang']
  }));

  const payload = { roles, majors };

  if (targetJsonPath && roles.length > 0) {
    try {
      const existingTitles = new Set(roles.map(r => r.title.toLowerCase()));
      const mergedCacheRoles = [
        ...roles,
        ...RIASEC_CAREER_BLUEPRINTS.filter(bp => !existingTitles.has(bp.title.toLowerCase())).map(bp => ({
          ...bp,
          dossier_available: false,
          needs_uipath_research: true,
          source: 'riasec-blueprint-ready-for-uipath'
        }))
      ];
      const existingMajorIds = new Set(majors.map(m => m.id));
      const mergedCacheMajors = [
        ...majors,
        ...RIASEC_EXTRA_MAJORS.filter(m => !existingMajorIds.has(m.id))
      ];
      fs.writeFileSync(
        targetJsonPath,
        JSON.stringify({ roles: mergedCacheRoles, majors: mergedCacheMajors }, null, 2) + '\n',
        'utf8'
      );
    } catch {
      // Non-fatal if cache file cannot be updated
    }
  }

  return {
    ...payload,
    syncedAt: new Date().toISOString(),
    source: 'live-uipath-output'
  };
}

/**
 * Curated RIASEC-aligned career blueprints across all 6 Holland dimensions (R, I, A, S, E, C).
 * When a student's RIASEC profile favors dimensions not yet scraped in JourKa/Output/,
 * these blueprints become the dynamic research queue targets for the UiPath Robot.
 */
export const RIASEC_CAREER_BLUEPRINTS = [
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    riasec_weights: { R: 0.2, I: 0.9, A: 0.2, S: 0.2, E: 0.4, C: 0.8 },
    preferred_env: ['remote_flexible', 'corporate_business'],
    preferred_pathways: ['s1_academic', 'vokasi_politeknik', 'bootcamp_training'],
    degree_verdict: 'S1 Statistika/TI/Matematika Dianjurkan (Bisa Portofolio)',
    salary_idr: 'Rp 6.000.000 - Rp 10.500.000 (Entry-Level)',
    brief_desc: 'Mengolah data mentah perusahaan menjadi visualisasi dan insight bisnis strategis menggunakan SQL, Python, dan BI Tools.',
    related_majors: ['Sains Data & Statistika', 'Teknik Informatika', 'Sistem Informasi'],
    alternative_pathway: 'Bootcamp Data Analytics + Studi Kasus Kaggle/Tableau'
  },
  {
    id: 'ui-ux-designer',
    title: 'UI/UX Designer',
    riasec_weights: { R: 0.3, I: 0.5, A: 0.9, S: 0.6, E: 0.4, C: 0.2 },
    preferred_env: ['creative_studio', 'remote_flexible'],
    preferred_pathways: ['s1_academic', 'vokasi_politeknik', 'bootcamp_training'],
    degree_verdict: 'S1 DKV/Informatika Dianjurkan (Portofolio Figma Utama)',
    salary_idr: 'Rp 5.500.000 - Rp 9.500.000 (Entry-Level)',
    brief_desc: 'Merancang pengalaman pengguna dan antarmuka aplikasi digital yang intuitif berdasarkan riset perilaku pengguna.',
    related_majors: ['Desain Komunikasi Visual (DKV)', 'Sistem Informasi', 'Psikologi'],
    alternative_pathway: 'Bootcamp UI/UX + Portofolio Redesign Aplikasi di Dribbble/Behance'
  },
  {
    id: 'product-manager',
    title: 'Associate Product Manager',
    riasec_weights: { R: 0.1, I: 0.6, A: 0.3, S: 0.7, E: 0.9, C: 0.5 },
    preferred_env: ['corporate_business', 'remote_flexible'],
    preferred_pathways: ['s1_academic', 'bootcamp_training'],
    degree_verdict: 'S1 Bisnis/SI/Teknik (Lintas Jurusan Terbuka)',
    salary_idr: 'Rp 7.000.000 - Rp 12.000.000 (Entry-Level)',
    brief_desc: 'Menjembatani tim bisnis, desain, dan engineer untuk menentukan fitur produk digital yang paling berdampak bagi pengguna.',
    related_majors: ['Sistem Informasi & Bisnis Digital', 'Manajemen & Bisnis'],
    alternative_pathway: 'Program Management Trainee / Product Management Bootcamp'
  },
  {
    id: 'digital-marketing-specialist',
    title: 'Digital Marketing Specialist',
    riasec_weights: { R: 0.1, I: 0.4, A: 0.7, S: 0.6, E: 0.9, C: 0.3 },
    preferred_env: ['creative_studio', 'corporate_business', 'remote_flexible'],
    preferred_pathways: ['s1_academic', 'vokasi_politeknik', 'bootcamp_training', 'direct_work'],
    degree_verdict: 'Gelar Opsional (Hasil Kampanye & Sertifikasi Google/Meta Prioritas)',
    salary_idr: 'Rp 4.800.000 - Rp 8.000.000 (Entry-Level)',
    brief_desc: 'Merancang kampanye iklan digital, SEO, dan strategi konten media sosial untuk mendorong pertumbuhan merek dan penjualan.',
    related_majors: ['Ilmu Komunikasi & Pemasaran', 'Manajemen Bisnis Digital'],
    alternative_pathway: 'Sertifikasi Google Ads / Meta Blueprint + Proyek UMKM Nyata'
  },
  {
    id: 'rpa-automation-engineer',
    title: 'RPA & Automation Engineer',
    riasec_weights: { R: 0.6, I: 0.85, A: 0.1, S: 0.2, E: 0.3, C: 0.85 },
    preferred_env: ['corporate_business', 'remote_flexible', 'structured_lab'],
    preferred_pathways: ['s1_academic', 'vokasi_politeknik', 'bootcamp_training'],
    degree_verdict: 'S1/D4 Teknik Informatika/SI + Sertifikasi UiPath',
    salary_idr: 'Rp 6.500.000 - Rp 11.000.000 (Entry-Level)',
    brief_desc: 'Membangun robot perangkat lunak (seperti UiPath) untuk mengotomasi alur kerja bisnis berulang di perusahaan modern.',
    related_majors: ['Teknik Informatika', 'Sistem Informasi'],
    alternative_pathway: 'UiPath Academy Official Certification + Proyek Otomasi Nyata'
  },
  {
    id: 'edtech-trainer',
    title: 'EdTech & Learning Experience Specialist',
    riasec_weights: { R: 0.2, I: 0.5, A: 0.5, S: 0.95, E: 0.6, C: 0.4 },
    preferred_env: ['creative_studio', 'corporate_business', 'remote_flexible'],
    preferred_pathways: ['s1_academic', 'direct_work'],
    degree_verdict: 'S1 Pendidikan / Psikologi / Komunikasi Dianjurkan',
    salary_idr: 'Rp 4.800.000 - Rp 8.000.000 (Entry-Level)',
    brief_desc: 'Merancang kurikulum interaktif, mendampingi peserta belajar, dan memanfaatkan teknologi edukasi agar materi mudah dipahami.',
    related_majors: ['Teknologi Pendidikan / Psikologi', 'Ilmu Komunikasi'],
    alternative_pathway: 'Pengalaman Mengajar Komunitas / Mentor Akademik + Modul Ajar Digital'
  },
  {
    id: 'financial-analyst',
    title: 'Financial & Risk Analyst',
    riasec_weights: { R: 0.1, I: 0.75, A: 0.1, S: 0.3, E: 0.6, C: 0.95 },
    preferred_env: ['corporate_business', 'structured_lab'],
    preferred_pathways: ['s1_academic'],
    degree_verdict: 'S1 Akuntansi / Keuangan / Manajemen Sangat Diutamakan',
    salary_idr: 'Rp 6.000.000 - Rp 10.000.000 (Entry-Level)',
    brief_desc: 'Menganalisis laporan keuangan, arus kas, dan proyeksi risiko investasi perusahaan dengan ketelitian akurasi tinggi.',
    related_majors: ['Akuntansi & Keuangan', 'Manajemen & Bisnis'],
    alternative_pathway: 'Sertifikasi CFA Level 1 / Brevet Pajak + Pemodelan Excel'
  },
  {
    id: 'iot-robotics-engineer',
    title: 'IoT & Robotics Technician',
    riasec_weights: { R: 0.95, I: 0.8, A: 0.2, S: 0.2, E: 0.2, C: 0.5 },
    preferred_env: ['structured_lab', 'corporate_business'],
    preferred_pathways: ['vokasi_politeknik', 's1_academic'],
    degree_verdict: 'D4/S1 Teknik Elektro / Mekatronika Sangat Diutamakan',
    salary_idr: 'Rp 5.500.000 - Rp 9.500.000 (Entry-Level)',
    brief_desc: 'Merakit sensor perangkat keras, mikrokontroler, dan sistem otomasi fisik untuk pabrik pintar maupun perangkat IoT.',
    related_majors: ['Teknik Elektro & Mekatronika', 'Teknik Informatika'],
    alternative_pathway: 'Politeknik Vokasi + Portofolio Arduino/ESP32 & Lomba Robotika'
  }
];

export const RIASEC_EXTRA_MAJORS = [
  {
    id: 'manajemen-bisnis',
    name: 'Manajemen Bisnis & Pemasaran Digital',
    type: 'S1 Akademik / D4 Vokasi',
    top_match_dimensions: ['E', 'S'],
    description: 'Mempelajari strategi pertumbuhan bisnis, negosiasi, kepemimpinan tim, serta pemasaran produk di era ekonomi digital.',
    key_subjects: ['Manajemen Pemasaran', 'Kewirausahaan & Pitching', 'Perilaku Konsumen', 'Strategi Bisnis Digital'],
    career_links: ['Associate Product Manager', 'Digital Marketing Specialist']
  },
  {
    id: 'psikologi-edukasi',
    name: 'Psikologi & Teknologi Pendidikan',
    type: 'S1 Akademik',
    top_match_dimensions: ['S', 'I', 'A'],
    description: 'Memahami perilaku manusia, pengembangan bakat, konseling karier, dan perancangan pengalaman belajar yang efektif.',
    key_subjects: ['Psikologi Perkembangan', 'Asesmen Bakat & Minat', 'Desain Instruksional', 'Komunikasi Interpersonal'],
    career_links: ['EdTech & Learning Experience Specialist', 'UI/UX Designer']
  },
  {
    id: 'akuntansi-keuangan',
    name: 'Akuntansi & Analisis Keuangan',
    type: 'S1 Akademik / D4 Vokasi',
    top_match_dimensions: ['C', 'I', 'E'],
    description: 'Mendalami audit laporan keuangan, perpajakan, pengendalian risiko bisnis, dan tata kelola data finansial terstruktur.',
    key_subjects: ['Akuntansi Keuangan', 'Audit & Kepatuhan', 'Analisis Investasi', 'Sistem Informasi Akuntansi'],
    career_links: ['Financial & Risk Analyst']
  },
  {
    id: 'mekatronika',
    name: 'Teknik Elektro & Mekatronika',
    type: 'D4 Politeknik / S1 Teknik',
    top_match_dimensions: ['R', 'I', 'C'],
    description: 'Menggabungkan rekayasa mekanik, elektronika perangkat keras, dan pemrograman embedded untuk robotika serta IoT.',
    key_subjects: ['Rangkaian Elektronika', 'Sistem Mikrokontroler', 'Otomasi Industri (PLC)', 'Robotika Terapan'],
    career_links: ['IoT & Robotics Technician', 'RPA & Automation Engineer']
  }
];

/**
 * Combines live UiPath-scraped dossiers in JourKa/Output/ with RIASEC-matched
 * career & major blueprints so recommendations always reflect the student's RIASEC scores
 * and provide dynamic targets ready to be queued into UiPath.
 */
export function buildCatalogFromRiasec(profile, preferences, outputDir, targetJsonPath) {
  const liveCatalog = scanJourkaOutput(outputDir, targetJsonPath);
  const existingTitles = new Set(liveCatalog.roles.map(r => r.title.toLowerCase()));

  const mergedRoles = [...liveCatalog.roles];
  for (const bp of RIASEC_CAREER_BLUEPRINTS) {
    if (!existingTitles.has(bp.title.toLowerCase())) {
      mergedRoles.push({
        ...bp,
        dossier_available: false,
        needs_uipath_research: true,
        source: 'riasec-blueprint-ready-for-uipath'
      });
    }
  }

  const existingMajorIds = new Set(liveCatalog.majors.map(m => m.id));
  const mergedMajors = [
    ...liveCatalog.majors,
    ...RIASEC_EXTRA_MAJORS.filter(m => !existingMajorIds.has(m.id))
  ];

  // Score roles quickly server-side to identify top RIASEC-aligned targets for UiPath
  const scores = profile?.scores || {};
  const topDims = profile?.topDimensions || [];
  const rankedForRiasec = mergedRoles
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

  return {
    roles: mergedRoles,
    majors: mergedMajors,
    topRiasecSuggestedRoles: rankedForRiasec.slice(0, 3).map(x => x.role.title),
    syncedAt: liveCatalog.syncedAt,
    source: 'riasec-uipath-dynamic'
  };
}
