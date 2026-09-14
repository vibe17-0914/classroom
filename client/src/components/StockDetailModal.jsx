import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Clock, BarChart2, DollarSign } from 'lucide-react';
import StockChart from './StockChart.jsx';
import { fetchStockChart } from '../api.js';

export default function StockDetailModal({ stock, onClose, onOpenTrade, studentHolding = 0 }) {
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    if (!stock) return;
    setLoadingChart(true);
    fetchStockChart(stock.code)
      .then(data => {
        setChartData(data);
      })
      .catch(err => {
        console.error('Failed to load chart:', err);
      })
      .finally(() => setLoadingChart(false));
  }, [stock?.code]);

  if (!stock) return null;

  const isRise = stock.changeDirection === 'RISE' || stock.changeRate > 0;
  const isFall = stock.changeDirection === 'FALL' || stock.changeRate < 0;
  const colorClass = isRise ? 'text-rise' : (isFall ? 'text-fall' : 'text-even');
  const badgeClass = isRise ? 'badge-rise' : (isFall ? 'badge-fall' : 'badge-even');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        {/* 상단 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{stock.name}</h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {stock.code}
              </span>
              {stock.isKospiTop20 && (
                <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                  KOSPI #{stock.rank || 'TOP'}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {stock.description || '한국거래소(KRX) 유가증권시장 실시간 시세 반영'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 6, borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {/* 현재가 및 등락률 카드 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 20
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>현재 실제 주가</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {stock.price.toLocaleString()}<span style={{ fontSize: 16, fontWeight: 500 }}>원</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={`badge ${badgeClass}`} style={{ fontSize: 14, padding: '5px 12px', marginBottom: 4 }}>
              {isRise ? <TrendingUp size={16} /> : (isFall ? <TrendingDown size={16} /> : null)}
              {isRise ? '+' : ''}{stock.changeRate}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              전일대비 {isRise ? '+' : ''}{stock.change?.toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 차트 영역 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart2 size={16} color="var(--primary)" /> 최근 30일 주가 추이
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              실제 네이버 금융 데이터
            </div>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.25)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            {loadingChart ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                차트를 불러오는 중입니다...
              </div>
            ) : (
              <StockChart data={chartData} changeDirection={stock.changeDirection} />
            )}
          </div>
        </div>

        {/* 부가 지표 (시가총액, 거래량 등) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 24,
          fontSize: 13
        }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>시가총액</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{stock.marketCap || '-'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>누적 거래량</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{stock.accumulatedTradingVolume ? `${stock.accumulatedTradingVolume.toLocaleString()}주` : '-'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>내 보유 수량</div>
            <div style={{ fontWeight: 600, marginTop: 2, color: studentHolding > 0 ? '#38bdf8' : 'inherit' }}>
              {studentHolding}주
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            className="btn btn-rise"
            style={{ padding: '14px', fontSize: 16 }}
            onClick={() => {
              onClose();
              onOpenTrade(stock, 'BUY');
            }}
          >
            매수하기 (사기)
          </button>
          <button
            className="btn btn-fall"
            style={{ padding: '14px', fontSize: 16 }}
            onClick={() => {
              onClose();
              onOpenTrade(stock, 'SELL');
            }}
            disabled={studentHolding <= 0}
            title={studentHolding <= 0 ? '보유한 주식이 없습니다' : ''}
          >
            매도하기 (팔기) {studentHolding > 0 && `(${studentHolding}주)`}
          </button>
        </div>
      </div>
    </div>
  );
}
