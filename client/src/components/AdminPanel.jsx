import React, { useState } from 'react';
import {
  Layers, Users, Settings, Plus, Search, Trash2, Edit3,
  RotateCcw, CheckCircle2, AlertTriangle, ShieldCheck, Power,
  DollarSign, TrendingUp, TrendingDown, Sparkles, Dices, Clock,
  Key, Lock
} from 'lucide-react';
import {
  addStock, updateStock, deleteStock, restoreDefaultStocks, searchStock, updateStockPrice,
  triggerFluctuation, addStudent, batchAddStudents, updateStudent, deleteStudent, resetStudents,
  updateAdminSettings, resetStudentPin, resetAllStudentPins, updateStudentPin
} from '../api.js';

export default function AdminPanel({
  stocks = [],
  students = [],
  adminSettings = {},
  onStudentsUpdated,
  onDataChanged,
  showToast,
  onExitAdmin
}) {
  const [activeTab, setActiveTab] = useState('STOCKS'); // STOCKS, STUDENTS, SETTINGS

  // 종목 추가 폼 상태
  const [stockForm, setStockForm] = useState({
    code: '',
    name: '',
    description: '',
    isManualPrice: false,
    manualPrice: 10000,
    autoFluctuate: false,
    fluctuateInterval: 3,
    fluctuateRange: 5
  });
  const [searchingCode, setSearchingCode] = useState(false);
  const [previewStock, setPreviewStock] = useState(null);

  // 학생 추가 폼 상태
  const [newStudent, setNewStudent] = useState({
    studentNo: '',
    name: '',
    pin: '1234',
    seedMoney: adminSettings.defaultSeedMoney || 1000000
  });
  const [batchText, setBatchText] = useState('');
  const [batchSeed, setBatchSeed] = useState(adminSettings.defaultSeedMoney || 1000000);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // 학생 수정 폼 상태
  const [editingStudent, setEditingStudent] = useState(null);

  // 종목 주가 변동 모달 상태
  const [priceModal, setPriceModal] = useState(null); // { stock, newPrice, reason, autoFluctuate, fluctuateInterval, fluctuateRange }

  // 전역 자동 가격 변동 상태 간이 제어
  const [globalAuto, setGlobalAuto] = useState(!!adminSettings.autoFluctuateCustom);
  const [globalInterval, setGlobalInterval] = useState(adminSettings.fluctuationIntervalMinutes || 3);
  const [globalRange, setGlobalRange] = useState(adminSettings.fluctuationRangePercent || 5);

  const handleOpenPriceModal = (stock) => {
    setPriceModal({
      stock,
      newPrice: stock.price,
      reason: stock.lastReason || '',
      autoFluctuate: stock.autoFluctuate !== undefined ? !!stock.autoFluctuate : true,
      fluctuateInterval: stock.fluctuateInterval || adminSettings.fluctuationIntervalMinutes || 3,
      fluctuateRange: stock.fluctuateRange || adminSettings.fluctuationRangePercent || 5
    });
  };

  const handleApplyPricePercent = (percent) => {
    if (!priceModal?.stock) return;
    const base = priceModal.stock.price || 10000;
    const calculated = Math.round(base * (1 + percent / 100));
    setPriceModal(prev => ({
      ...prev,
      newPrice: Math.max(100, calculated)
    }));
  };

  const handleSavePriceChange = async (e) => {
    e.preventDefault();
    if (!priceModal?.stock) return;
    if (priceModal.newPrice <= 0) {
      showToast('주가는 0원보다 커야 합니다.', 'error');
      return;
    }

    try {
      const res = await updateStockPrice(
        priceModal.stock.code,
        priceModal.newPrice,
        priceModal.reason,
        {
          autoFluctuate: priceModal.autoFluctuate,
          fluctuateInterval: Number(priceModal.fluctuateInterval) || 3,
          fluctuateRange: Number(priceModal.fluctuateRange) || 5
        }
      );
      if (res.success) {
        showToast(res.message, 'success');
        setPriceModal(null);
        onDataChanged();
      } else {
        showToast(res.message || '가격 변경에 실패했습니다.', 'error');
      }
    } catch (err) {
      showToast('가격 변경 처리 오류', 'error');
    }
  };

  // 종목 검색 미리보기
  const handleSearchCode = async () => {
    if (!stockForm.code.trim()) {
      showToast('종목코드를 입력해주세요.', 'error');
      return;
    }
    setSearchingCode(true);
    setPreviewStock(null);
    try {
      const res = await searchStock(stockForm.code.trim());
      if (res.success && res.stock) {
        setPreviewStock(res.stock);
        setStockForm(prev => ({
          ...prev,
          name: res.stock.name,
          description: prev.description || `${res.stock.name} (${res.stock.code})`
        }));
        showToast(`'${res.stock.name}' 정보를 찾았습니다!`, 'success');
      } else {
        showToast('네이버 금융에서 종목을 찾지 못했습니다. 커스텀 종목으로 직접 등록할 수 있습니다.', 'info');
      }
    } catch (err) {
      showToast('종목 조회 중 오류가 발생했습니다.', 'error');
    } finally {
      setSearchingCode(false);
    }
  };

  // 즉시 랜덤 가격 변동 트리거
  const handleTriggerFluctuation = async (code = null) => {
    try {
      const res = await triggerFluctuation(code, true);
      if (res.success) {
        showToast(res.message, 'success');
        onDataChanged();
      } else {
        showToast(res.message || '랜덤 변동 실패', 'error');
      }
    } catch (err) {
      showToast('랜덤 변동 처리 오류', 'error');
    }
  };

  // 종목 추가 제출
  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!stockForm.code.trim()) {
      showToast('종목코드를 입력해주세요.', 'error');
      return;
    }
    try {
      const res = await addStock(stockForm);
      if (res.success) {
        showToast(res.message || '종목이 추가되었습니다.', 'success');
        setStockForm({
          code: '', name: '', description: '',
          isManualPrice: false, manualPrice: 10000,
          autoFluctuate: false, fluctuateInterval: 3, fluctuateRange: 5
        });
        setPreviewStock(null);
        onDataChanged();
      } else {
        showToast(res.message || '종목 추가에 실패했습니다.', 'error');
      }
    } catch (err) {
      showToast('종목 추가 처리 오류', 'error');
    }
  };

  // 종목 삭제
  const handleDeleteStock = async (code, name) => {
    if (!window.confirm(`'${name}' 종목을 목록에서 제외하시겠습니까?`)) return;
    try {
      const res = await deleteStock(code);
      if (res.success) {
        showToast('종목이 삭제되었습니다.', 'success');
        onDataChanged();
      }
    } catch (err) {
      showToast('삭제 실패', 'error');
    }
  };

  // 기본 KOSPI 20으로 복원
  const handleRestoreStocks = async () => {
    if (!window.confirm('기본 KOSPI 상위 20개 종목으로 복원하시겠습니까? (추가된 커스텀 종목 설정이 초기화됩니다)')) return;
    try {
      const res = await restoreDefaultStocks();
      if (res.success) {
        showToast('기본 KOSPI 20종목으로 복원되었습니다.', 'success');
        onDataChanged();
      }
    } catch (err) {
      showToast('복원 실패', 'error');
    }
  };

  // 학생 개별 추가
  // 학생 개별 추가
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name.trim()) {
      showToast('학생 이름을 입력해주세요.', 'error');
      return;
    }
    try {
      const res = await addStudent(newStudent);
      if (res.success && res.student) {
        showToast(res.message || '학생이 등록되었습니다.', 'success');
        const nextList = [...students, res.student].sort((a, b) => (Number(a.studentNo) || 0) - (Number(b.studentNo) || 0));
        if (onStudentsUpdated) onStudentsUpdated(nextList);
        setNewStudent({
          studentNo: '',
          name: '',
          pin: '1234',
          seedMoney: adminSettings.defaultSeedMoney || 1000000
        });
        if (onDataChanged) onDataChanged();
      } else {
        showToast(res.message || '학생 추가 실패', 'error');
      }
    } catch (err) {
      showToast('학생 추가 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  // 학생 일괄 등록
  const handleBatchAdd = async () => {
    if (!batchText.trim()) {
      showToast('학생 명단을 입력해주세요.', 'error');
      return;
    }
    try {
      const res = await batchAddStudents(batchText, batchSeed);
      if (res.success && res.students) {
        showToast(res.message || '학생들이 등록되었습니다.', 'success');
        const nextList = [...students, ...res.students].sort((a, b) => (Number(a.studentNo) || 0) - (Number(b.studentNo) || 0));
        if (onStudentsUpdated) onStudentsUpdated(nextList);
        setBatchText('');
        setShowBatchModal(false);
        if (onDataChanged) onDataChanged();
      } else {
        showToast(res.message || '일괄 등록 실패', 'error');
      }
    } catch (err) {
      showToast('일괄 등록 실패', 'error');
    }
  };

  // 학생 수정 저장
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      // 1. 화면에 즉시 반영 (0초 지연)
      const nextList = students.map(s => String(s.id) === String(editingStudent.id) ? { ...s, ...editingStudent } : s);
      if (onStudentsUpdated) onStudentsUpdated(nextList);
      showToast('학생 정보가 수정되었습니다.', 'success');
      const target = editingStudent;
      setEditingStudent(null);

      // 2. 서버에 저장
      await updateStudent(target.id, target);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast('수정 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  // 학생 삭제 (즉시 화면 및 로컬스토리지에서 제거)
  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`'${name}' 학생을 명단에서 삭제하시겠습니까?`)) return;
    try {
      // 1. 화면 및 로컬스토리지에서 즉시 삭제 (재등장 원천 차단)
      const nextList = students.filter(s => String(s.id) !== String(id));
      if (onStudentsUpdated) onStudentsUpdated(nextList);
      showToast(`'${name}' 학생이 삭제되었습니다.`, 'success');

      // 2. 서버 백엔드 동기화
      await deleteStudent(id);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast('삭제 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  // 전체 또는 특정 학생 잔고 리셋
  const handleResetStudents = async (studentId = null) => {
    const msg = studentId
      ? '해당 학생의 계좌를 초기화(시드머니로 리셋)하시겠습니까?'
      : '전체 학생의 포트폴리오를 초기화하고 초기 시드머니로 리셋하시겠습니까?\n(새로운 게임이나 학기를 시작할 때 사용하세요)';
    if (!window.confirm(msg)) return;

    try {
      const defaultSeed = Number(adminSettings.defaultSeedMoney || 1000000);
      if (studentId) {
        const nextList = students.map(s => String(s.id) === String(studentId) ? { ...s, cash: defaultSeed, totalAsset: defaultSeed, profitRate: 0, portfolio: {} } : s);
        if (onStudentsUpdated) onStudentsUpdated(nextList);
      } else {
        const nextList = students.map(s => ({ ...s, cash: defaultSeed, totalAsset: defaultSeed, profitRate: 0, portfolio: {} }));
        if (onStudentsUpdated) onStudentsUpdated(nextList);
      }

      const res = await resetStudents(studentId, defaultSeed);
      if (res.success) {
        showToast(res.message, 'success');
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      showToast('초기화 실패', 'error');
    }
  };

  // 학생 개별 비밀번호 1234로 초기화
  const handleResetPin = async (id, name) => {
    if (!window.confirm(`'${name}' 학생의 비밀번호를 기본값 '1234'로 초기화하시겠습니까?`)) return;
    try {
      // 즉시 로컬 반영
      const nextList = students.map(s => String(s.id) === String(id) ? { ...s, pin: '1234' } : s);
      if (onStudentsUpdated) onStudentsUpdated(nextList);
      showToast(`'${name}' 학생의 비밀번호가 '1234'로 초기화되었습니다.`, 'success');

      await resetStudentPin(id);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast('비밀번호 초기화 처리 오류', 'error');
    }
  };

  // 전체 학생 비밀번호 일괄 1234로 초기화
  const handleResetAllPins = async () => {
    if (!window.confirm("모든 학생의 비밀번호를 기본값 '1234'로 일괄 초기화하시겠습니까?")) return;
    try {
      // 즉시 로컬 반영
      const nextList = students.map(s => ({ ...s, pin: '1234' }));
      if (onStudentsUpdated) onStudentsUpdated(nextList);
      showToast("전체 학생의 비밀번호가 '1234'로 일괄 초기화되었습니다.", 'success');

      await resetAllStudentPins();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast('비밀번호 일괄 초기화 오류', 'error');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease' }}>
      {/* 관리자 모드 배너 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.15))',
        border: '1px solid rgba(168, 85, 247, 0.35)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={28} color="#c084fc" />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f3e8ff' }}>
              선생님 관리자 모드 접속 중
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              모의 주식 종목 추가·수정 및 학생 명단과 시드머니를 관리할 수 있습니다.
            </div>
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={onExitAdmin}>
          <Power size={14} /> 관리자 모드 종료 (학생 화면으로)
        </button>
      </div>

      {/* 관리자 서브 탭 */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: 12,
        marginBottom: 24
      }}>
        <button
          className={`btn ${activeTab === 'STOCKS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('STOCKS')}
        >
          <Layers size={16} /> 종목 관리 ({stocks.length}개)
        </button>
        <button
          className={`btn ${activeTab === 'STUDENTS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('STUDENTS')}
        >
          <Users size={16} /> 학생 명단 관리 ({students.length}명)
        </button>
        <button
          className={`btn ${activeTab === 'SETTINGS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('SETTINGS')}
        >
          <Settings size={16} /> 학급 운영 설정
        </button>
      </div>

      {/* ===================== 1. 종목 관리 ===================== */}
      {activeTab === 'STOCKS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 자동 랜덤 가격 변동 설정 카드 배너 */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}>
                <Dices size={24} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                  커스텀 종목 자동 랜덤 가격 변동 시스템
                  <span className="badge" style={{
                    background: globalAuto ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                    color: globalAuto ? '#4ade80' : '#94a3b8',
                    fontSize: 11
                  }}>
                    {globalAuto ? '● 자동 변동 작동 중' : '○ 자동 변동 정지됨'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  체크박스를 활성화하면 설정한 분(Minute) 주기마다 커스텀 종목의 가격이 수업용 뉴스와 함께 랜덤으로 변동됩니다.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.04)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700
              }}>
                <input
                  type="checkbox"
                  checked={globalAuto}
                  onChange={e => setGlobalAuto(e.target.checked)}
                />
                자동 변동 켜기
              </label>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Clock size={15} color="var(--text-secondary)" />
                <span style={{ color: 'var(--text-secondary)' }}>변동 주기:</span>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={globalInterval}
                  onChange={e => setGlobalInterval(Number(e.target.value))}
                  style={{ width: 64, textAlign: 'center', padding: '6px 8px' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>분마다</span>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>변동폭:</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={globalRange}
                  onChange={e => setGlobalRange(Number(e.target.value))}
                  style={{ width: 56, textAlign: 'center', padding: '6px 8px' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>%</span>
              </div>

              <button
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  try {
                    const res = await updateAdminSettings({
                      autoFluctuateCustom: globalAuto,
                      fluctuationIntervalMinutes: Number(globalInterval) || 3,
                      fluctuationRangePercent: Number(globalRange) || 5
                    });
                    if (res.success) {
                      showToast(`자동 변동 설정이 저장되었습니다! (${globalAuto ? `${globalInterval}분 주기 실행` : '비활성화'})`, 'success');
                      onDataChanged();
                    } else {
                      showToast('설정 저장 실패', 'error');
                    }
                  } catch (err) {
                    showToast('설정 저장 중 오류가 발생했습니다.', 'error');
                  }
                }}
              >
                설정 저장
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleTriggerFluctuation(null)}
                title="등록된 모든 커스텀 종목의 가격을 지금 즉시 주사위를 굴려 1회 변동시킵니다"
                style={{ borderColor: 'rgba(99, 102, 241, 0.5)', color: '#a5b4fc' }}
              >
                <Dices size={14} /> 지금 즉시 랜덤 변동
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
            {/* 종목 추가 폼 */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>
                새 종목 추가하기
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                KOSPI/KOSDAQ 실제 종목코드 6자리를 입력하면 실시간 주가가 연동되며, 임의의 코드를 넣어 우리 반 전용 커스텀 종목을 만들 수도 있습니다.
              </p>

              <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    종목코드 (예: 035720 또는 CLASS01)
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      placeholder="예: 035720 또는 CLASS01"
                      value={stockForm.code}
                      onChange={e => setStockForm({ ...stockForm, code: e.target.value })}
                      style={{ flex: 1 }}
                      maxLength={10}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleSearchCode}
                      disabled={searchingCode}
                    >
                      <Search size={14} /> 조회
                    </button>
                  </div>
                </div>

                {previewStock && (
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    fontSize: 12
                  }}>
                    <div style={{ fontWeight: 700, color: '#818cf8' }}>
                      확인된 종목: {previewStock.name} ({previewStock.code})
                    </div>
                    <div>현재 실제 주가: {previewStock.price.toLocaleString()}원</div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    종목 표시명
                  </label>
                  <input
                    type="text"
                    placeholder="예: 우리반 매점, 또는 카카오"
                    value={stockForm.name}
                    onChange={e => setStockForm({ ...stockForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    수업용 메모 / 설명
                  </label>
                  <input
                    type="text"
                    placeholder="예: 우리 반 간식 유통 협동조합 주식"
                    value={stockForm.description}
                    onChange={e => setStockForm({ ...stockForm, description: e.target.value })}
                  />
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 12,
                  marginTop: 4
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      id="manualCheck"
                      checked={stockForm.isManualPrice}
                      onChange={e => setStockForm({
                        ...stockForm,
                        isManualPrice: e.target.checked,
                        autoFluctuate: e.target.checked ? stockForm.autoFluctuate : false
                      })}
                    />
                    <label htmlFor="manualCheck" style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', cursor: 'pointer' }}>
                      실제 시세 대신 수동 기준가 지정하기
                    </label>
                  </div>

                  {stockForm.isManualPrice && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          시작 기준 가격 (원)
                        </label>
                        <input
                          type="number"
                          value={stockForm.manualPrice}
                          onChange={e => setStockForm({ ...stockForm, manualPrice: Number(e.target.value) })}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div style={{
                        borderTop: '1px dashed var(--border-subtle)',
                        paddingTop: 10,
                        marginTop: 4
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            id="autoFluctuateCheck"
                            checked={stockForm.autoFluctuate}
                            onChange={e => setStockForm({ ...stockForm, autoFluctuate: e.target.checked })}
                          />
                          <label htmlFor="autoFluctuateCheck" style={{ fontSize: 12, fontWeight: 700, color: '#a5b4fc', cursor: 'pointer' }}>
                            🎲 N분마다 자동으로 가격 랜덤 변동
                          </label>
                        </div>

                        {stockForm.autoFluctuate && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                                변동 주기 (분)
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={stockForm.fluctuateInterval}
                                onChange={e => setStockForm({ ...stockForm, fluctuateInterval: Number(e.target.value) })}
                                style={{ width: '100%' }}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                                1회 변동폭 (±%)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="30"
                                value={stockForm.fluctuateRange}
                                onChange={e => setStockForm({ ...stockForm, fluctuateRange: Number(e.target.value) })}
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                  <Plus size={16} /> 종목 등록하기
                </button>
              </form>
            </div>

          {/* 등록된 종목 목록 */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>거래 가능 종목 목록 ({stocks.length}개)</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  학생들이 거래할 수 있는 종목들입니다.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleRestoreStocks}>
                <RotateCcw size={14} /> 기본 KOSPI 20으로 리셋
              </button>
            </div>

            <div className="stock-table-container" style={{ maxHeight: 520, overflowY: 'auto' }}>
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>코드</th>
                    <th>종목명</th>
                    <th style={{ textAlign: 'right' }}>실시간 주가</th>
                    <th style={{ textAlign: 'center' }}>분류</th>
                    <th style={{ textAlign: 'center' }}>관리 & 주가 변동</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map(s => {
                    const isCustomOrManual = s.isCustom || s.isManualPrice;
                    return (
                      <tr key={s.code}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                          {s.code}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {s.name}
                            {isCustomOrManual && (
                              <span className="badge" style={{ fontSize: 10, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                                커스텀
                              </span>
                            )}
                            {isCustomOrManual && s.autoFluctuate && (
                              <span className="badge" style={{ fontSize: 10, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                                🎲 {s.fluctuateInterval || 3}분 주기
                              </span>
                            )}
                          </div>
                          {s.lastReason ? (
                            <div style={{ fontSize: 11, color: '#facc15', marginTop: 2 }}>
                              📰 {s.lastReason}
                            </div>
                          ) : (
                            s.description && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.description}</div>
                            )
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          <div>{s.price.toLocaleString()}원</div>
                          {s.changeRate !== undefined && s.changeRate !== 0 && (
                            <div style={{
                              fontSize: 11,
                              color: s.changeRate > 0 ? 'var(--rise)' : 'var(--fall)',
                              fontWeight: 700
                            }}>
                              {s.changeRate > 0 ? '+' : ''}{s.changeRate}% ({s.change > 0 ? '+' : ''}{s.change?.toLocaleString()}원)
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {s.isKospiTop20 ? (
                            <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 11 }}>
                              KOSPI 20
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(234,179,8,0.1)', color: '#facc15', fontSize: 11 }}>
                              커스텀 종목
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenPriceModal(s)}
                              style={{
                                padding: '4px 10px',
                                fontSize: 12,
                                background: 'rgba(99, 102, 241, 0.15)',
                                borderColor: 'rgba(99, 102, 241, 0.4)',
                                color: '#a5b4fc',
                                fontWeight: 700
                              }}
                              title="관리자 주가 직접 변동"
                            >
                              <DollarSign size={13} /> 주가 변동
                            </button>
                            {isCustomOrManual && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleTriggerFluctuation(s.code)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: 12,
                                  borderColor: 'rgba(168, 85, 247, 0.4)',
                                  color: '#c084fc'
                                }}
                                title="이 종목만 지금 즉시 랜덤 가격 변동 실행"
                              >
                                <Dices size={13} />
                              </button>
                            )}
                            {s.isCustom && (
                              <button
                                className="btn-ghost"
                                onClick={() => handleDeleteStock(s.code, s.name)}
                                style={{ padding: 6, color: 'var(--rise)' }}
                                title="목록에서 삭제"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ===================== 2. 학생 명단 관리 ===================== */}
      {activeTab === 'STUDENTS' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          {/* 학생 추가 폼 */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>학생 등록</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowBatchModal(true)}
              >
                📋 명단 일괄 붙여넣기
              </button>
            </div>

            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  출석번호
                </label>
                <input
                  type="number"
                  placeholder="예: 1"
                  value={newStudent.studentNo}
                  onChange={e => setNewStudent({ ...newStudent, studentNo: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  학생 이름
                </label>
                <input
                  type="text"
                  placeholder="예: 김민준"
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  초기 비밀번호 (PIN)
                </label>
                <input
                  type="text"
                  placeholder="기본값: 1234"
                  value={newStudent.pin || '1234'}
                  onChange={e => setNewStudent({ ...newStudent, pin: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  초기 시드머니 (원)
                </label>
                <input
                  type="number"
                  value={newStudent.seedMoney}
                  onChange={e => setNewStudent({ ...newStudent, seedMoney: Number(e.target.value) })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                <Plus size={16} /> 학생 추가하기
              </button>
            </form>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#a855f7', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Key size={14} /> 학생 비밀번호 일괄 초기화
                </h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                  아이들이 비밀번호를 잊어버렸을 때, 전체 학생 비밀번호를 '1234'로 한 번에 리셋합니다.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetAllPins}
                  style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.4)' }}
                >
                  <Key size={13} /> 전체 비밀번호 1234로 초기화
                </button>
              </div>

              <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--rise)', marginBottom: 4 }}>
                  ⚠️ 학급 계좌 일괄 리셋
                </h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                  모든 학생의 보유 주식을 정리하고 초기 시드머니로 리셋합니다.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleResetStudents(null)}
                  style={{ color: 'var(--rise)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                >
                  <RotateCcw size={13} /> 전체 학생 잔고 초기화
                </button>
              </div>
            </div>
          </div>

          {/* 학생 명단 테이블 */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>우리 반 학생 명단 ({students.length}명)</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  학생들의 출석번호, 이름, 비밀번호(PIN), 잔고를 수정하거나 개별 초기화할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="stock-table-container" style={{ maxHeight: 520, overflowY: 'auto' }}>
              <table className="stock-table">
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: 'center' }}>번호</th>
                    <th>이름</th>
                    <th style={{ textAlign: 'center', width: 140 }}>비밀번호 (PIN)</th>
                    <th style={{ textAlign: 'right' }}>보유 현금</th>
                    <th style={{ textAlign: 'right' }}>총 자산</th>
                    <th style={{ textAlign: 'right' }}>수익률</th>
                    <th style={{ textAlign: 'center', width: 130 }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {s.studentNo}번
                      </td>
                      <td style={{ fontWeight: 700, fontSize: 15 }}>
                        {s.name}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: 13,
                            fontWeight: 700,
                            padding: '2px 8px',
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: 4,
                            color: '#cbd5e1'
                          }}>
                            {s.pin || '1234'}
                          </span>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 6px', fontSize: 10, borderColor: 'rgba(168,85,247,0.3)', color: '#c084fc' }}
                            onClick={() => handleResetPin(s.id, s.name)}
                            title="비밀번호 1234로 초기화"
                          >
                            초기화
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {s.cash?.toLocaleString()}원
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {s.totalAsset?.toLocaleString()}원
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge ${(s.profitRate || 0) > 0 ? 'badge-rise' : ((s.profitRate || 0) < 0 ? 'badge-fall' : 'badge-even')}`}>
                          {(s.profitRate || 0) > 0 ? '+' : ''}{s.profitRate || 0}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <button
                            className="btn-ghost"
                            onClick={() => setEditingStudent(s)}
                            style={{ padding: 6 }}
                            title="정보 및 비밀번호 수정"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            className="btn-ghost"
                            onClick={() => handleResetStudents(s.id)}
                            style={{ padding: 6, color: '#f59e0b' }}
                            title="계좌 잔고 초기화"
                          >
                            <RotateCcw size={15} />
                          </button>
                          <button
                            className="btn-ghost"
                            onClick={() => handleDeleteStudent(s.id, s.name)}
                            style={{ padding: 6, color: 'var(--rise)' }}
                            title="학생 삭제"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 3. 학급 운영 설정 ===================== */}
      {activeTab === 'SETTINGS' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>학급 경제교실 운영 설정</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontWeight: 700 }}>모의 시장 거래 허용 여부</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  수업 시간 중에만 거래를 열거나 일시 마감할 수 있습니다.
                </div>
              </div>
              <button
                className={`btn ${adminSettings.allowTrading ? 'btn-rise' : 'btn-secondary'}`}
                onClick={async () => {
                  const res = await updateAdminSettings({ allowTrading: !adminSettings.allowTrading });
                  if (res.success) {
                    showToast(`거래가 ${!adminSettings.allowTrading ? '재개' : '중단'}되었습니다.`, 'info');
                    onDataChanged();
                  }
                }}
              >
                {adminSettings.allowTrading ? '🟢 거래 가능 (장 열림)' : '🔴 거래 중지 (장 마감)'}
              </button>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>신규 학생 기본 시드머니</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                새로 등록되는 학생들에게 기본 지급되는 가상 자본금입니다.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="number"
                  defaultValue={adminSettings.defaultSeedMoney || 1000000}
                  id="seedInput"
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    const val = Number(document.getElementById('seedInput').value);
                    const res = await updateAdminSettings({ defaultSeedMoney: val });
                    if (res.success) {
                      showToast('기본 시드머니가 변경되었습니다.', 'success');
                      onDataChanged();
                    }
                  }}
                >
                  변경 저장
                </button>
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>관리자 비밀번호 변경</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                현재 기본 비밀번호는 `admin` 입니다.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="password"
                  placeholder="새 비밀번호 입력"
                  id="adminPwdInput"
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    const val = document.getElementById('adminPwdInput').value;
                    if (!val) return;
                    const res = await updateAdminSettings({ adminPassword: val });
                    if (res.success) {
                      showToast('비밀번호가 변경되었습니다.', 'success');
                      document.getElementById('adminPwdInput').value = '';
                    }
                  }}
                >
                  비밀번호 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 일괄 등록 모달 ===================== */}
      {showBatchModal && (
        <div className="modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>학생 명단 일괄 붙여넣기</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              한 줄에 한 명씩 학생 이름(또는 번호와 이름)을 붙여넣으세요.<br />
              예시:<br />
              1. 김철수<br />
              2. 이영희<br />
              3. 박민수
            </p>

            <textarea
              rows={8}
              placeholder="1. 김철수&#10;2. 이영희&#10;3. 박민수"
              value={batchText}
              onChange={e => setBatchText(e.target.value)}
              style={{ width: '100%', marginBottom: 14, resize: 'vertical' }}
            />

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                각 학생에게 지급할 시드머니 (원)
              </label>
              <input
                type="number"
                value={batchSeed}
                onChange={e => setBatchSeed(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowBatchModal(false)}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleBatchAdd}>
                한 번에 등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 학생 수정 모달 ===================== */}
      {editingStudent && (
        <div className="modal-overlay" onClick={() => setEditingStudent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>학생 정보 수정</h3>
            <form onSubmit={handleUpdateStudent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  출석번호
                </label>
                <input
                  type="number"
                  value={editingStudent.studentNo}
                  onChange={e => setEditingStudent({ ...editingStudent, studentNo: Number(e.target.value) })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  학생 이름
                </label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  보유 현금 (잔고)
                </label>
                <input
                  type="number"
                  value={editingStudent.cash}
                  onChange={e => setEditingStudent({ ...editingStudent, cash: Number(e.target.value) })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  비밀번호 (PIN)
                </label>
                <input
                  type="text"
                  placeholder="예: 1234"
                  value={editingStudent.pin || '1234'}
                  onChange={e => setEditingStudent({ ...editingStudent, pin: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingStudent(null)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  수정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== 주가 변동 모달 ===================== */}
      {priceModal && (
        <div className="modal-overlay" onClick={() => setPriceModal(null)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: '#818cf8', fontWeight: 700 }}>선생님 주가 변동 제어</div>
                <h3 style={{ fontSize: 20, fontWeight: 800 }}>{priceModal.stock.name} ({priceModal.stock.code})</h3>
              </div>
              <span className="badge" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                수동 가격 조정
              </span>
            </div>

            {/* 현재가 vs 변경가 비교 프리뷰 카드 */}
            {(() => {
              const base = priceModal.stock.price || 10000;
              const target = Number(priceModal.newPrice) || 0;
              const diff = target - base;
              const rate = base > 0 ? ((diff / base) * 100).toFixed(2) : 0;
              const isUp = diff > 0;
              const isDown = diff < 0;

              return (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>현재 주가</span>
                    <span style={{ fontWeight: 600 }}>{base.toLocaleString()}원</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    <span>변경 후 예상 주가</span>
                    <span style={{ color: isUp ? 'var(--rise)' : (isDown ? 'var(--fall)' : 'var(--text-primary)'), fontSize: 20 }}>
                      {target.toLocaleString()}원
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>변동폭 / 등락률</span>
                    <span style={{
                      fontWeight: 700,
                      color: isUp ? 'var(--rise)' : (isDown ? 'var(--fall)' : 'var(--text-muted)')
                    }}>
                      {isUp ? '+' : ''}{diff.toLocaleString()}원 ({isUp ? '+' : ''}{rate}%)
                    </span>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleSavePriceChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 새 주가 직접 입력 */}
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  새로운 목표 주가 (원)
                </label>
                <input
                  type="number"
                  step="10"
                  min="10"
                  value={priceModal.newPrice}
                  onChange={e => setPriceModal({ ...priceModal, newPrice: Number(e.target.value) })}
                  style={{ width: '100%', fontSize: 18, fontWeight: 700 }}
                  required
                />
              </div>

              {/* 퀵 퍼센트 등락 버튼 */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  빠른 퍼센트 변동 퀵 버튼
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--rise)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                    onClick={() => handleApplyPricePercent(5)}
                  >
                    +5%
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--rise)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                    onClick={() => handleApplyPricePercent(10)}
                  >
                    +10%
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--rise)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                    onClick={() => handleApplyPricePercent(20)}
                  >
                    +20%
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'white', background: 'var(--rise)', borderColor: 'var(--rise)', fontWeight: 800 }}
                    onClick={() => handleApplyPricePercent(30)}
                  >
                    상한가 (+30%)
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--fall)', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                    onClick={() => handleApplyPricePercent(-5)}
                  >
                    -5%
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--fall)', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                    onClick={() => handleApplyPricePercent(-10)}
                  >
                    -10%
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--fall)', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                    onClick={() => handleApplyPricePercent(-20)}
                  >
                    -20%
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'white', background: '#0284c7', borderColor: '#0284c7', fontWeight: 800 }}
                    onClick={() => handleApplyPricePercent(-30)}
                  >
                    하한가 (-30%)
                  </button>
                </div>
              </div>

              {/* 변동 사유 / 교육용 뉴스 */}
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  수업용 뉴스 및 변동 사유 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 3분기 실적 서프라이즈 발표, 대규모 수출 계약"
                  value={priceModal.reason}
                  onChange={e => setPriceModal({ ...priceModal, reason: e.target.value })}
                  style={{ width: '100%', marginBottom: 8 }}
                />

                {/* 추천 뉴스 태그 템플릿 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    '📈 신제품 판매 돌풍 및 실적 호조',
                    '📈 대규모 해외 공급 계약 체결',
                    '📉 원자재 가격 급등으로 수익성 악화',
                    '📉 주요 거래처 주문 축소 우려'
                  ].map(template => (
                    <button
                      key={template}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                      onClick={() => setPriceModal({ ...priceModal, reason: template })}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              {/* 커스텀 종목 자동 가격 변동 설정 블록 */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                    <input
                      type="checkbox"
                      checked={priceModal.autoFluctuate}
                      onChange={e => setPriceModal({ ...priceModal, autoFluctuate: e.target.checked })}
                    />
                    🎲 이 종목 자동 랜덤 가격 변동 활성화
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={async () => {
                      await handleTriggerFluctuation(priceModal.stock.code);
                      setPriceModal(null);
                    }}
                    style={{ fontSize: 11, padding: '4px 8px', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.4)' }}
                    title="지금 즉시 랜덤 주가를 1회 반영합니다"
                  >
                    <Dices size={13} /> 즉시 랜덤 변동
                  </button>
                </div>

                {priceModal.autoFluctuate && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(99, 102, 241, 0.2)' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        자동 변동 주기 (분)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={priceModal.fluctuateInterval}
                        onChange={e => setPriceModal({ ...priceModal, fluctuateInterval: Number(e.target.value) })}
                        style={{ width: '100%', fontSize: 13 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        1회 최대 변동률 (±%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={priceModal.fluctuateRange}
                        onChange={e => setPriceModal({ ...priceModal, fluctuateRange: Number(e.target.value) })}
                        style={{ width: '100%', fontSize: 13 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPriceModal(null)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: 140 }}>
                  <DollarSign size={16} /> 주가 및 설정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
