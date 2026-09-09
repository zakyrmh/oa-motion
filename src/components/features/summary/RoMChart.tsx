import { useState } from 'react';
import type { RepetitionRecord } from '@/types/session';
import type { OAGrade } from '@/types/clinical';
import { SAFE_ROM_LIMITS } from '@/constants/clinical';

interface RoMChartProps {
  repetitionHistory: RepetitionRecord[];
  oaGrade: OAGrade;
  className?: string;
}

export function RoMChart({ repetitionHistory, oaGrade, className = '' }: RoMChartProps) {
  const [hoveredRep, setHoveredRep] = useState<RepetitionRecord | null>(null);
  const limits = SAFE_ROM_LIMITS[oaGrade];
  const maxSafeLimit = limits.maxSafeFlexionAngle;

  // Edge case: if no repetition history exists
  if (!repetitionHistory || repetitionHistory.length === 0) {
    return (
      <div className={`bg-[#ffffff] rounded-3xl border-2 border-[#000000] p-6 text-center text-[#979797] font-mono text-sm ${className}`}>
        Belum ada data grafik fleksi sudut untuk sesi ini.
      </div>
    );
  }

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 260;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 40;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Y Scale calculations (flexion angle range 0° to maxRange)
  const maxAngleInHistory = Math.max(...repetitionHistory.map((r) => r.maxFlexionAngle), maxSafeLimit);
  const yMax = Math.min(140, Math.ceil((maxAngleInHistory + 15) / 10) * 10);
  const yMin = 0;

  const getX = (index: number) => {
    if (repetitionHistory.length === 1) {
      return paddingLeft + chartWidth / 2;
    }
    return paddingLeft + (index / (repetitionHistory.length - 1)) * chartWidth;
  };

  const getY = (angle: number) => {
    const clampedAngle = Math.max(yMin, Math.min(yMax, angle));
    return paddingTop + chartHeight - ((clampedAngle - yMin) / (yMax - yMin)) * chartHeight;
  };

  const safeLimitY = getY(maxSafeLimit);

  // Generate path string for trend line
  const points = repetitionHistory.map((rep, idx) => ({
    x: getX(idx),
    y: getY(rep.maxFlexionAngle),
    rep,
  }));

  const linePath = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Area path below trend line
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : '';

  // Y-axis grid ticks (e.g. 0, 30, 60, 90, 120...)
  const yTicks = [0, 30, 60, maxSafeLimit, 120].filter((val, i, self) => self.indexOf(val) === i && val <= yMax);
  yTicks.sort((a, b) => a - b);

  return (
    <div className={`bg-[#ffffff] rounded-3xl border-2 border-[#000000] p-4 sm:p-5 shadow-none flex flex-col gap-4 ${className}`}>
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5e5e5] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#979797] uppercase font-bold">GRAFIK TREN //</span>
            <h4 className="font-mono text-xs text-[#000000] uppercase font-bold tracking-tight">
              SUDUT FLEKSI LUTUT (RANGE OF MOTION)
            </h4>
          </div>
          <p className="text-xs font-medium text-[#444444] mt-0.5">
            Tren fluktuasi sudut tekukan lutut per repetisi terhadap ambang batas aman ({maxSafeLimit}°).
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono font-bold shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#d1ffca] border border-[#000000]" />
            <span className="text-[#000000]">Aman</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#EF4444] border border-[#000000]" />
            <span className="text-[#000000]">Overflex</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#EF4444] border-t-2 border-dashed border-[#EF4444]" />
            <span className="text-[#DC2626]">Batas ({maxSafeLimit}°)</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[500px] select-none"
          aria-label="Grafik Tren Sudut Fleksi Lutut Sesi Terakhir"
        >
          <defs>
            <linearGradient id="romGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d1ffca" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d1ffca" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines & Y Labels */}
          {yTicks.map((tick) => {
            const yPos = getY(tick);
            const isLimitTick = tick === maxSafeLimit;
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={svgWidth - paddingRight}
                  y2={yPos}
                  stroke={isLimitTick ? '#EF4444' : '#e5e5e5'}
                  strokeDasharray={isLimitTick ? '4 4' : '2 2'}
                  strokeWidth={isLimitTick ? 2 : 1}
                />
                <text
                  x={paddingLeft - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  className={`font-mono text-[10px] font-bold ${
                    isLimitTick ? 'fill-[#DC2626]' : 'fill-[#979797]'
                  }`}
                >
                  {tick}°
                </text>
              </g>
            );
          })}

          {/* Safe RoM Threshold Badge Label on Y Axis */}
          <rect
            x={svgWidth - paddingRight - 105}
            y={safeLimitY - 11}
            width="105"
            height="18"
            rx="4"
            fill="#EF4444"
          />
          <text
            x={svgWidth - paddingRight - 52}
            y={safeLimitY + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-mono text-[9px] font-bold fill-[#ffffff] uppercase"
          >
            BATAS AMAN: {maxSafeLimit}°
          </text>

          {/* Shaded Area under Curve */}
          {areaPath && <path d={areaPath} fill="url(#romGradient)" />}

          {/* Trend Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#000000"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points & Value Labels */}
          {points.map((pt) => {
            const isSafe = pt.rep.isSafeRoM;
            const isHovered = hoveredRep?.repIndex === pt.rep.repIndex;

            return (
              <g
                key={pt.rep.repIndex}
                className="cursor-pointer transition-transform duration-150"
                onMouseEnter={() => setHoveredRep(pt.rep)}
                onMouseLeave={() => setHoveredRep(null)}
              >
                {/* Outer halo circle for hovered point */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="12"
                    fill={isSafe ? 'rgba(209, 255, 202, 0.6)' : 'rgba(239, 68, 68, 0.4)'}
                  />
                )}

                {/* Main Data Point Node */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? '7' : '5.5'}
                  fill={isSafe ? '#d1ffca' : '#EF4444'}
                  stroke="#000000"
                  strokeWidth="2"
                />

                {/* Point Angle Label Pill */}
                <rect
                  x={pt.x - 16}
                  y={pt.y - 25}
                  width="32"
                  height="16"
                  rx="4"
                  fill="#000000"
                />
                <text
                  x={pt.x}
                  y={pt.y - 14}
                  textAnchor="middle"
                  className="font-mono text-[9px] font-bold fill-[#ffffff]"
                >
                  {pt.rep.maxFlexionAngle}°
                </text>

                {/* X-Axis Rep Label */}
                <text
                  x={pt.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className="font-mono text-[10px] font-bold fill-[#444444]"
                >
                  #{pt.rep.repIndex}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover Information Callout */}
      {hoveredRep ? (
        <div className="bg-[#f3f3f3] border border-[#000000] rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-[#000000]">
            REPETISI #{hoveredRep.repIndex}: FLEKSI {hoveredRep.maxFlexionAngle}°
          </span>
          <span
            className={`font-bold px-2 py-0.5 rounded-full ${
              hoveredRep.isSafeRoM ? 'bg-[#d1ffca] text-[#000000]' : 'bg-[#EF4444] text-[#ffffff]'
            }`}
          >
            {hoveredRep.isSafeRoM ? 'AMAN' : 'MELEBIHI AMBANG'}
          </span>
        </div>
      ) : (
        <div className="text-[11px] font-mono text-[#979797] text-center">
          Arahkan kursor atau ketuk titik pada grafik untuk melihat rincian repetisi.
        </div>
      )}
    </div>
  );
}
