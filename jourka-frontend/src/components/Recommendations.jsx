import React, { useState } from 'react';

export default function Recommendations({ recommendations, studentInfo, onNextAction, onBackProfile, initialSelected = {} }) {
  const [activeTab, setActiveTab] = useState('careers');
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [showAllMajors, setShowAllMajors] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState(initialSelected.roleIds || []);
  const [selectedMajorIds, setSelectedMajorIds] = useState(initialSelected.majorIds || []);

  const { topRoles, otherRoles, topMajors, otherMajors } = recommendations;

  const toggleSelectRole = (roleId) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleSelectMajor = (majorId) => {
    setSelectedMajorIds(prev => 
      prev.includes(majorId) ? prev.filter(id => id !== majorId) : [...prev, majorId]
    );
  };

  const handleOpenDossier = (e, role) => {
    e.stopPropagation();
    const path = `../JourKa/${role.dossier_html_path}`;
    window.open(path, '_blank');
  };

  const handleProceed = () => {
    onNextAction({
      roleIds: selectedRoleIds,
      majorIds: selectedMajorIds
    });
  };

  const totalSelectedCount = selectedRoleIds.length + selectedMajorIds.length;

  return (
    <div className="recommendations-container">
      {/* Header */}
      <div className="card mb-4 text-center">
        <div className="badge-pill mb-2">Hasil Rekomendasi Terurut RIASEC</div>
        <h2 className="title-lg">Pilihan Relevan untuk {studentInfo.name}</h2>
        <p className="text-muted max-w-lg mx-auto">
          Rekomendasi diurutkan dari skor korelasi <strong>paling tinggi ke rendah</strong>. 
          Kamu dapat <strong>memilih lebih dari satu opsi</strong> yang menarik untuk dimasukkan ke Rencana Aksi pribadimu.
        </p>

        {/* Tab Switcher */}
        <div className="tab-switcher mt-3">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'careers' ? 'active' : ''}`}
            onClick={() => setActiveTab('careers')}
          >
            💼 Pilihan Profesi ({topRoles.length + otherRoles.length})
            {selectedRoleIds.length > 0 && (
              <span className="counter-pill">{selectedRoleIds.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'majors' ? 'active' : ''}`}
            onClick={() => setActiveTab('majors')}
          >
            🎓 Pilihan Jurusan ({topMajors.length + otherMajors.length})
            {selectedMajorIds.length > 0 && (
              <span className="counter-pill">{selectedMajorIds.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Careers */}
      {activeTab === 'careers' && (
        <div className="careers-section mb-4">
          <div className="section-label-row mb-3">
            <span className="font-semibold text-sm text-accent">🌟 Rekomendasi Teratas untuk Dieksplorasi</span>
          </div>

          <div className="careers-grid mb-3">
            {topRoles.map(role => renderRoleCard(role, selectedRoleIds.includes(role.id), toggleSelectRole, handleOpenDossier))}
          </div>

          {/* Collapsible Dropdown for Lower Ranked Roles */}
          {otherRoles.length > 0 && (
            <div className="other-options-wrapper mt-3 mb-3">
              <button
                type="button"
                className="btn btn-outline btn-block show-more-toggle"
                onClick={() => setShowAllRoles(!showAllRoles)}
              >
                {showAllRoles 
                  ? `▲ Sembunyikan ${otherRoles.length} Opsi Lainnya`
                  : `▼ Lihat ${otherRoles.length} Pilihan Profesi Lainnya (Kesesuaian Lebih Rendah)`
                }
              </button>

              {showAllRoles && (
                <div className="collapsible-content mt-3">
                  <div className="text-xs text-muted mb-2">
                    💡 Pilihan berikut memiliki skor korelasi lebih rendah dengan profil RIASEC utamamu, namun tetap terbuka untuk dieksplorasi jika kamu tertarik:
                  </div>
                  <div className="careers-grid">
                    {otherRoles.map(role => renderRoleCard(role, selectedRoleIds.includes(role.id), toggleSelectRole, handleOpenDossier, true))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Majors */}
      {activeTab === 'majors' && (
        <div className="majors-section mb-4">
          <div className="section-label-row mb-3">
            <span className="font-semibold text-sm text-accent">🌟 Program Studi Paling Relevan</span>
          </div>

          <div className="majors-grid mb-3">
            {topMajors.map(major => renderMajorCard(major, selectedMajorIds.includes(major.id), toggleSelectMajor))}
          </div>

          {/* Collapsible Dropdown for Lower Ranked Majors */}
          {otherMajors.length > 0 && (
            <div className="other-options-wrapper mt-3 mb-3">
              <button
                type="button"
                className="btn btn-outline btn-block show-more-toggle"
                onClick={() => setShowAllMajors(!showAllMajors)}
              >
                {showAllMajors 
                  ? `▲ Sembunyikan ${otherMajors.length} Jurusan Lainnya`
                  : `▼ Lihat ${otherMajors.length} Program Studi Lainnya (Kesesuaian Lebih Rendah)`
                }
              </button>

              {showAllMajors && (
                <div className="collapsible-content mt-3">
                  <div className="text-xs text-muted mb-2">
                    💡 Program studi berikut memiliki bobot kecocokan sedang/lebih rendah berdasarkan minat saat ini:
                  </div>
                  <div className="majors-grid">
                    {otherMajors.map(major => renderMajorCard(major, selectedMajorIds.includes(major.id), toggleSelectMajor, true))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating / Sticky Selection Bar & Navigation Footer */}
      <div className="card selection-footer p-3 sticky-bottom">
        <div className="d-flex justify-between align-center">
          <button type="button" className="btn btn-secondary" onClick={onBackProfile}>
            ← Kembali ke Profil
          </button>

          <div className="text-center">
            <span className="font-bold text-sm text-accent">
              {totalSelectedCount > 0 
                ? `✓ ${selectedRoleIds.length} Profesi & ${selectedMajorIds.length} Jurusan Dipilih`
                : 'Pilih minimal 1 profesi/jurusan yang kamu sukai'
              }
            </span>
          </div>

          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleProceed}
            disabled={totalSelectedCount === 0}
          >
            Lanjut ke Rencana Aksi ({totalSelectedCount}) →
          </button>
        </div>
      </div>
    </div>
  );
}

function renderRoleCard(role, isSelected, onToggle, onOpenDossier, isLowerRank = false) {
  return (
    <div 
      key={role.id} 
      className={`card role-card ${isSelected ? 'selected-card' : ''} ${isLowerRank ? 'lower-rank-card' : ''}`}
      onClick={() => onToggle(role.id)}
    >
      <div className="d-flex justify-between align-center mb-2">
        <div className="d-flex align-center gap-2">
          <input 
            type="checkbox" 
            className="card-checkbox" 
            checked={isSelected} 
            onChange={() => onToggle(role.id)} 
            onClick={(e) => e.stopPropagation()}
          />
          <h3 className="role-title">{role.title}</h3>
        </div>
        <span className={`match-badge ${isLowerRank ? 'match-neutral' : ''}`}>
          {role.matchScore}% Relevan
        </span>
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
        <div className="reasons-title">💡 Mengapa ini relevan?</div>
        <ul className="reasons-list">
          {role.reasons.map((r, rIdx) => (
            <li key={`reason-${rIdx}`}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="d-flex justify-between align-center pt-2 border-top">
        <span className="text-xs text-muted">
          Pilihan Anda: <strong>{isSelected ? '✓ Terpilih' : 'Klik kartu untuk memilih'}</strong>
        </span>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={(e) => onOpenDossier(e, role)}
        >
          📖 Buka Dossier Lengkap
        </button>
      </div>
    </div>
  );
}

function renderMajorCard(major, isSelected, onToggle, isLowerRank = false) {
  return (
    <div 
      key={major.id} 
      className={`card major-card ${isSelected ? 'selected-card' : ''} ${isLowerRank ? 'lower-rank-card' : ''}`}
      onClick={() => onToggle(major.id)}
    >
      <div className="d-flex justify-between align-center mb-2">
        <div className="d-flex align-center gap-2">
          <input 
            type="checkbox" 
            className="card-checkbox" 
            checked={isSelected} 
            onChange={() => onToggle(major.id)}
            onClick={(e) => e.stopPropagation()}
          />
          <div>
            <span className="badge-pill text-xs mb-1">{major.type}</span>
            <h3 className="major-title">{major.name}</h3>
          </div>
        </div>
        <span className={`match-badge ${isLowerRank ? 'match-neutral' : 'match-emerald'}`}>
          {major.matchScore}% Kesesuaian
        </span>
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

      <div className="d-flex justify-between align-center pt-2 border-top text-xs text-muted">
        <span>Koneksi Karier: <strong>{major.career_links.join(' · ')}</strong></span>
        <span>{isSelected ? '✓ Terpilih' : 'Klik untuk memilih'}</span>
      </div>
    </div>
  );
}
