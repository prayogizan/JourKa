/**
 * JourKa Recommendation Engine
 * Menghitung skor kecocokan profesi & jurusan berdasarkan profil siswa dengan formula transparan.
 * Formula Bobot: RIASEC 45% + Aktivitas 25% + Lingkungan 15% + Jalur 15%
 */

export function computeRecommendations(profile, preferences, catalog) {
  const { scores, topDimensions } = profile;
  const userEnv = preferences.environment;
  const userPathway = preferences.pathway;

  const scoredRoles = catalog.roles.map(role => {
    // 1. RIASEC Match (45%)
    let riasecSum = 0;
    let weightSum = 0;
    Object.entries(role.riasec_weights).forEach(([dim, weight]) => {
      const studentScore = scores[dim] || 0;
      riasecSum += studentScore * weight;
      weightSum += weight;
    });
    const riasecScore = weightSum > 0 ? (riasecSum / weightSum) : 50;

    // 2. Activity / Primary Dimension Overlap (25%)
    let activityScore = 40;
    if (topDimensions.includes('I') && role.riasec_weights['I'] >= 0.5) activityScore += 30;
    if (topDimensions.includes('A') && role.riasec_weights['A'] >= 0.5) activityScore += 30;
    if (topDimensions.includes('R') && role.riasec_weights['R'] >= 0.4) activityScore += 25;
    if (topDimensions.includes('S') && role.riasec_weights['S'] >= 0.4) activityScore += 25;
    activityScore = Math.min(100, activityScore);

    // 3. Work Environment Match (15%)
    const envMatch = role.preferred_env.includes(userEnv);
    const envScore = envMatch ? 100 : 50;

    // 4. Pathway Match (15%)
    const pathwayMatch = role.preferred_pathways.includes(userPathway);
    const pathwayScore = pathwayMatch ? 100 : 50;

    // Total Weighted Score
    const totalScore = Math.round(
      (0.45 * riasecScore) +
      (0.25 * activityScore) +
      (0.15 * envScore) +
      (0.15 * pathwayScore)
    );

    // Generate Explainable Reasons
    const reasons = [];
    if (role.riasec_weights[topDimensions[0]] >= 0.4) {
      reasons.push(`Sangat selaras dengan minat utama kamu di bidang ${getDimensionName(topDimensions[0])} (${scores[topDimensions[0]]}%).`);
    }
    if (envMatch) {
      reasons.push(`Cocok dengan preferensi suasana kerja yang kamu pilih (${formatEnv(userEnv)}).`);
    }
    if (pathwayMatch) {
      reasons.push(`Mendukung target kelulusanmu untuk melanjutkan ke ${formatPathway(userPathway)}.`);
    }
    if (reasons.length < 2) {
      reasons.push(`Menawarkan prospek eksplorasi yang terbuka bagi lulusan baru dengan keterampilan adaptif.`);
    }

    return {
      ...role,
      matchScore: Math.min(98, Math.max(55, totalScore)),
      reasons
    };
  });

  // Sort and pick top 3-4
  const topRoles = scoredRoles.sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);

  // Match Majors
  const scoredMajors = catalog.majors.map(major => {
    let majorScore = 0;
    major.top_match_dimensions.forEach(dim => {
      majorScore += (scores[dim] || 0);
    });
    const avgScore = Math.round(majorScore / major.top_match_dimensions.length);
    return {
      ...major,
      matchScore: Math.min(95, Math.max(60, avgScore))
    };
  }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);

  return {
    recommendedRoles: topRoles,
    recommendedMajors: scoredMajors
  };
}

function getDimensionName(dim) {
  const map = {
    R: 'Praktik & Realistik',
    I: 'Investigatif & Analisis Logika',
    A: 'Artistik & Kreativitas Visual',
    S: 'Sosial & Edukasi',
    E: 'Wirausaha & Kepemimpinan',
    C: 'Ketelitian & Prosedural'
  };
  return map[dim] || dim;
}

function formatEnv(env) {
  const map = {
    remote_flexible: 'Kerja Fleksibel / Remote',
    creative_studio: 'Studio Kreatif Dinamis',
    structured_lab: 'Laboratorium & Fasilitas Terstruktur',
    corporate_business: 'Korporasi Profesional'
  };
  return map[env] || 'Lingkungan Terpilih';
}

function formatPathway(path) {
  const map = {
    s1_academic: 'Kuliah S1 Akademik',
    vokasi_politeknik: 'Vokasi / Politeknik Terapan',
    bootcamp_training: 'Bootcamp & Pelatihan Kerja',
    direct_work: 'Jalur Mandiri / Siap Kerja'
  };
  return map[path] || 'Jalur Terpilih';
}
