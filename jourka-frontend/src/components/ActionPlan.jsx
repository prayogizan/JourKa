import React, { useState } from 'react';

export default function ActionPlan({ studentInfo, profile, recommendations, onRestart }) {
  const [completedTasks, setCompletedTasks] = useState({});

  const toggleTask = (id) => {
    setCompletedTasks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const tasks = [
    { id: 't1', timeframe: '30 Hari Pertama', title: 'Eksplorasi Profil & Tanya Guru BK', desc: 'Diskusikan hasil asesmen JourKa ini dengan Guru Bimbingan Konseling (BK) di sekolah untuk memetakan mata pelajaran pendukung.' },
    { id: 't2', timeframe: '30 Hari Pertama', title: 'Baca Detail Dossier Profesi', desc: 'Buka dan baca tuntas minimal 2 dokumen dossier profesi JourKa (lihat keseharian kerja dan tantangan di industri nyata).' },
    { id: 't3', timeframe: '60 Hari Mendatang', title: 'Coba Mini Proyek Praktik', desc: 'Ikuti 1 tutorial pengenalan gratis di YouTube/Coursera/Dicoding sesuai minat (misal dasar Kotlin, editing video, atau lab sains).' },
    { id: 't4', timeframe: '90 Hari Kedepan', title: 'Kunjungi Edufair atau Kampus Terbuka', desc: 'Cari informasi mengenai daya tampung, kurikulum, dan beasiswa untuk jurusan yang direkomendasikan.' }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="card action-plan-card">
      <div className="text-center mb-4">
        <div className="badge-pill mb-2">Langkah Selanjutnya</div>
        <h2 className="title-lg">Rencana Aksi Eksplorasi {studentInfo.name}</h2>
        <p className="text-muted max-w-md mx-auto">
          Masa depan tidak ditentukan dalam semalam, tapi dibangun dari langkah-langkah kecil yang konsisten. 
          Gunakan panduan berikut sebagai peta awal perjalananmu.
        </p>
      </div>

      {/* Counselor Note Prompt */}
      <div className="counselor-box mb-4">
        <div className="counselor-title">🧑‍🏫 Saran untuk Diskusi dengan Guru BK / Orang Tua</div>
        <p className="text-sm text-muted mb-0">
          Tunjukkan hasil minat <strong>{profile.archetypeTitle}</strong> dan rekomendasi profesi teratas 
          (<strong>{recommendations.recommendedRoles.map(r => r.title).join(', ')}</strong>) kepada guru BK atau orang tua. 
          Gunakan pertanyaan pemantik: <em>"Berdasarkan minat ini, kegiatan ekstrakurikuler atau mata pelajaran pilihan apa yang paling mendukung persiapanku?"</em>
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
        <button type="button" className="btn btn-secondary" onClick={handlePrint}>
          🖨️ Cetak / Simpan Ringkasan PDF
        </button>

        <button type="button" className="btn btn-outline" onClick={onRestart}>
          🔄 Ulangi Asesmen dari Awal
        </button>
      </div>
    </div>
  );
}
