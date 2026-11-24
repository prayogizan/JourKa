import React, { useState } from 'react';

export default function ActionPlan({ studentInfo, profile, recommendations, selectedItems, onRestart, onBackToRecs }) {
  const [completedTasks, setCompletedTasks] = useState({});
  const [studentEmail, setStudentEmail] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);

  const { allRoles, allMajors } = recommendations;
  const chosenRoles = allRoles.filter(r => selectedItems.roleIds?.includes(r.id));
  const chosenMajors = allMajors.filter(m => selectedItems.majorIds?.includes(m.id));

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

  // Helper untuk membuat baris CSV/Excel yang sesuai dengan Schema v2 JourKa
  const generateExportData = () => {
    const emailField = parentEmail.trim() 
      ? `${studentEmail.trim()};${parentEmail.trim()}`
      : (studentEmail.trim() || 'student@school.id');

    // Header 7 kolom
    const rows = [
      ['RecipientEmail', 'Job', 'AbroadMarkets', 'StudentName', 'EmailStatus', 'EmailTimestamp', 'ErrorMessage']
    ];

    const rolesToExport = chosenRoles.length > 0 ? chosenRoles : [allRoles[0]];
    rolesToExport.forEach(role => {
      rows.push([
        emailField,
        role.title,
        '', // AbroadMarkets (default blank atau bisa diisi)
        studentInfo.name || 'Valued Student',
        '', // EmailStatus (diisi bot)
        '', // EmailTimestamp (diisi bot)
        ''  // ErrorMessage (diisi bot)
      ]);
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

  return (
    <div className="card action-plan-card">
      <div className="text-center mb-4">
        <div className="badge-pill mb-2">Rencana Aksi Pribadi</div>
        <h2 className="title-lg">Peta Eksplorasi Masa Depan {studentInfo.name}</h2>
        <p className="text-muted max-w-md mx-auto">
          Kamu telah memilih profesi dan program studi yang paling menarik bagimu. 
          Gunakan rencana aksi ini sebagai panduan langkah konkret ke depan.
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
                <span key={r.id} className="tag-pill tag-accent">💼 {r.title} ({r.matchScore}% Match)</span>
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

      {/* UiPath Robot Automation Handoff Box */}
      <div className="uipath-handoff-box card-subtle p-3 mb-4">
        <div className="d-flex justify-between align-center mb-2">
          <div className="d-flex align-center gap-2">
            <span style={{ fontSize: '1.25rem' }}>🤖</span>
            <span className="font-bold text-accent">Kirim Request Riset ke Robot UiPath JourKa</span>
          </div>
          <span className="badge-pill">RPA Handoff</span>
        </div>

        <p className="text-sm text-muted mb-3">
          Robot UiPath akan secara otomatis melakukan live scraping lowongan nyata di LinkedIn, video rutinitas YouTube, 
          merangkum dossier mendalam via Gemini AI, dan mengirimkan file PDF laporan resmi ke emailmu.
        </p>

        <div className="form-group mb-2">
          <label className="form-label text-xs">Email Siswa (Penerima Laporan Dossier PDF):</label>
          <input
            type="email"
            className="input-control text-sm"
            placeholder="contoh: rina.wijaya@student.sch.id"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
          />
        </div>

        <div className="form-group mb-3">
          <label className="form-label text-xs">Email Orang Tua / Wali (Opsional, untuk tembusan laporan):</label>
          <input
            type="email"
            className="input-control text-sm"
            placeholder="contoh: orangtua.rina@gmail.com"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
          />
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleDownloadCsv}
          >
            📥 Download Desire Role List.csv (Untuk Robot UiPath)
          </button>

          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={handleCopyClipboard}
          >
            {copiedMessage ? '✓ Berhasil Disalin!' : '📋 Salin Baris Data (Siap Paste ke Excel)'}
          </button>
        </div>

        <div className="text-xs text-muted mt-2">
          💡 File input ini otomatis sesuai dengan schema 7-kolom robot UiPath (<code>RecipientEmail | Job | AbroadMarkets | StudentName</code>).
        </div>
      </div>

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
      <div className="d-flex justify-between align-center pt-3 border-top">
        <button type="button" className="btn btn-secondary" onClick={onBackToRecs}>
          ← Ubah Pilihan Rekomendasi
        </button>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={handlePrint}>
            🖨️ Cetak / Simpan PDF
          </button>

          <button type="button" className="btn btn-outline" onClick={onRestart}>
            🔄 Ulangi Asesmen
          </button>
        </div>
      </div>
    </div>
  );
}
