import React, { useState, useRef, useEffect } from 'react';

export default function Assessment({ questions, onComplete, studentName }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const autoAdvanceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }
    };
  }, []);

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (option) => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
    }

    const updatedAnswers = {
      ...answers,
      [currentQ.id]: {
        score: option.score !== undefined ? option.score : 0,
        value: option.value || null,
        text: option.text
      }
    };
    setAnswers(updatedAnswers);

    // Auto-advance directly to next question (or complete on last question) after brief visual feedback
    autoAdvanceRef.current = setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onComplete(updatedAnswers);
      }
    }, 220);
  };

  const handleNext = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrev = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
    }
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const selectedAnswer = answers[currentQ.id];

  return (
    <div className="card assessment-card">
      {/* Progress Bar */}
      <div className="progress-header mb-3">
        <div className="d-flex justify-between align-center text-muted mb-1">
          <span className="text-sm font-semibold">
            Pertanyaan {currentIndex + 1} dari {questions.length} ({studentName})
          </span>
          <span className="text-sm">{progressPercent}% Selesai</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Question Details */}
      <div className="question-body mb-4">
        <div className="badge-category mb-2">{currentQ.title}</div>
        <h2 className="question-scenario">{currentQ.scenario}</h2>
      </div>

      {/* Options List */}
      <div className="options-grid mb-4">
        {currentQ.options.map((opt, idx) => {
          const isSelected = selectedAnswer && (
            opt.score !== undefined ? selectedAnswer.score === opt.score : selectedAnswer.value === opt.value
          );

          return (
            <button
              key={`opt-${idx}`}
              type="button"
              className={`option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelectOption(opt)}
            >
              <div className="option-indicator">
                {isSelected ? '●' : '○'}
              </div>
              <div className="option-text">
                {opt.text}
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="d-flex justify-between align-center">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          ← Sebelumnya
        </button>

        <span className="text-xs text-muted">
          ⚡ Pilih salah satu jawaban untuk langsung lanjut
        </span>

        {selectedAnswer && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleNext}
          >
            {currentIndex === questions.length - 1 ? 'Lihat Hasil ✨' : 'Lanjut →'}
          </button>
        )}
      </div>
    </div>
  );
}
