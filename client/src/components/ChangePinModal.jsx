import React, { useState } from 'react';
import { Key, Lock, Check } from 'lucide-react';
import { updateStudentPin } from '../api.js';

export default function ChangePinModal({ student, onClose, onSuccess, showToast }) {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPin.trim()) {
      showToast('새 비밀번호를 입력해주세요.', 'error');
      return;
    }
    if (newPin.trim().length < 2) {
      showToast('비밀번호는 최소 2자리 이상이어야 합니다.', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      showToast('새 비밀번호와 확인 입력이 일치하지 않습니다.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await updateStudentPin(student.id, newPin.trim());
      if (res.success) {
        showToast('비밀번호가 성공적으로 변경되었습니다!', 'success');
        if (onSuccess) onSuccess(res.student);
        onClose();
      } else {
        showToast(res.message || '비밀번호 변경 실패', 'error');
      }
    } catch (err) {
      showToast('비밀번호 변경 처리 오류', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <Key size={24} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800 }}>내 비밀번호 변경</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {student?.studentNo}번 {student?.name} 학생의 새 비밀번호를 설정합니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
              새 비밀번호 (PIN)
            </label>
            <input
              type="password"
              placeholder="예: 4자리 숫자"
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
              maxLength={20}
              style={{ width: '100%', fontSize: 15 }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
              새 비밀번호 확인
            </label>
            <input
              type="password"
              placeholder="비밀번호 재입력"
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value)}
              maxLength={20}
              style={{ width: '100%', fontSize: 15 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              <Check size={16} /> 변경 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
