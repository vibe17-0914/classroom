import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, RefreshCw, BarChart2, PlusCircle, ArrowUpDown } from 'lucide-react';

export default function StockList({
  stocks = [],
  loading = false,
  onRefresh,
  onSelectStock,
  onQuickTrade,
  student
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, TOP20, CUSTOM, RISE, FALL
  const [sortBy, setSortBy] = useState('DEFAULT'); // DEFAULT, RATE_DESC, RATE_ASC, PRICE_DESC

  const filtered = stocks.filter(stock => {
    if (stock.disabled) return false;

    // 검색어 필터
    const matchesSearch =
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.code.includes(searchTerm);

    if (!matchesSearch) return false;

    if (filterType === 'TOP20') return stock.isKospiTop20;
    if (filterType === 'CUSTOM') return stock.isCustom;
    if (filterType === 'RISE') return stock.changeRate > 0;
    if (filterType === 'FALL') return stock.changeRate < 0;

    return true;
  });

  // 정렬
  filtered.sort((a, b) => {
    if (sortBy === 'RATE_DESC') return b.changeRate - a.changeRate;
    if (sortBy === 'RATE_ASC') return a.changeRate - b.changeRate;
    if (sortBy === 'PRICE_DESC') return b.price - a.price;
    // 기본: KOSPI 랭킹 또는 등록순
    return (a.rank || 999) - (b.rank || 999);
  });

  return (
    <div className="card" style={{ padding: '24px' }}>
      {/* 헤더 & 컨트롤 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>실시간 KOSPI 종목 시세</h2>
            <span className="live-indicator">
              <span className="live-dot" />
              실시간 연동
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            네이버 금융 실제 주가가 반영되는 KOSPI 대표 종목 및 수업용 추가 종목 목록입니다.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
            title="실시간 주가 새로고침"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
        </div>
      </div>

      {/* 검색 및 필터 바 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16
      }}>
        {/* 검색 입력 */}
        <div style={{ position: 'relative', minWidth: 260 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="종목명 또는 종목코드 6자리 검색"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: 36, height: 38 }}
          />
        </div>

        {/* 필터 탭 */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: '전체' },
            { id: 'TOP20', label: 'KOSPI 상위 20' },
            { id: 'CUSTOM', label: '학급 추가 종목' },
            { id: 'RISE', label: '상승 📈' },
            { id: 'FALL', label: '하락 📉' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn btn-sm ${filterType === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 정렬 셀렉트 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowUpDown size={14} color="var(--text-muted)" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ height: 38, fontSize: 13 }}
          >
            <option value="DEFAULT">시가총액 순위순</option>
            <option value="RATE_DESC">등락률 높은순 (급등)</option>
            <option value="RATE_ASC">등락률 낮은순 (급락)</option>
            <option value="PRICE_DESC">주가 높은순</option>
          </select>
        </div>
      </div>

      {/* 종목 테이블 */}
      <div className="stock-table-container">
        <table className="stock-table">
          <thead>
            <tr>
              <th style={{ width: 60, textAlign: 'center' }}>순위</th>
              <th>종목명 / 코드</th>
              <th style={{ textAlign: 'right' }}>현재가</th>
              <th style={{ textAlign: 'right' }}>전일대비</th>
              <th style={{ textAlign: 'right' }}>등락률</th>
              <th style={{ textAlign: 'right' }}>시가총액</th>
              <th style={{ textAlign: 'center' }}>내 보유</th>
              <th style={{ textAlign: 'center', width: 150 }}>모의 주문</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  일치하는 종목이 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((stock, idx) => {
                const isRise = stock.changeDirection === 'RISE' || stock.changeRate > 0;
                const isFall = stock.changeDirection === 'FALL' || stock.changeRate < 0;
                const badgeClass = isRise ? 'badge-rise' : (isFall ? 'badge-fall' : 'badge-even');
                const colorClass = isRise ? 'text-rise' : (isFall ? 'text-fall' : 'text-even');
                const holding = student?.portfolio?.[stock.code]?.count || 0;

                return (
                  <tr key={stock.code} onClick={() => onSelectStock(stock)}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {stock.isKospiTop20 ? stock.rank || (idx + 1) : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {stock.name}
                            {stock.isCustom && (
                              <span className="badge" style={{ fontSize: 10, background: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>
                                추천
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {stock.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 15 }}>
                      {stock.price.toLocaleString()}원
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 13 }} className={colorClass}>
                      {isRise ? '+' : ''}{stock.change ? stock.change.toLocaleString() : 0}원
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${badgeClass}`}>
                        {isRise ? '+' : ''}{stock.changeRate}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {stock.marketCap || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {holding > 0 ? (
                        <span style={{
                          fontWeight: 700,
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.12)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 12
                        }}>
                          {holding}주
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-rise btn-sm"
                          onClick={() => onQuickTrade(stock, 'BUY')}
                        >
                          매수
                        </button>
                        <button
                          className="btn btn-fall btn-sm"
                          onClick={() => onQuickTrade(stock, 'SELL')}
                          disabled={holding <= 0}
                          style={{ opacity: holding <= 0 ? 0.4 : 1 }}
                        >
                          매도
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
