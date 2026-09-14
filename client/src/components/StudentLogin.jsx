import React, { useState } from 'react';
import { UserCheck, Lock, ArrowRight, ShieldAlert, Sparkles, Key } from 'lucide-react';
import { loginStudent } from '../api.js';

export default function StudentLogin({ students = [], onLoginSuccess, showToast }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      showToast('학생을 선택해주세요.', 'error');
      return;
    }
    if (!pinInput.trim()) {
      showToast('비밀번호(PIN)를 입력해주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await loginStudent(selectedStudentId, pinInput.trim());
      if (res.success && res.student) {
        onLoginSuccess(res.student);
      } else {
        showToast(res.message || '로그인에 실패했습니다.', 'error');
      }
    } catch (err) {
      showToast('로그인 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 460,
      margin: '40px auto',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div className="card" style={{
        padding: '32px 28px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))'
      }}>
        {/* 아이콘 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.2))',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#c084fc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            boxShadow: '0 8px 20px rgba(168, 85, 247, 0.2)'
          }}>
            <UserCheck size={30} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            학생 계좌 로그인
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
            본인의 출석번호와 비밀번호를 입력하여<br />
            나만의 모의 주식 계좌에 접속하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 학생 선택 */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
              출석번호 및 이름 선택
            </label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              style={{
                width: '100%',
                height: 46,
                fontSize: 15,
                fontWeight: 600,
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0 12px',
                color: '#f8fafc'
              }}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.studentNo}번 {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 비밀번호(PIN) 입력 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>
                비밀번호 (PIN)
              </label>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                초기 비밀번호: 1234
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="비밀번호 입력 (기본: 1234)"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                maxLength={20}
                style={{
                  width: '100%',
                  height: 46,
                  fontSize: 16,
                  letterSpacing: '2px',
                  paddingLeft: 38
                }}
                autoFocus
              />
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 15 }} />
            </div>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              height: 48,
              fontSize: 16,
              fontWeight: 800,
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)'
            }}
          >
            {loading ? '로그인 확인 중...' : <>내 계좌로 시작하기 <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* 하단 안내 카드 */}
        <div style={{
          marginTop: 22,
          padding: '12px 14px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed var(--border-subtle)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#facc15', fontWeight: 700, marginBottom: 2 }}>
            <Key size={13} /> 비밀번호를 잊어버리셨나요?
          </div>
          <div>
            초기 비밀번호는 <strong style={{ color: '#f8fafc' }}>1234</strong> 입니다. 비밀번호를 변경한 후 잊어버린 경우, 선생님께 비밀번호 초기화를 요청하세요.
          </div>
        </div>
      </div>
    </div>
  );
}
