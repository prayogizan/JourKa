import React, { useState } from 'react';

export default function Recommendations({ recommendations, studentInfo, onNextAction, onBackProfile }) {
  const [activeTab, setActiveTab] = useState('careers');
  const { recommendedRoles, recommendedMajors } = recommendations;

  const handleOpenDossier = (role) => {
    // Di lingkungan lokal, mengarahkan ke path dossier yang dibuat oleh UiPath
    const path = `../JourKa/${role.dossier_html_path}`;
    window.open(path, '_blank');
  };

  return (
    <div className="recommendations-container">
      {/* Header */}
      <div className="card mb-4 text-center">
        <div className="badge-pill mb-2">Hasil Rekomendasi Eksplorasi</div>
        <h2 className="title-lg">Pilihan Relevan untuk {studentInfo.name}</h2>
        <p className="text-muted max-w-lg mx-auto">
          Rekomendasi ini disusun berdasarkan perpaduan minat RIASEC, preferensi lingkungan kerja, 
          dan target pendidikanmu. Pilihan ini ditujukan sebagai <strong>bahan pertimbangan eksplorasi</strong>, 
          bukan keputusan final yang membatasi.
        </p>

        {/* Tab Switcher */}
        <div className="tab-switcher mt-3">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'careers' ? 'active' : ''}`}
            onClick={() => setActiveTab('careers')}
          >
            💼 Pilihan Profesi ({recommendedRoles.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'majors' ? 'active' : ''}`}
            onClick={() => setActiveTab('majors')}
          >
            🎓 Pilihan Jurusan ({recommendedMajors.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Careers */}
      {activeTab === 'careers' && (
        <div className="careers-grid mb-4">
          {recommendedRoles.map((role) => (
            <div key={role.id} className="card role-card mb-3">
              <div className="d-flex justify-between align-center mb-2">
                <h3 className="role-title">{role.title}</h3>
                <span className="match-badge">{role.matchScore}% Relevan</span>
              </div>

              <p className="role-desc mb-3">{role.brief_desc}</p>

              {/* Bento Attributes */}
              <div className="bento-meta-grid mb-3">
                <div className="meta-box">
                  <div className="meta-label">Estimasi Gaji Awal</div>
                  <div className="meta-val font-semibold text-emerald">{role.salary_idr}</div>
                </div>
                <div className="meta-box">
                  <div className="meta-label">Kebutuhan Gelar</div>
                  <div className="meta-val font-medium">{role.degree_verdict}</div>
                </div>
              </div>

              {/* Explainable Reasons */}
              <div className="reasons-box mb-3">
                <div className="reasons-title">💡 Mengapa ini relevan untukmu?</div>
                <ul className="reasons-list">
                  {role.reasons.map((r, rIdx) => (
                    <li key={`reason-${rIdx}`}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="d-flex justify-between align-center pt-2">
                <span className="text-xs text-muted">
                  Jurusan terkait: <strong>{role.related_majors.slice(0, 2).join(', ')}</strong>
                </span>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenDossier(role)}
                >
                  📖 Buka Dossier Lengkap
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Majors */}
      {activeTab === 'majors' && (
        <div className="majors-grid mb-4">
          {recommendedMajors.map((major) => (
            <div key={major.id} className="card major-card mb-3">
              <div className="d-flex justify-between align-center mb-2">
                <div>
                  <span className="badge-pill text-xs mb-1">{major.type}</span>
                  <h3 className="major-title">{major.name}</h3>
                </div>
                <span className="match-badge match-emerald">{major.matchScore}% Kesesuaian</span>
              </div>

              <p className="major-desc mb-3">{major.description}</p>

              <div className="mb-3">
                <div className="meta-label mb-1">Mata Kuliah & Kompetensi Utama:</div>
                <div className="tags-cloud">
                  {major.key_subjects.map((sub, sIdx) => (
                    <span key={`sub-${sIdx}`} className="tag-pill">{sub}</span>
                  ))}
                </div>
              </div>

              <div className="major-footer text-xs text-muted pt-2 border-top">
                Koneksi Karier: <strong>{major.career_links.join(' · ')}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Footer */}
      <div className="d-flex justify-between align-center card p-3">
        <button type="button" className="btn btn-secondary" onClick={onBackProfile}>
          ← Kembali ke Profil Minat
        </button>

        <button type="button" className="btn btn-primary" onClick={onNextAction}>
          Lanjut ke Rencana Aksi (Action Plan) →
        </button>
      </div>
    </div>
  );
}
