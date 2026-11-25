import React, { useState, useEffect, useCallback } from 'react';
import questionsData from './data/questions.json';
import initialCatalogData from './data/roles.json';
import { calculateRiasecProfile } from './engines/assessmentEngine';
import { computeRecommendations } from './engines/recommendationEngine';

import Onboarding from './components/Onboarding';
import Assessment from './components/Assessment';
import InterestProfile from './components/InterestProfile';
import Recommendations from './components/Recommendations';
import ActionPlan from './components/ActionPlan';

export default function App() {
  const [currentStep, setCurrentStep] = useState('onboarding'); // 'onboarding' | 'assessment' | 'profile' | 'recommendations' | 'actionplan'
  const [studentInfo, setStudentInfo] = useState({ name: '', grade: '11', email: '' });
  const [catalog, setCatalog] = useState(initialCatalogData);
  const [catalogSyncInfo, setCatalogSyncInfo] = useState({
    source: 'cached-json',
    syncedAt: null,
    syncing: false
  });
  const [lastAnswers, setLastAnswers] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [riasecQueueNotice, setRiasecQueueNotice] = useState(null);
  const [customRoles, setCustomRoles] = useState([]);
  const [selectedItems, setSelectedItems] = useState({ roleIds: [], majorIds: [] });
  const [theme, setTheme] = useState('light');

  const recomputeWithCatalog = useCallback((activeCatalog, computedProfile, answers) => {
    if (!computedProfile || !answers) return null;
    const preferences = {
      environment: answers['q7']?.value || 'remote_flexible',
      pathway: answers['q8']?.value || 's1_academic'
    };
    const computedRecs = computeRecommendations(computedProfile, preferences, activeCatalog);
    setRecommendations(computedRecs);
    return computedRecs;
  }, []);

  const refreshCatalog = useCallback(async () => {
    setCatalogSyncInfo(prev => ({ ...prev, syncing: true }));
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        const liveData = await res.json();
        if (Array.isArray(liveData.roles) && liveData.roles.length > 0) {
          const nextCatalog = { roles: liveData.roles, majors: liveData.majors };
          setCatalog(nextCatalog);
          setCatalogSyncInfo({
            source: liveData.source || 'live-uipath-output',
            syncedAt: liveData.syncedAt || new Date().toISOString(),
            syncing: false
          });
          if (profile && lastAnswers) {
            recomputeWithCatalog(nextCatalog, profile, lastAnswers);
          }
          return nextCatalog;
        }
      }
    } catch {
      // Static build fallback without Vite bridge middleware
    }
    setCatalogSyncInfo(prev => ({ ...prev, syncing: false }));
    return null;
  }, [profile, lastAnswers, recomputeWithCatalog]);

  useEffect(() => {
    refreshCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleStartOnboarding = (info) => {
    setStudentInfo(info);
    setCurrentStep('assessment');
  };

  const handleCompleteAssessment = (answers) => {
    setLastAnswers(answers);
    const computedProfile = calculateRiasecProfile(answers, questionsData);
    setProfile(computedProfile);
    const computedRecs = recomputeWithCatalog(catalog, computedProfile, answers);
    setSelectedItems({
      roleIds: computedRecs.topRoles.slice(0, 1).map(r => r.id),
      majorIds: computedRecs.topMajors.slice(0, 1).map(m => m.id)
    });
    setCurrentStep('profile');
  };

  /**
   * Uses the displayed RIASEC result as the live reference to build the profession & major list
   * from the UiPath bridge and optionally auto-queues the top role into Desire Role List.xlsx.
   */
  const handleProceedFromProfile = async ({ email, autoQueue }) => {
    const nextStudentInfo = { ...studentInfo, email: email ?? studentInfo.email };
    setStudentInfo(nextStudentInfo);
    setLoadingRecs(true);
    setRiasecQueueNotice(null);

    const preferences = {
      environment: lastAnswers?.['q7']?.value || 'remote_flexible',
      pathway: lastAnswers?.['q8']?.value || 's1_academic'
    };

    try {
      const res = await fetch('/api/riasec-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          preferences,
          studentInfo: nextStudentInfo,
          autoQueueToUiPath: autoQueue
        })
      });

      if (res.ok) {
        const data = await res.json();
        const dynamicCatalog = { roles: data.roles, majors: data.majors };
        setCatalog(dynamicCatalog);
        setCatalogSyncInfo({
          source: data.source || 'riasec-uipath-dynamic',
          syncedAt: data.syncedAt || new Date().toISOString(),
          syncing: false
        });
        const computedRecs = recomputeWithCatalog(dynamicCatalog, profile, lastAnswers);
        setSelectedItems({
          roleIds: computedRecs.topRoles.slice(0, 1).map(r => r.id),
          majorIds: computedRecs.topMajors.slice(0, 1).map(m => m.id)
        });
        if (data.queuedToUiPath) {
          setRiasecQueueNotice(data.queuedToUiPath);
        }
        setLoadingRecs(false);
        setCurrentStep('recommendations');
        return;
      }
    } catch {
      // Fallback gracefully when running static build without Vite middleware
    }

    const fallbackRecs = recomputeWithCatalog(catalog, profile, lastAnswers);
    if (fallbackRecs) {
      setSelectedItems({
        roleIds: fallbackRecs.topRoles.slice(0, 1).map(r => r.id),
        majorIds: fallbackRecs.topMajors.slice(0, 1).map(m => m.id)
      });
    }
    setLoadingRecs(false);
    setCurrentStep('recommendations');
  };

  const handleAddCustomRole = (roleTitle) => {
    const trimmed = roleTitle.trim();
    if (!trimmed) return null;
    const slug = `custom-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    const existing = customRoles.find(r => r.id === slug);
    if (existing) return existing;

    const newRole = {
      id: slug,
      title: trimmed,
      isCustomRequest: true,
      matchScore: null,
      brief_desc: `Profesi khusus permintaanmu. Robot UiPath akan melakukan live scraping lowongan LinkedIn, YouTube, serta sintesis dossier Gemini AI secara on-demand.`,
      salary_idr: 'Akan diriset live oleh Robot UiPath',
      degree_verdict: 'Akan dirangkum di Dossier PDF',
      dossier_available: false,
      reasons: ['Ditambahkan khusus oleh siswa untuk riset On-Demand Robot UiPath.']
    };
    setCustomRoles(prev => [...prev, newRole]);
    return newRole;
  };

  const handleProceedToActionPlan = (selected) => {
    setSelectedItems(selected);
    setCurrentStep('actionplan');
  };

  const handleRestart = () => {
    setProfile(null);
    setLastAnswers(null);
    setRecommendations(null);
    setRiasecQueueNotice(null);
    setCustomRoles([]);
    setSelectedItems({ roleIds: [], majorIds: [] });
    setCurrentStep('onboarding');
  };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header no-print">
        <div className="brand-title">
          <span>🧭</span>
          <span>JourKa</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ink-muted)' }}>
            | Discovery Platform
          </span>
        </div>

        <div className="d-flex align-center gap-2">
          {(catalogSyncInfo.source === 'live-uipath-output' || catalogSyncInfo.source === 'riasec-uipath-dynamic' || catalogSyncInfo.source === 'vercel-catalog') && (
            <span className="badge-pill" title="Terhubung dengan Katalog & Bridge UiPath">
              🟢 Live Bridge ({catalog.roles.length} Profesi)
            </span>
          )}
          {studentInfo.name && (
            <span className="text-sm font-semibold text-muted">
              {studentInfo.name} ({studentInfo.grade === 'grad' ? 'Fresh Grad' : `Kelas ${studentInfo.grade}`})
            </span>
          )}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={toggleTheme}
            title="Ganti Tema Gelap / Terang"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Main Flow View */}
      <main className="main-content">
        {currentStep === 'onboarding' && (
          <Onboarding onStart={handleStartOnboarding} />
        )}

        {currentStep === 'assessment' && (
          <Assessment
            questions={questionsData}
            studentName={studentInfo.name}
            onComplete={handleCompleteAssessment}
          />
        )}

        {currentStep === 'profile' && profile && (
          <InterestProfile
            profile={profile}
            studentInfo={studentInfo}
            loadingRecs={loadingRecs}
            onProceed={handleProceedFromProfile}
          />
        )}

        {currentStep === 'recommendations' && recommendations && (
          <Recommendations
            recommendations={recommendations}
            studentInfo={studentInfo}
            profile={profile}
            initialSelected={selectedItems}
            customRoles={customRoles}
            riasecQueueNotice={riasecQueueNotice}
            onAddCustomRole={handleAddCustomRole}
            onRefreshCatalog={refreshCatalog}
            catalogSyncInfo={catalogSyncInfo}
            onNextAction={handleProceedToActionPlan}
            onBackProfile={() => setCurrentStep('profile')}
          />
        )}

        {currentStep === 'actionplan' && recommendations && (
          <ActionPlan
            studentInfo={studentInfo}
            profile={profile}
            recommendations={recommendations}
            customRoles={customRoles}
            selectedItems={selectedItems}
            onBackToRecs={() => setCurrentStep('recommendations')}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}
