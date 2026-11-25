import React, { useState, useEffect, useCallback } from 'react';

const RIASEC_LABELS = {
  R: 'Realistic (Praktis)',
  I: 'Investigative (Analitis)',
  A: 'Artistic (Kreatif)',
  S: 'Social (Kolaboratif)',
  E: 'Enterprising (Persuasif)',
  C: 'Conventional (Teratur)'
};

/**
 * Generates a unique canonical email key per queued role to respect
 * JourKa Main.xaml's Column A Primary Key deduplication rule.
 */
function buildEmailKeyForIndex(studentEmail, parentEmail, roleTitle, index) {
  const cleanStudent = studentEmail.trim().toLowerCase();
  const cleanParent = parentEmail.trim().toLowerCase();

  if (index === 0) {
    return cleanParent ? `${cleanStudent};${cleanParent}` : cleanStudent;
  }

  const [local, domain] = cleanStudent.split('@');
  if (local && domain) {
    const slug = roleTitle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || `role${index + 1}`;
    const aliasedStudent = `${local.split('+')[0]}+${slug}@${domain}`;
    return cleanParent ? `${aliasedStudent};${cleanParent}` : aliasedStudent;
  }
  return cleanStudent;
}

export default function ActionPlan({
  studentInfo,
  profile,
  recommendations,
  customRoles = [],
  selectedItems,
  onRestart,
  onBackToRecs
}) {
  const [completedTasks, setCompletedTasks] = useState({});
  const [studentEmail, setStudentEmail] = useState(studentInfo.email || '');
  const [parentEmail, setParentEmail] = useState('');
  const [abroadMarkets, setAbroadMarkets] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Automated Bridge States
  const [sending, setSending] = useState(false);
  const [queueFeedback, setQueueFeedback] = useState(null);
  const [queueRows, setQueueRows] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  const { allRoles, allMajors } = recommendations;
  const combinedRoles = [...allRoles, ...customRoles];
  const chosenRoles = combinedRoles.filter(r => selectedItems.roleIds?.includes(r.id));
  const chosenMajors = allMajors.filter(m => selectedItems.majorIds?.includes(m.id));

  const fetchQueueStatus = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const res = await fetch('/api/queue-status');
      if (res.ok) {
        const data = await res.json();
        setQueueRows(data.rows || []);
      }
    } catch {
      // Offline / static build without bridge
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueStatus();
  }, [fetchQueueStatus]);

  const toggleTask = (id) => {
    setCompletedTasks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const tasks = [
    {
      id: 't1',
      timeframe: '30 Hari Pertama',
      title: 'Konsultasi Guru BK dengan Pilihan Terfokus',
      desc: `Diskusikan hasil pilihanmu (${chosenRoles.map(r => r.title).join(', ')} dan jurusan ${chosenMajors.map(m => m.name).join(', ')}) dengan Guru BK untuk melihat kesesuaian nilai rapor dan peminatan sekolah.`
    },
    {
      id: 't2',
      timeframe: '30 Hari Pertama',
      title: 'Pelajari Dossier & Rutinitas Kerja Harian',
      desc: 'Buka dokumen dossier lengkap JourKa untuk profesi pilihanmu. Perhatikan apa saja rutinitas harian dan alat/teknologi yang wajib dikuasai pemula.'
    },
    {
      id: 't3',
      timeframe: '60 Hari Mendatang',
      title: 'Mulai Proyek Mandiri / Portofolio Sederhana',
      desc: 'Cobalah membuat 1 proyek kecil mandiri (misal: coding aplikasi sederhana, membuat video pendek berkualitas, atau mempelajari jurnal sains) untuk menguji kecocokan minatmu secara langsung.'
    },
    {
      id: 't4',
      timeframe: '90 Hari Kedepan',
      title: 'Riset Kampus, Syarat Masuk & Beasiswa',
      desc: `Kunjungi laman resmi universitas/politeknik penyedia jurusan ${chosenMajors.length > 0 ? chosenMajors[0].name : 'pilihanmu'}. Catat jalur masuk (SNBP, SNBT, Mandiri) dan tanggal penting pendaftaran.`
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  const buildQueueRequests = () => {
    const baseEmail = studentEmail.trim() || 'student@school.id';
    const rolesToQueue = chosenRoles.length > 0 ? chosenRoles : [allRoles[0]];
    return rolesToQueue.map((role, idx) => ({
      recipientEmail: buildEmailKeyForIndex(baseEmail, parentEmail, role.title, idx),
      job: role.title,
      abroadMarkets: abroadMarkets.trim(),
      studentName: studentInfo.name || 'Valued Student'
    }));
  };

  const handleSendToUiPathDirect = async (e) => {
    e.preventDefault();
    if (!studentEmail.trim() || !studentEmail.includes('@')) {
      setQueueFeedback({
        type: 'error',
        text: 'Mohon masukkan alamat email siswa yang valid agar laporan Dossier PDF dapat dikirim.'
      });
      return;
    }

    setSending(true);
    setQueueFeedback(null);
    const requests = buildQueueRequests();

    try {
      const res = await fetch('/api/queue-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghubungi server.');
      }

      setQueueRows(data.rows || []);
      setQueueFeedback({
        type: 'success',
        text: `Permintaan riset untuk ${requests.length} profesi berhasil dikirim! Robot JourKa akan segera memproses dan mengirimkan Dossier PDF ke emailmu.`
      });
    } catch {
      setQueueFeedback({
        type: 'error',
        text: 'Mode Bridge lokal belum aktif di hosting ini. Gunakan tombol "Cetak / Simpan PDF" untuk menyimpan laporan lengkapmu, atau buka Panel Guru BK / Admin di bawah untuk ekspor data.'
      });
      setShowAdminPanel(true);
    } finally {
      setSending(false);
    }
  };

  const generateExportData = () => {
    const rows = [
      ['RecipientEmail', 'Job', 'AbroadMarkets', 'StudentName', 'EmailStatus', 'EmailTimestamp', 'ErrorMessage']
    ];
    buildQueueRequests().forEach(r => {
      rows.push([r.recipientEmail, r.job, r.abroadMarkets, r.studentName, '', '', '']);
    });
    return rows;
  };

  const handleDownloadCsv = () => {
    const data = generateExportData();
    const csvContent = '\uFEFF' + data.map(e => e.map(val => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Desire Role List.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyClipboard = () => {
    const data = generateExportData();
    const tsvContent = data.map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 3000);
    });
  };

  const printedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      {/* ==================== SCREEN-ONLY INTERACTIVE VIEW ==================== */}
      <div className="card action-plan-card no-print">
        <div className="text-center mb-4">
          <div className="badge-pill mb-2">Rencana Aksi Pribadi</div>
          <h2 className="title-lg">Peta Eksplorasi Masa Depan {studentInfo.name}</h2>
          <p className="text-muted max-w-md mx-auto">
            Berikut rangkuman pilihan karier dan jurusanmu. Kirim permintaan dossier PDF ke email atau cetak laporan lengkap hasil asesmenmu.
          </p>
        </div>

        {/* Chosen Options Summary Card */}
        <div className="chosen-summary-box mb-4">
          <h3 className="section-subtitle mb-2">📌 Opsi yang Kamu Pilih untuk Difokuskan:</h3>
          <div className="mb-2">
            <span className="text-xs font-semibold text-muted text-uppercase">Profesi Diminati:</span>
            <div className="tags-cloud mt-1">
              {chosenRoles.length > 0 ? (
                chosenRoles.map(r => (
                  <span key={r.id} className="tag-pill tag-accent">
                    {r.isCustomRequest ? `🤖 ${r.title} (On-Demand)` : `💼 ${r.title} (${r.matchScore}% Match)`}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted">Belum ada profesi yang dipilih.</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted text-uppercase">Program Studi / Jurusan Terkait:</span>
            <div className="tags-cloud mt-1">
              {chosenMajors.length > 0 ? (
                chosenMajors.map(m => (
                  <span key={m.id} className="tag-pill tag-emerald">🎓 {m.name}</span>
                ))
              ) : (
                <span className="text-sm text-muted">Belum ada jurusan yang dipilih.</span>
              )}
            </div>
          </div>
        </div>

        {/* Clean Student Delivery Box (Zero-Jargon for End User) */}
        <form onSubmit={handleSendToUiPathDirect} className="uipath-handoff-box card-subtle p-3 mb-4">
          <div className="d-flex justify-between align-center mb-2">
            <div className="d-flex align-center gap-2">
              <span style={{ fontSize: '1.25rem' }}>📩</span>
              <span className="font-bold text-accent">Kirim Laporan Dossier PDF ke Email Saya</span>
            </div>
            <span className="badge-pill">Riset Otomatis JourKa</span>
          </div>

          <p className="text-sm text-muted mb-3">
            Masukkan emailmu agar tim robot riset JourKa mengirimkan laporan karier lengkap (lowongan terkini, estimasi gaji, dan panduan belajar) langsung ke kotak masukmu.
          </p>

          <div className="form-group mb-2">
            <label className="form-label text-xs">Email Siswa (Wajib — Penerima Laporan PDF):</label>
            <input
              type="email"
              required
              className="input-control text-sm"
              placeholder="contoh: rina.wijaya@student.sch.id"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
            />
          </div>

          <div className="bento-meta-grid mb-3">
            <div className="form-group">
              <label className="form-label text-xs">Email Orang Tua / Wali (Opsional, untuk tembusan):</label>
              <input
                type="email"
                className="input-control text-sm"
                placeholder="contoh: orangtua.rina@gmail.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Riset Pasar Luar Negeri (Opsional):</label>
              <input
                type="text"
                className="input-control text-sm"
                placeholder="Kosongkan untuk Indonesia, atau isi: Singapore, Japan"
                value={abroadMarkets}
                onChange={(e) => setAbroadMarkets(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending}
          >
            {sending ? '⏳ Mengirim Permintaan...' : '🚀 Kirim Permintaan Dossier ke Email Saya'}
          </button>

          {queueFeedback && (
            <div className={`feedback-banner mt-3 ${queueFeedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}>
              {queueFeedback.type === 'success' ? '✅ ' : '⚠️ '}
              {queueFeedback.text}
            </div>
          )}
        </form>

        {/* Counselor Note Prompt */}
        <div className="counselor-box mb-4">
          <div className="counselor-title">🧑‍🏫 Lembar Diskusi Bersama Guru BK / Orang Tua</div>
          <p className="text-sm text-muted mb-0">
            Tunjukkan hasil profil minat <strong>{profile.archetypeTitle}</strong> dan {chosenRoles.length} profesi pilihanmu di atas.
            Mintalah masukan: <em>"Berdasarkan pilihan karier ini, apa saja kegiatan ekstrakurikuler atau persiapan ujian masuk yang perlu saya mulai siapkan sekarang?"</em>
          </p>
        </div>

        {/* Task List */}
        <div className="tasks-list mb-4">
          <h3 className="section-subtitle mb-3">Milestone 30 / 60 / 90 Hari</h3>
          {tasks.map(task => {
            const isDone = !!completedTasks[task.id];
            return (
              <div
                key={task.id}
                className={`task-item ${isDone ? 'done' : ''}`}
                onClick={() => toggleTask(task.id)}
              >
                <div className="task-checkbox">{isDone ? '✓' : ''}</div>
                <div className="task-content">
                  <div className="d-flex align-center gap-2 mb-1">
                    <span className="badge-time">{task.timeframe}</span>
                    <span className="task-title font-semibold">{task.title}</span>
                  </div>
                  <div className="task-desc text-sm text-muted">{task.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-between align-center pt-3 border-top flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={onBackToRecs}>
            ← Ubah Pilihan Rekomendasi
          </button>

          <div className="d-flex gap-2 flex-wrap">
            <button type="button" className="btn btn-secondary" onClick={handlePrint}>
              🖨️ Cetak / Simpan PDF (Laporan Lengkap)
            </button>

            <button type="button" className="btn btn-outline" onClick={onRestart}>
              🔄 Ulangi Asesmen
            </button>
          </div>
        </div>

        {/* Separated Admin / Guru BK Panel Toggle */}
        <div className="mt-4 pt-3 border-top text-center">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowAdminPanel(prev => !prev)}
          >
            {showAdminPanel ? '▲ Tutup Panel Guru BK / Admin UiPath' : '🛠️ Panel Guru BK / Admin (Antrean Robot UiPath & Export CSV)'}
          </button>
        </div>

        {showAdminPanel && (
          <div className="admin-panel-box card-subtle p-3 mt-3">
            <div className="d-flex justify-between align-center mb-2 flex-wrap gap-2">
              <div>
                <div className="font-bold text-sm">🛠️ Panel Operator / Guru BK — Integrasi RPA UiPath</div>
                <div className="text-xs text-muted">
                  Khusus admin/Guru BK: memantau antrean <code>JourKa/Input/Desire Role List.xlsx</code> atau ekspor CSV manual jika dijalankan offline tanpa Bridge API.
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 flex-wrap mb-3">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadCsv}
              >
                📥 Download Desire Role List.csv (Backup Offline)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyClipboard}
              >
                {copiedMessage ? '✓ Berhasil Disalin!' : '📋 Salin Baris Data (Paste ke Excel)'}
              </button>
            </div>

            {queueRows.length > 0 && (
              <div className="queue-monitor pt-2 border-top">
                <div className="d-flex justify-between align-center mb-2">
                  <span className="text-xs font-bold text-muted">
                    📡 Monitor Antrean Live (JourKa/Input/Desire Role List.xlsx)
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={fetchQueueStatus}
                    disabled={loadingQueue}
                  >
                    {loadingQueue ? '⏳...' : '🔄 Refresh Status'}
                  </button>
                </div>
                <div className="queue-table-wrap">
                  <table className="queue-table">
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Email Penerima</th>
                        <th>Target Profesi</th>
                        <th>Status Robot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queueRows.slice(-6).map((row) => {
                        const statusText = row.emailStatus || 'Pending (Menunggu Run)';
                        const statusClass = row.emailStatus === 'Sent'
                          ? 'status-sent'
                          : row.emailStatus.startsWith('Skipped') || row.emailStatus.startsWith('Failed')
                            ? 'status-error'
                            : 'status-pending';
                        return (
                          <tr key={`row-${row.rowNumber}`}>
                            <td>#{row.rowNumber}</td>
                            <td><code>{row.recipientEmail}</code></td>
                            <td><strong>{row.job}</strong></td>
                            <td><span className={`status-pill ${statusClass}`}>{statusText}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== PRINT-ONLY DETAILED STUDENT REPORT ==================== */}
      <div className="print-only-report">
        <div className="print-header">
          <div>
            <div className="print-brand">🧭 JourKa — Laporan Eksplorasi Karier & Pendidikan</div>
            <h1 className="print-title">Profil Minat & Rekomendasi Terpilih: {studentInfo.name}</h1>
          </div>
          <div className="print-meta">
            <div><strong>Jenjang:</strong> {studentInfo.grade === 'grad' ? 'Fresh Graduate' : `Kelas ${studentInfo.grade} SMA/SMK`}</div>
            {studentEmail && <div><strong>Email:</strong> {studentEmail}</div>}
            <div><strong>Tanggal Cetak:</strong> {printedDate}</div>
          </div>
        </div>

        {/* 1. RIASEC Profile Breakdown */}
        <section className="print-section">
          <h2 className="print-sec-title">1. Hasil Pemetaan Minat (RIASEC)</h2>
          <div className="print-archetype-box">
            <strong>Arketipe Minat Utama: {profile.archetypeTitle}</strong>
            <p>{profile.archetypeDesc}</p>
          </div>
          <div className="print-riasec-grid">
            {Object.entries(profile.scores).map(([dim, score]) => (
              <div key={dim} className="print-riasec-item">
                <span>{RIASEC_LABELS[dim] || dim}</span>
                <strong>{score}%</strong>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Detailed Chosen Careers */}
        <section className="print-section">
          <h2 className="print-sec-title">2. Detail Profesi Pilihan ({chosenRoles.length})</h2>
          {chosenRoles.length > 0 ? chosenRoles.map(role => (
            <div key={role.id} className="print-detail-card">
              <div className="print-card-top">
                <h3>💼 {role.title}</h3>
                <span className="print-score">
                  {role.isCustomRequest ? 'Riset Khusus On-Demand' : `${role.matchScore}% Relevan`}
                </span>
              </div>
              <p className="print-desc">{role.brief_desc}</p>
              <div className="print-facts">
                <div><strong>Estimasi Gaji Awal:</strong> {role.salary_idr}</div>
                <div><strong>Kebutuhan Gelar:</strong> {role.degree_verdict}</div>
                {role.related_majors && (
                  <div><strong>Jurusan Terkait:</strong> {role.related_majors.join(', ')}</div>
                )}
                {role.alternative_pathway && (
                  <div><strong>Jalur Alternatif:</strong> {role.alternative_pathway}</div>
                )}
              </div>
              {role.reasons && role.reasons.length > 0 && (
                <div className="print-reasons">
                  <strong>Alasan Kecocokan:</strong>
                  <ul>
                    {role.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )) : <p>Tidak ada profesi yang dipilih.</p>}
        </section>

        {/* 3. Detailed Chosen Majors */}
        <section className="print-section">
          <h2 className="print-sec-title">3. Detail Program Studi / Jurusan Pilihan ({chosenMajors.length})</h2>
          {chosenMajors.length > 0 ? chosenMajors.map(major => (
            <div key={major.id} className="print-detail-card">
              <div className="print-card-top">
                <h3>🎓 {major.name} ({major.type})</h3>
                <span className="print-score">{major.matchScore}% Cocok</span>
              </div>
              <p className="print-desc">{major.description}</p>
              <div className="print-facts">
                <div><strong>Mata Kuliah Inti:</strong> {(major.key_subjects || []).join(', ')}</div>
                <div><strong>Prospek Karier:</strong> {(major.career_links || []).join(', ')}</div>
              </div>
            </div>
          )) : <p>Tidak ada program studi yang dipilih.</p>}
        </section>

        {/* 4. Action Plan & Counselor Guide */}
        <section className="print-section">
          <h2 className="print-sec-title">4. Peta Rencana Aksi 30 / 60 / 90 Hari & Panduan Konseling BK</h2>
          <ul className="print-tasks">
            {tasks.map(t => (
              <li key={t.id}>
                <strong>[{t.timeframe}] {t.title}:</strong> {t.desc}
              </li>
            ))}
          </ul>
          <div className="print-counselor-note">
            <strong>Pertanyaan Diskusi dengan Guru BK / Orang Tua:</strong> "Berdasarkan profil minat {profile.archetypeTitle} dan pilihan karier di atas, apa saja kegiatan ekstrakurikuler atau persiapan masuk kuliah/kerja yang perlu saya fokuskan mulai semester ini?"
          </div>
        </section>
      </div>
    </>
  );
}
