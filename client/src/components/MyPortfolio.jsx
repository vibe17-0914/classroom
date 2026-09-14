import React from 'react';
import { Wallet, PieChart, TrendingUp, TrendingDown, ArrowUpRight, DollarSign, ShoppingBag } from 'lucide-react';

export default function MyPortfolio({
  student,
  stocks = [],
  onQuickTrade,
  onNavigateToStocks
}) {
  if (!student) return null;

  const enrichedPortfolio = student.enrichedPortfolio || [];
  const cash = student.cash || 0;
  const seedMoney = student.seedMoney || 1000000;
  const totalAsset = student.totalAsset || cash;
  const stockValuation = student.stockValuation || 0;
  const profit = totalAsset - seedMoney;
  const profitRate = seedMoney > 0 ? ((profit / seedMoney) * 100) : 0;

  const isProfit = profit > 0;
  const isLoss = profit < 0;

  return (
    <div>
      {/* 4대 핵심 자산 카드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* 총 평가 자산 */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
            <span>총 평가 자산</span>
            <Wallet size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {totalAsset.toLocaleString()}<span style={{ fontSize: 15, fontWeight: 600 }}>원</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            원금(시드머니): {seedMoney.toLocaleString()}원
          </div>
        </div>

        {/* 총 평가 손익 / 수익률 */}
        <div className="card" style={{ borderLeft: `4px solid ${isProfit ? 'var(--rise)' : (isLoss ? 'var(--fall)' : 'var(--even)')}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
            <span>총 평가 손익</span>
            {isProfit ? <TrendingUp size={18} color="var(--rise)" /> : <TrendingDown size={18} color="var(--fall)" />}
          </div>
          <div style={{
            fontSize: 26,
            fontWeight: 800,
            color: isProfit ? 'var(--rise)' : (isLoss ? 'var(--fall)' : 'inherit')
          }}>
            {isProfit ? '+' : ''}{profit.toLocaleString()}<span style={{ fontSize: 15, fontWeight: 600 }}>원</span>
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: isProfit ? 'var(--rise)' : (isLoss ? 'var(--fall)' : 'var(--text-muted)'),
            marginTop: 6
          }}>
            수익률: {isProfit ? '+' : ''}{profitRate.toFixed(2)}%
          </div>
        </div>

        {/* 보유 현금 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
            <span>주문 가능 현금 (예수금)</span>
            <DollarSign size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {cash.toLocaleString()}<span style={{ fontSize: 15, fontWeight: 600 }}>원</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            자산 대비 현금 비중: {totalAsset > 0 ? ((cash / totalAsset) * 100).toFixed(1) : 0}%
          </div>
        </div>

        {/* 주식 평가금액 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
            <span>보유 주식 총 평가액</span>
            <PieChart size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {stockValuation.toLocaleString()}<span style={{ fontSize: 15, fontWeight: 600 }}>원</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            보유 종목 수: {enrichedPortfolio.length}개
          </div>
        </div>
      </div>

      {/* 보유 주식 목록 */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>보유 종목 현황</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              실시간 실제 주가를 기준으로 계산된 현재 투자 포트폴리오입니다.
            </p>
          </div>
          {enrichedPortfolio.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={onNavigateToStocks}>
              <ShoppingBag size={14} /> 종목 더 둘러보기
            </button>
          )}
        </div>

        {enrichedPortfolio.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(255,255,255,0.01)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💼</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>아직 보유한 주식이 없습니다</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 20px auto' }}>
              시세표에서 원하는 KOSPI 대표 우량주를 분석하고 모의 매수 주문을 넣어보세요!
            </p>
            <button className="btn btn-primary" onClick={onNavigateToStocks}>
              종목 시세표 바로가기
            </button>
          </div>
        ) : (
          <div className="stock-table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>종목명 / 코드</th>
                  <th style={{ textAlign: 'right' }}>보유 수량</th>
                  <th style={{ textAlign: 'right' }}>평균 매수가</th>
                  <th style={{ textAlign: 'right' }}>현재 주가</th>
                  <th style={{ textAlign: 'right' }}>총 평가금액</th>
                  <th style={{ textAlign: 'right' }}>평가 손익</th>
                  <th style={{ textAlign: 'right' }}>수익률</th>
                  <th style={{ textAlign: 'center', width: 140 }}>주문</th>
                </tr>
              </thead>
              <tbody>
                {enrichedPortfolio.map(item => {
                  const itemProfit = item.profit || 0;
                  const itemProfitRate = item.profitRate || 0;
                  const isItemProfit = itemProfit > 0;
                  const isItemLoss = itemProfit < 0;
                  const colorClass = isItemProfit ? 'text-rise' : (isItemLoss ? 'text-fall' : 'text-even');
                  const badgeClass = isItemProfit ? 'badge-rise' : (isItemLoss ? 'badge-fall' : 'badge-even');

                  // 매수 주문용 stock 객체 매칭
                  const stockObj = stocks.find(s => s.code === item.code) || {
                    code: item.code,
                    name: item.name,
                    price: item.currentPrice
                  };

                  return (
                    <tr key={item.code}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {item.code}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                        {item.count.toLocaleString()}주
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {item.avgPrice.toLocaleString()}원
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                        {item.currentPrice.toLocaleString()}원
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                        {item.currentValue.toLocaleString()}원
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }} className={colorClass}>
                        {isItemProfit ? '+' : ''}{itemProfit.toLocaleString()}원
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge ${badgeClass}`}>
                          {isItemProfit ? '+' : ''}{itemProfitRate}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="btn btn-rise btn-sm"
                            onClick={() => onQuickTrade(stockObj, 'BUY')}
                          >
                            추가매수
                          </button>
                          <button
                            className="btn btn-fall btn-sm"
                            onClick={() => onQuickTrade(stockObj, 'SELL')}
                          >
                            매도
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
