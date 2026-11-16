import React from 'react';
import { RiskLevel } from '../types/cuidar.ts';

interface CircularRiskGaugeProps {
  score: number; // 0 to 100
  riskLevel: RiskLevel;
  size?: number;
  strokeWidth?: number;
}

export const CircularRiskGauge: React.FC<CircularRiskGaugeProps> = ({
  score,
  riskLevel,
  size = 132,
  strokeWidth = 8,
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(5, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const getStrokeColor = (level: RiskLevel) => {
    if (level === 'Elevado') return '#F28B82'; // Soft warm coral-red for high risk without garish neon
    if (level === 'Moderado') return '#F5C469'; // Warm amber for moderate risk
    return '#6FBF94'; // CUIDAR signature tech green for low risk
  };

  const getGlyph = (level: RiskLevel) => {
    if (level === 'Elevado') return '▲';
    if (level === 'Moderado') return '◆';
    return '●';
  };

  const activeColor = getStrokeColor(riskLevel);

  return (
    <div
      className="relative inline-flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Subtle background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#1C1F1E"
          strokeWidth={strokeWidth}
        />
        {/* Animated risk arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <span className="text-[11px] text-[#A0AAA4] tracking-tight">Riesgo</span>
        <span
          className="text-lg font-display font-semibold tracking-tight mt-0.5"
          style={{ color: activeColor }}
        >
          {getGlyph(riskLevel)} {riskLevel}
        </span>
        <span className="text-xs font-mono-tabular text-[#A0AAA4] mt-0.5">
          {clampedScore}% índice
        </span>
      </div>
    </div>
  );
};
