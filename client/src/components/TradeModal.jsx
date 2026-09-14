import React, { useState, useEffect } from 'react';
import { X, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { executeTrade } from '../api.js';

export default function TradeModal({
  stock,
  initialType = 'BUY',
  student,
  onClose,
  onTradeSuccess,
  showToast
}) {
  const [tradeType, setTradeType] = useState(initialType);
  const [count, setCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  if (!stock || !student) return null;

  const price = stock.price || 0;
  const holding = student.portfolio?.[stock.code]?.count || 0;
  const cash = student.cash || 0;

  // 최대 매수/매도 가능 수량
  const maxBuyCount = price > 0 ? Math.floor(cash / price) : 0;
  const maxSellCount = holding;
  const maxCount = tradeType === 'BUY' ? maxBuyCount : maxSellCount;

  const totalAmount = count * price;
  const remainingCash = tradeType === 'BUY' ? (cash - totalAmount) : (cash + totalAmount);
  const remainingHolding = tradeType === 'BUY' ? (holding + count) : (holding - count);

  const canSubmit = count > 0 && (
    tradeType === 'BUY' ? totalAmount <= cash : count <= holding
  );

  const handlePercentage = (percent) => {
    if (maxCount <= 0) return;
    const calculated = Math.floor(maxCount * (percent / 100));
    setCount(Math.max(1, calculated));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await executeTrade({
        studentId: student.id,
        type: tradeType,
        stockCode: stock.code,
        stockName: stock.name,
        count: count,
        price: price
      });

      if (res.success) {
        showToast(
          `${stock.name} ${count}주 ${tradeType === 'BUY' ? '매수' : '매도'}가 체결되었습니다!`,
          'success'
        );
        onTradeSuccess(res.student);
        onClose();
      } else {
        showToast(res.message || '주문 체결에 실패했습니다.', 'error');
      }
    } catch (err) {
      showToast('주문 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* 상단 닫기 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800 }}>{stock.name}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stock.code}</span>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 6, borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {/* 매수 / 매도 탭 전환 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
          background: 'rgba(0,0,0,0.3)',
          padding: 4,
          borderRadius: 'var(--radius-sm)',
          marginBottom: 20
        }}>
          <button
            onClick={() => { setTradeType('BUY'); setCount(1); }}
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: 15,
              background: tradeType === 'BUY' ? 'var(--rise)' : 'transparent',
              color: tradeType === 'BUY' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            매수 (사기)
          </button>
          <button
            onClick={() => { setTradeType('SELL'); setCount(Math.min(1, holding)); }}
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: 15,
              background: tradeType === 'SELL' ? 'var(--fall)' : 'transparent',
              color: tradeType === 'SELL' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            매도 (팔기)
          </button>
        </div>

        {/* 현재가 및 계좌 현황 */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          padding: '14px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 20,
          fontSize: 13
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>주문 기준 현재가</span>
            <span style={{ fontWeight: 700 }}>{price.toLocaleString()}원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {tradeType === 'BUY' ? '주문 가능 현금' : '보유 주식 수량'}
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {tradeType === 'BUY' ? `${cash.toLocaleString()}원` : `${holding}주`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>최대 가능 수량</span>
            <span style={{ fontWeight: 700, color: maxCount > 0 ? '#10b981' : 'var(--rise)' }}>
              {maxCount}주
            </span>
          </div>
        </div>

        {/* 수량 입력 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
            주문 수량 (주)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-secondary"
              style={{ width: 44, height: 44, fontSize: 18, padding: 0 }}
              onClick={() => setCount(prev => Math.max(1, prev - 1))}
              disabled={count <= 1}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={maxCount || 1}
              value={count}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                setCount(isNaN(val) ? 0 : val);
              }}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 18,
                fontWeight: 700,
                height: 44
              }}
            />
            <button
              className="btn btn-secondary"
              style={{ width: 44, height: 44, fontSize: 18, padding: 0 }}
              onClick={() => setCount(prev => (maxCount > prev ? prev + 1 : prev))}
              disabled={maxCount <= count}
            >
              +
            </button>
          </div>

          {/* 퍼센트 퀵 버튼 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
            {[10, 25, 50, 100].map(pct => (
              <button
                key={pct}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handlePercentage(pct)}
                disabled={maxCount <= 0}
                style={{ fontSize: 12, padding: '6px 0' }}
              >
                {pct === 100 ? '최대' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* 주문 요약 및 결제 금액 */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 16,
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>총 주문 금액</span>
            <span style={{
              fontSize: 22,
              fontWeight: 800,
              color: tradeType === 'BUY' ? 'var(--rise)' : 'var(--fall)'
            }}>
              {totalAmount.toLocaleString()}원
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>
              {tradeType === 'BUY' ? '체결 후 잔여 현금' : '체결 후 보유 수량'}
            </span>
            <span>
              {tradeType === 'BUY'
                ? `${Math.max(0, remainingCash).toLocaleString()}원`
                : `${Math.max(0, remainingHolding)}주`}
            </span>
          </div>

          {/* 에러 피드백 */}
          {!canSubmit && maxCount === 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--rise)',
              fontSize: 12,
              marginTop: 12,
              background: 'var(--rise-bg)',
              padding: '8px 12px',
              borderRadius: 6
            }}>
              <AlertCircle size={14} />
              {tradeType === 'BUY'
                ? '보유 현금이 부족하여 매수할 수 없습니다.'
                : '보유한 주식이 없어 매도할 수 없습니다.'}
            </div>
          )}
        </div>

        {/* 최종 주문 버튼 */}
        <button
          className={`btn ${tradeType === 'BUY' ? 'btn-rise' : 'btn-fall'}`}
          style={{ width: '100%', padding: '14px', fontSize: 16 }}
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting
            ? '주문 체결 중...'
            : `${count}주 ${tradeType === 'BUY' ? '매수하기' : '매도하기'}`}
        </button>
      </div>
    </div>
  );
}
