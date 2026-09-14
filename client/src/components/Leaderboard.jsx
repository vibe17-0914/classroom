import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { fetchLeaderboard } from '../api.js';

export default function Leaderboard({ currentStudentId }) {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRanking = async () => {
    setLoading(true);
    try {
      const list = await fetchLeaderboard();
      setRanking(list);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking();
  }, []);

  const top3 = ranking.slice(0, 3);

  return (
    <div>
      {/* 상단 타이틀 */}
      <div className="card" style={{ marginBottom: 24, padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trophy size={24} color="#fbbf24" />
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>우리 반 투자 랭킹 리더보드</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              실제 KOSPI 주가에 기반한 우리 반 친구들의 실시간 수익률 순위입니다.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadRanking}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
        </div>

        {/* TOP 3 포디움 */}
        {top3.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginTop: 24
          }}>
            {top3.map((item, idx) => {
              const medals = ['🥇 1위', '🥈 2위', '🥉 3위'];
              const borderColors = ['#fbbf24', '#cbd5e1', '#d97706'];
              const isProfit = item.profitRate > 0;
              const isLoss = item.profitRate < 0;
              const isMe = item.id === currentStudentId;

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `2px solid ${borderColors[idx] || 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    textAlign: 'center',
                    position: 'relative',
                    boxShadow: idx === 0 ? '0 0 30px rgba(251, 191, 36, 0.15)' : 'none'
                  }}
                >
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(0,0,0,0.4)',
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 10
                  }}>
                    {medals[idx]}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                    {item.studentNo}번 {item.name}
                    {isMe && <span className="badge badge-admin" style={{ marginLeft: 6, fontSize: 11 }}>나</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    총 자산: {item.totalAsset.toLocaleString()}원
                  </div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: isProfit ? 'var(--rise)' : (isLoss ? 'var(--fall)' : 'inherit')
                  }}>
                    {isProfit ? '+' : ''}{item.profitRate}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 전체 순위 테이블 */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>학급 전체 순위표</h3>
        <div className="stock-table-container">
          <table className="stock-table">
            <thead>
              <tr>
                <th style={{ width: 70, textAlign: 'center' }}>순위</th>
                <th style={{ width: 80, textAlign: 'center' }}>출석번호</th>
                <th>이름</th>
                <th style={{ textAlign: 'right' }}>총 평가자산</th>
                <th style={{ textAlign: 'right' }}>보유 현금</th>
                <th style={{ textAlign: 'right' }}>주식 평가액</th>
                <th style={{ textAlign: 'right' }}>평가손익</th>
                <th style={{ textAlign: 'right' }}>수익률</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(student => {
                const isProfit = student.profitRate > 0;
                const isLoss = student.profitRate < 0;
                const colorClass = isProfit ? 'text-rise' : (isLoss ? 'text-fall' : 'text-even');
                const badgeClass = isProfit ? 'badge-rise' : (isLoss ? 'badge-fall' : 'badge-even');
                const isMe = student.id === currentStudentId;

                return (
                  <tr
                    key={student.id}
                    style={{
                      background: isMe ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                      fontWeight: isMe ? 700 : 400
                    }}
                  >
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {student.rank === 1 ? '🥇' : (student.rank === 2 ? '🥈' : (student.rank === 3 ? '🥉' : student.rank))}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      {student.studentNo}번
                    </td>
                    <td>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{student.name}</span>
                      {isMe && (
                        <span className="badge badge-admin" style={{ marginLeft: 6, fontSize: 11 }}>
                          나
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                      {student.totalAsset.toLocaleString()}원
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {student.cash.toLocaleString()}원
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {student.stockValuation.toLocaleString()}원
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }} className={colorClass}>
                      {isProfit ? '+' : ''}{student.profit.toLocaleString()}원
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${badgeClass}`}>
                        {isProfit ? '+' : ''}{student.profitRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
