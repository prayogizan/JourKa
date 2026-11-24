import React from 'react';
import RadarChart from './RadarChart';

const DIM_DESCRIPTIONS = {
  R: { name: 'Realistic (Praktis)', desc: 'Menyukai hal nyata, perakitan, perangkat keras, dan tindakan fisik.' },
  I: { name: 'Investigative (Analitis)', desc: 'Menyukai pemecahan masalah logis, riset, sains, dan analisis data.' },
  A: { name: 'Artistic (Kreatif)', desc: 'Menyukai ekspresi visual, desain, media, dan ide-ide orisinal.' },
  S: { name: 'Social (Kolaboratif)', desc: 'Menyukai interaksi tim, pendampingan, mengajar, dan pelayanan sosial.' },
  E: { name: 'Enterprising (Persuasif)', desc: 'Menyukai kepemimpinan, komunikasi bisnis, pitching ide, dan wirausaha.' },
  C: { name: 'Conventional (Teratur)', desc: 'Menyukai keteraturan, prosedur terencana, ketelitian, dan pengarsipan data.' }
};

export default function InterestProfile({ profile, studentInfo, onProceed }) {
  const { scores, archetypeTitle, archetypeDesc } = profile;

  return (
    <div className="card profile-card">
      <div className="profile-header text-center mb-4">
        <div className="badge-pill mb-2">Profil Eksplorasi Minat</div>
        <h2 className="title-lg">Halo, {studentInfo.name}! 👋</h2>
        <div className="archetype-badge mt-2 mb-2">{archetypeTitle}</div>
        <p className="text-muted max-w-md mx-auto">{archetypeDesc}</p>
      </div>

      <div className="profile-grid mb-4">
        {/* Radar Chart Column */}
        <div className="radar-col card-subtle p-3 text-center">
          <h3 className="section-subtitle mb-2">Diagram Radar RIASEC</h3>
          <RadarChart scores={scores} />
          <div className="text-xs text-muted mt-2">
            Peta kekuatan minat berdasarkan 6 dimensi RIASEC
          </div>
        </div>

        {/* Breakdown Dimension Bars */}
        <div className="bars-col">
          <h3 className="section-subtitle mb-3">Rincian Dimensi Minat</h3>
          <div className="dimension-list">
            {Object.entries(scores).map(([dim, score]) => {
              const meta = DIM_DESCRIPTIONS[dim];
              return (
                <div key={dim} className="dim-row mb-3">
                  <div className="d-flex justify-between align-center mb-1">
                    <span className="font-semibold text-sm">{meta.name}</span>
                    <span className="font-bold text-sm text-accent">{score}%</span>
                  </div>
                  <div className="dim-track">
                    <div className="dim-bar" style={{ width: `${score}%` }}></div>
                  </div>
                  <div className="dim-desc text-xs text-muted mt-1">{meta.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center pt-2">
        <button type="button" className="btn btn-primary btn-lg" onClick={onProceed}>
          Lihat Rekomendasi Profesi & Jurusan →
        </button>
      </div>
    </div>
  );
}
