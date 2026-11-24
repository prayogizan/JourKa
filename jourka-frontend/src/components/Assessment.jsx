import React, { useState } from 'react';

export default function Assessment({ questions, onComplete, studentName }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (option) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        score: option.score !== undefined ? option.score : 0,
        value: option.value || null,
        text: option.text
      }
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrev = () => {
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
          <span className="text-sm font-semibold">Pertanyaan {currentIndex + 1} dari {questions.length}</span>
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

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!selectedAnswer}
        >
          {currentIndex === questions.length - 1 ? 'Lihat Hasil Minatku ✨' : 'Selanjutnya →'}
        </button>
      </div>
    </div>
  );
}
