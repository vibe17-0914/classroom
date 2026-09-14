import React, { useState } from 'react';

export default function StockChart({ data = [], changeDirection = 'EVEN' }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        차트 데이터를 불러오는 중이거나 제공되지 않는 종목입니다.
      </div>
    );
  }

  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 좌표 계산
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.close - minPrice) / range) * chartHeight;
    return { x, y, data: d };
  });

  const pathString = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaString = `${pathString} L ${points[points.length - 1].x},${height - padding.bottom} L ${points[0].x},${height - padding.bottom} Z`;

  const isRise = changeDirection === 'RISE' || (data.length > 1 && data[data.length - 1].close >= data[0].close);
  const strokeColor = isRise ? '#f43f5e' : '#38bdf8';
  const gradientId = `chart-grad-${isRise ? 'rise' : 'fall'}`;

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : points[points.length - 1];

  return (
    <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
      {/* 툴팁 정보창 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        fontSize: 13,
        marginBottom: 8
      }}>
        <div style={{ color: 'var(--text-secondary)' }}>
          날짜: <strong style={{ color: 'var(--text-primary)' }}>{activePoint?.data?.fullDate || activePoint?.data?.date}</strong>
        </div>
        <div>
          종가: <strong style={{ color: strokeColor }}>{activePoint?.data?.close?.toLocaleString()}원</strong>
          {activePoint?.data?.volume ? (
            <span style={{ marginLeft: 12, color: 'var(--text-muted)' }}>
              거래량: {activePoint?.data?.volume?.toLocaleString()}주
            </span>
          ) : null}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* 배경 기준선 (Grid) */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartHeight * ratio;
          const priceAtY = Math.round(maxPrice - ratio * range);
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(255, 255, 255, 0.07)"
                strokeDasharray="3 3"
              />
              <text
                x={width - padding.right + 6}
                y={y + 4}
                fill="#64748b"
                fontSize="10"
                textAnchor="start"
              >
                {priceAtY.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* 영역 채우기 */}
        <path d={areaString} fill={`url(#${gradientId})`} />

        {/* 메인 추세선 */}
        <path
          d={pathString}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 호버 감지 구역 & 수직선 */}
        {points.map((pt, i) => (
          <g key={i}>
            <rect
              x={pt.x - chartWidth / (data.length * 2)}
              y={padding.top}
              width={chartWidth / data.length}
              height={chartHeight}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHoverIndex(i)}
            />
            {hoverIndex === i && (
              <line
                x1={pt.x}
                y1={padding.top}
                x2={pt.x}
                y2={height - padding.bottom}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeDasharray="2 2"
              />
            )}
          </g>
        ))}

        {/* 활성 포인트 점 */}
        {activePoint && (
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r="5"
            fill={strokeColor}
            stroke="#ffffff"
            strokeWidth="2"
          />
        )}

        {/* X축 레이블 (첫날, 중간날, 마지막날) */}
        {data.length > 0 && (
          <>
            <text x={padding.left} y={height - 8} fill="#64748b" fontSize="10" textAnchor="start">
              {data[0]?.date}
            </text>
            <text x={width / 2} y={height - 8} fill="#64748b" fontSize="10" textAnchor="middle">
              {data[Math.floor(data.length / 2)]?.date}
            </text>
            <text x={width - padding.right} y={height - 8} fill="#64748b" fontSize="10" textAnchor="end">
              {data[data.length - 1]?.date}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
