import React, { useState } from 'react';

export default function Onboarding({ onStart }) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('11');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onStart({
      name: name.trim(),
      grade,
      email: email.trim()
    });
  };

  return (
    <div className="card onboarding-card">
      <div className="badge-pill mb-3">🧭 Career & Education Discovery Platform</div>
      <h1 className="hero-title">Temukan Arah & Minat Masa Depanmu</h1>
      <p className="hero-subtitle">
        Selamat datang di <strong>JourKa (Journey Kita)</strong>. Di sini, tidak ada jawaban benar atau salah.
        Kuesioner ini dirancang untuk memetakan kekuatan unikmu dan memberikan rekomendasi profesi serta jurusan
        kuliah yang relevan untuk dieksplorasi.
      </p>

      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="form-group mb-3">
          <label htmlFor="student-name" className="form-label">Nama Panggilan Kamu</label>
          <input
            id="student-name"
            type="text"
            className="input-control"
            placeholder="Contoh: Rina, Budi, Dimas"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group mb-3">
          <label htmlFor="student-grade" className="form-label">Jenjang Pendidikan Saat Ini</label>
          <select
            id="student-grade"
            className="input-control"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            <option value="10">Kelas 10 SMA / SMK (Awal Eksplorasi)</option>
            <option value="11">Kelas 11 SMA / SMK (Pendalaman Minat)</option>
            <option value="12">Kelas 12 SMA / SMK (Persiapan Kelulusan)</option>
            <option value="grad">Fresh Graduate SMA / SMK (Mencari Arah)</option>
          </select>
        </div>

        <div className="form-group mb-4">
          <label htmlFor="student-email" className="form-label">
            Email Siswa <span className="text-xs text-muted font-medium">(Opsional — agar hasil RIASEC langsung dikirim ke Robot UiPath)</span>
          </label>
          <input
            id="student-email"
            type="email"
            className="input-control"
            placeholder="contoh: rina.wijaya@student.sch.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="notice-box mb-4">
          <div className="notice-icon">💡</div>
          <div className="notice-text">
            <strong>Waktu pengisian cepat (klik jawaban langsung lanjut).</strong> Kamu bebas memilih opsi <em>"Belum pernah coba"</em> jika belum yakin.
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block">
          Mulai Eksplorasi Minat →
        </button>
      </form>
    </div>
  );
}
