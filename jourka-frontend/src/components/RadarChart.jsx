import React from 'react';

/**
 * Pure SVG Radar Chart untuk 6 Dimensi RIASEC
 */
export default function RadarChart({ scores }) {
  const dimensions = [
    { key: 'R', label: 'Realistic (R)' },
    { key: 'I', label: 'Investigative (I)' },
    { key: 'A', label: 'Artistic (A)' },
    { key: 'S', label: 'Social (S)' },
    { key: 'E', label: 'Enterprising (E)' },
    { key: 'C', label: 'Conventional (C)' }
  ];

  const size = 320;
  const center = size / 2;
  const radius = size * 0.38;
  const angleStep = (Math.PI * 2) / dimensions.length;

  // Grid levels (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.5, 0.75, 1];

  // Helper polar to cartesian
  const getPoint = (angle, dist) => {
    const x = center + dist * Math.cos(angle - Math.PI / 2);
    const y = center + dist * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };

  // Build polygon points for current student scores
  const dataPoints = dimensions.map((dim, idx) => {
    const val = (scores[dim.key] || 0) / 100;
    const angle = idx * angleStep;
    return getPoint(angle, radius * Math.max(0.15, val));
  });

  const polygonPath = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="radar-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Grids */}
        {levels.map((lvl, lIdx) => {
          const gridPoints = dimensions.map((_, idx) => {
            const pt = getPoint(idx * angleStep, radius * lvl);
            return `${pt.x},${pt.y}`;
          }).join(' ');
          return (
            <polygon
              key={`grid-${lIdx}`}
              points={gridPoints}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={lvl === 1 ? 'none' : '3,3'}
            />
          );
        })}

        {/* Axis Spokes */}
        {dimensions.map((dim, idx) => {
          const pt = getPoint(idx * angleStep, radius);
          const labelPt = getPoint(idx * angleStep, radius + 22);
          return (
            <g key={`axis-${dim.key}`}>
              <line x1={center} y1={center} x2={pt.x} y2={pt.y} stroke="#cbd5e1" strokeWidth="1" />
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fontWeight="600"
                fill="#475569"
              >
                {dim.key}
              </text>
            </g>
          );
        })}

        {/* Data Shape */}
        <polygon
          points={polygonPath}
          fill="rgba(37, 99, 235, 0.22)"
          stroke="#2563eb"
          strokeWidth="2.5"
        />

        {/* Data Points */}
        {dataPoints.map((pt, idx) => (
          <circle
            key={`dot-${idx}`}
            cx={pt.x}
            cy={pt.y}
            r="4.5"
            fill="#2563eb"
            stroke="#ffffff"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}
