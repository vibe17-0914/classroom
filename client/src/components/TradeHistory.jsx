import React from 'react';
import { History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function TradeHistory({ student }) {
  if (!student) return null;

  const history = student.tradeHistory || [];

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <History size={20} color="var(--primary)" />
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>
          {student.name} 학생의 매매 체결 일지
        </h2>
      </div>

      {history.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-muted)',
          fontSize: 14
        }}>
          아직 체결된 매수/매도 거래 내역이 없습니다.
        </div>
      ) : (
        <div className="stock-table-container">
          <table className="stock-table">
            <thead>
              <tr>
                <th>체결 일시</th>
                <th>구분</th>
                <th>종목명 / 코드</th>
                <th style={{ textAlign: 'right' }}>체결 단가</th>
                <th style={{ textAlign: 'right' }}>체결 수량</th>
                <th style={{ textAlign: 'right' }}>총 체결 금액</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => {
                const isBuy = item.type === 'BUY';
                const date = new Date(item.timestamp);
                const timeStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

                return (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {timeStr}
                    </td>
                    <td>
                      <span className={`badge ${isBuy ? 'badge-rise' : 'badge-fall'}`}>
                        {isBuy ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {isBuy ? '매수 체결' : '매도 체결'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{item.stockName}</span>
                      <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                        {item.stockCode}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {item.price.toLocaleString()}원
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {item.count.toLocaleString()}주
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 14 }}>
                      {item.total.toLocaleString()}원
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
