import React, { useState } from 'react';
import questionsData from './data/questions.json';
import catalogData from './data/roles.json';
import { calculateRiasecProfile } from './engines/assessmentEngine';
import { computeRecommendations } from './engines/recommendationEngine';

import Onboarding from './components/Onboarding';
import Assessment from './components/Assessment';
import InterestProfile from './components/InterestProfile';
import Recommendations from './components/Recommendations';
import ActionPlan from './components/ActionPlan';

export default function App() {
  const [currentStep, setCurrentStep] = useState('onboarding'); // 'onboarding' | 'assessment' | 'profile' | 'recommendations' | 'actionplan'
  const [studentInfo, setStudentInfo] = useState({ name: '', grade: '11' });
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [theme, setTheme] = useState('light');

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
    // 1. Calculate RIASEC
    const computedProfile = calculateRiasecProfile(answers, questionsData);
    setProfile(computedProfile);

    // 2. Extract preferences
    const preferences = {
      environment: answers['q7']?.value || 'remote_flexible',
      pathway: answers['q8']?.value || 's1_academic'
    };

    // 3. Compute Recommendations
    const computedRecs = computeRecommendations(computedProfile, preferences, catalogData);
    setRecommendations(computedRecs);

    setCurrentStep('profile');
  };

  const handleRestart = () => {
    setProfile(null);
    setRecommendations(null);
    setCurrentStep('onboarding');
  };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="brand-title">
          <span>🧭</span>
          <span>JourKa</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ink-muted)' }}>
            | Discovery Platform
          </span>
        </div>

        <div className="d-flex align-center gap-2">
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
            onProceed={() => setCurrentStep('recommendations')}
          />
        )}

        {currentStep === 'recommendations' && recommendations && (
          <Recommendations
            recommendations={recommendations}
            studentInfo={studentInfo}
            onNextAction={() => setCurrentStep('actionplan')}
            onBackProfile={() => setCurrentStep('profile')}
          />
        )}

        {currentStep === 'actionplan' && recommendations && (
          <ActionPlan
            studentInfo={studentInfo}
            profile={profile}
            recommendations={recommendations}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}
