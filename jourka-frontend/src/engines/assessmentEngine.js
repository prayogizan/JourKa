/**
 * JourKa Assessment Engine
 * Menghitung profil minat siswa berdasarkan 6 dimensi RIASEC.
 */

const ARCHETYPES = {
  'IR': { title: 'Teknolog & Problem Solver Analitis', desc: 'Kamu memiliki rasa ingin tahu tinggi pada cara kerja sistem teknologi dan senang membongkar masalah secara sistematis.' },
  'RI': { title: 'Praktisi Teknologi & Perekayasa', desc: 'Kamu senang bereksperimen langsung dengan alat, kode, atau perangkat nyata untuk menciptakan solusi fungsional.' },
  'AR': { title: 'Kreator Media & Desainer Visual', desc: 'Kamu memiliki kepekaan estetika kuat yang dipadukan dengan keterampilan teknis mengoperasikan software kreatif.' },
  'RA': { title: 'Pengrajin Digital & Visual Builder', desc: 'Kamu menyukai pembuatan karya visual nyata yang menggabungkan presisi teknis dan sentuhan seni.' },
  'IS': { title: 'Eksplorer Sains & Pemerhati Kesehatan', desc: 'Kamu didorong oleh rasa ingin tahu ilmiah untuk memberikan dampak positif langsung bagi kesehatan atau kesejahteraan sesama.' },
  'SI': { title: 'Mentor Edukatif & Konsultan Solutif', desc: 'Kamu senang membantu orang lain memahami konsep rumit dengan cara yang ramah dan logis.' },
  'IE': { title: 'Inovator Strategis & Problem Solver', desc: 'Kamu memadukan analisis logika tajam dengan inisiatif untuk memimpin solusi di dunia nyata.' },
  'EI': { title: 'Penggerak Proyek & Visioner Bisnis', desc: 'Kamu pandai melihat peluang, mengarahkan tim, dan menggunakan logika untuk mencapai target bersama.' },
  'IC': { title: 'Analis Presisi & Spesialis Data', desc: 'Kamu sangat menghargai ketelitian, kejelasan metode, dan analisis berbasis fakta yang teratur.' },
  'CI': { title: 'Arsitek Keteraturan & Peneliti Prosedural', desc: 'Kamu handal memastikan sistem berjalan sesuai aturan baku dengan audit yang rapi dan terukur.' }
};

export function calculateRiasecProfile(answers, questions) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const maxPossible = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  questions.forEach(q => {
    if (q.category === 'riasec') {
      const dim = q.dimension;
      maxPossible[dim] += 4;
      const ans = answers[q.id];
      if (ans && typeof ans.score === 'number') {
        scores[dim] += ans.score;
      }
    }
  });

  // Normalisasi ke persentase 0-100%
  const normalized = {};
  Object.keys(scores).forEach(dim => {
    const max = maxPossible[dim] || 4;
    normalized[dim] = Math.round((scores[dim] / max) * 100);
  });

  // Tentukan 2 dimensi tertinggi
  const sortedDims = Object.entries(normalized).sort((a, b) => b[1] - a[1]);
  const primaryDim = sortedDims[0][0];
  const secondaryDim = sortedDims[1][0];
  const pairKey = `${primaryDim}${secondaryDim}`;

  const archetype = ARCHETYPES[pairKey] || ARCHETYPES[`${secondaryDim}${primaryDim}`] || {
    title: 'Eksplorer Minat Multitalenta',
    desc: 'Kamu memiliki ketertarikan yang seimbang di berbagai bidang dan sangat fleksibel beradaptasi dengan berbagai tantangan baru.'
  };

  return {
    scores: normalized,
    topDimensions: [primaryDim, secondaryDim],
    archetypeTitle: archetype.title,
    archetypeDesc: archetype.desc,
    rawAnswers: answers
  };
}
