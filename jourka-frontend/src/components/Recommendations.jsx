import React, { useState } from 'react';

export default function Recommendations({
  recommendations,
  studentInfo,
  profile,
  onNextAction,
  onBackProfile,
  initialSelected = {},
  customRoles = [],
  riasecQueueNotice = null,
  onAddCustomRole,
  onRefreshCatalog,
  catalogSyncInfo = {}
}) {
  const [activeTab, setActiveTab] = useState('careers');
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [showAllMajors, setShowAllMajors] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState(initialSelected.roleIds || []);
  const [selectedMajorIds, setSelectedMajorIds] = useState(initialSelected.majorIds || []);
  const [previewRole, setPreviewRole] = useState(null);
  const [customRoleInput, setCustomRoleInput] = useState('');

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
    setPreviewRole(role);
  };

  const handleOpenNewTab = (e, role) => {
    e.stopPropagation();
    const url = `/dossiers/${encodeURIComponent(role.dossier_html_path.split('/')[0])}/${encodeURIComponent(role.dossier_html_path.split('/')[1])}`;
    window.open(url, '_blank');
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customRoleInput.trim() || !onAddCustomRole) return;
    const created = onAddCustomRole(customRoleInput);
    if (created && !selectedRoleIds.includes(created.id)) {
      setSelectedRoleIds(prev => [...prev, created.id]);
    }
    setCustomRoleInput('');
  };

  const handleProceed = () => {
    onNextAction({
      roleIds: selectedRoleIds,
      majorIds: selectedMajorIds
    });
  };

  const totalSelectedCount = selectedRoleIds.length + selectedMajorIds.length;
  const totalRolesCount = topRoles.length + otherRoles.length + customRoles.length;

  return (
    <div className="recommendations-container">
      {/* Header */}
      <div className="card mb-4 text-center">
        <div className="badge-pill mb-2">Hasil Rekomendasi Terurut RIASEC</div>
        <h2 className="title-lg">Pilihan Relevan untuk {studentInfo.name}</h2>
        <p className="text-muted max-w-lg mx-auto">
          Rekomendasi diurutkan dari skor korelasi <strong>paling tinggi ke rendah</strong>.
          Kamu dapat <strong>memilih lebih dari satu opsi</strong> atau me-request profesi baru agar diriset langsung oleh Robot UiPath.
        </p>

        {/* Live UiPath Sync Bar */}
        <div className="sync-status-bar mt-3 mb-2">
          <span className="text-xs text-muted">
            {catalogSyncInfo.source === 'riasec-uipath-dynamic'
              ? `🎯 Disusun dinamis dari profil RIASEC (${(profile?.topDimensions || []).join('+')}) & Output UiPath (${topRoles.length + otherRoles.length} profesi)`
              : catalogSyncInfo.source === 'live-uipath-output'
                ? `🤖 Katalog disinkronkan otomatis dari output Robot UiPath (${topRoles.length + otherRoles.length} profesi)`
                : `📦 Katalog lokal (${topRoles.length + otherRoles.length} profesi)`}
          </span>
          {onRefreshCatalog && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onRefreshCatalog}
              disabled={catalogSyncInfo.syncing}
            >
              {catalogSyncInfo.syncing ? '⏳ Menyinkronkan...' : '🔄 Sinkronkan Output UiPath'}
            </button>
          )}
        </div>

        {riasecQueueNotice && (
          <div className="feedback-banner feedback-success mt-2 text-left">
            ✅ <strong>Sinkronisasi RIASEC → UiPath Berhasil:</strong> Rekomendasi teratas sesuai profil RIASEC-mu (<strong>{riasecQueueNotice.job}</strong>) telah otomatis dimasukkan ke antrean <code>Desire Role List.xlsx</code> untuk email <code>{riasecQueueNotice.recipientEmail}</code>!
          </div>
        )}

        {/* Tab Switcher */}
        <div className="tab-switcher mt-3">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'careers' ? 'active' : ''}`}
            onClick={() => setActiveTab('careers')}
          >
            💼 Pilihan Profesi ({totalRolesCount})
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
          {/* On-Demand Custom Role Request Box */}
          <form onSubmit={handleCustomSubmit} className="card custom-role-box mb-4">
            <div className="d-flex justify-between align-center flex-wrap gap-2">
              <div style={{ flex: '1 1 260px' }}>
                <div className="font-bold text-sm text-accent">
                  ✨ Profesi impianmu belum ada di daftar?
                </div>
                <div className="text-xs text-muted">
                  Ketik nama profesi apa saja (contoh: <em>Data Scientist</em>, <em>UI/UX Designer</em>) agar Robot UiPath melakukan riset live khusus untukmu!
                </div>
              </div>
              <div className="d-flex gap-2" style={{ flex: '1 1 300px' }}>
                <input
                  type="text"
                  className="input-control text-sm"
                  placeholder="Ketik profesi impianmu..."
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!customRoleInput.trim()}
                >
                  + Request ke Robot
                </button>
              </div>
            </div>
          </form>

          {/* Custom On-Demand Roles Requested by Student */}
          {customRoles.length > 0 && (
            <div className="mb-4">
              <div className="section-label-row mb-2">
                <span className="font-semibold text-sm text-accent">🤖 Permintaan Riset On-Demand ke Robot UiPath</span>
              </div>
              <div className="careers-grid">
                {customRoles.map(role =>
                  renderRoleCard(role, selectedRoleIds.includes(role.id), toggleSelectRole, handleOpenDossier)
                )}
              </div>
            </div>
          )}

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

      {/* Modal Dossier Viewer — Tidak me-reload halaman & tidak kehilangan sesi */}
      {previewRole && (
        <div className="modal-backdrop" onClick={() => setPreviewRole(null)}>
          <div className="modal-container card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header d-flex justify-between align-center pb-3 border-bottom mb-3">
              <div className="d-flex align-center gap-2">
                <span style={{ fontSize: '1.25rem' }}>📖</span>
                <div>
                  <h3 className="modal-title font-bold">{previewRole.title} — Dossier Lengkap</h3>
                  <span className="text-xs text-muted">Hasil Riset Otomatis Robot UiPath & Gemini AI</span>
                </div>
              </div>

              <div className="d-flex align-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => handleOpenNewTab(e, previewRole)}
                  title="Buka di Jendela Baru"
                >
                  Buka di Tab Baru ↗
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setPreviewRole(null)}
                  style={{ fontSize: '1.1rem', padding: '4px 10px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ flex: 1, minHeight: '550px' }}>
              <iframe
                title={`Dossier ${previewRole.title}`}
                src={`/dossiers/${encodeURIComponent(previewRole.dossier_html_path.split('/')[0])}/${encodeURIComponent(previewRole.dossier_html_path.split('/')[1])}`}
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>
      )}
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
        {role.isCustomRequest ? (
          <span className="match-badge">🤖 On-Demand</span>
        ) : (
          <span className={`match-badge ${isLowerRank ? 'match-neutral' : ''}`}>
            {role.matchScore}% Relevan
          </span>
        )}
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

        {role.dossier_available !== false ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => onOpenDossier(e, role)}
          >
            📖 Buka Dossier Lengkap
          </button>
        ) : (
          <span className="text-xs text-accent font-semibold">
            ⏳ Menunggu Riset Robot UiPath
          </span>
        )}
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
            <h3 className="major-title">{major.name}</h3>
            <span className="text-xs text-muted">{major.type}</span>
          </div>
        </div>
        <span className={`match-badge ${isLowerRank ? 'match-neutral' : ''}`}>
          {major.matchScore}% Cocok
        </span>
      </div>

      <p className="text-sm text-muted mb-3">{major.description}</p>

      <div className="mb-3">
        <div className="text-xs font-semibold text-muted mb-1">Mata Kuliah Inti:</div>
        <div className="tags-cloud">
          {major.key_subjects.map((sub, sIdx) => (
            <span key={`sub-${sIdx}`} className="tag-pill">{sub}</span>
          ))}
        </div>
      </div>

      <div className="pt-2 border-top d-flex justify-between align-center">
        <div className="text-xs text-muted">
          Prospek: <strong>{major.career_links.join(', ')}</strong>
        </div>
        <span className="text-xs text-accent font-semibold">
          {isSelected ? '✓ Terpilih' : '+ Pilih'}
        </span>
      </div>
    </div>
  );
}
