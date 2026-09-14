import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Wallet, Trophy, History, Shield, LogOut,
  RefreshCw, CheckCircle, AlertCircle, Info, Lock, Key, UserCheck
} from 'lucide-react';
import StockList from './components/StockList.jsx';
import StockDetailModal from './components/StockDetailModal.jsx';
import TradeModal from './components/TradeModal.jsx';
import MyPortfolio from './components/MyPortfolio.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import TradeHistory from './components/TradeHistory.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import StudentLogin from './components/StudentLogin.jsx';
import ChangePinModal from './components/ChangePinModal.jsx';
import {
  fetchStocks, fetchStudents, fetchStudent, loginAdmin, fetchAdminSettings, syncStudentsWithServer
} from './api.js';

export default function App() {
  const [stocks, setStocks] = useState([]);
  const [students, setStudents] = useState(() => {
    try {
      const cached = localStorage.getItem('classroom_saved_students');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [currentStudentId, setCurrentStudentId] = useState(() => {
    return localStorage.getItem('classroom_student_id') || '';
  });
  const [currentStudent, setCurrentStudent] = useState(null);
  const [adminSettings, setAdminSettings] = useState({});

  // 뷰 탭: 'STOCKS' | 'PORTFOLIO' | 'LEADERBOARD' | 'HISTORY' | 'ADMIN'
  const [currentTab, setCurrentTab] = useState('STOCKS');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  // 학생 비밀번호 변경 모달
  const [showChangePinModal, setShowChangePinModal] = useState(false);

  // 모달 상태
  const [selectedStockForDetail, setSelectedStockForDetail] = useState(null);
  const [tradeModalConfig, setTradeModalConfig] = useState(null); // { stock, type }

  // 로딩 & 토스트
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // 학생 명단 즉시 갱신 및 로컬/서버 완전 동기화 함수
  const updateStudentsList = (newList) => {
    const sorted = [...newList].sort((a, b) => (Number(a.studentNo) || 0) - (Number(b.studentNo) || 0));
    setStudents(sorted);
    localStorage.setItem('classroom_saved_students', JSON.stringify(sorted));
    syncStudentsWithServer(sorted);
  };

  // 초기 데이터 로딩
  const loadData = async () => {
    setLoadingStocks(true);
    try {
      const [stockData, serverStudents, settings] = await Promise.all([
        fetchStocks(),
        fetchStudents(),
        fetchAdminSettings()
      ]);
      setStocks(stockData);
      setAdminSettings(settings);

      // 로컬 스토리지에 관리자가 이미 수정한 명단이 있는지 확인
      let effectiveStudents = serverStudents;
      try {
        const localSaved = localStorage.getItem('classroom_saved_students');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          // 관리자가 로컬에서 명단을 수정한 이력이 있는 경우 로컬 명단 우선 적용
          if (Array.isArray(parsed) && parsed.length > 0) {
            effectiveStudents = parsed;
            // 서버리스 인스턴스에도 로컬 최신 명단을 동기화
            syncStudentsWithServer(effectiveStudents);
          }
        }
      } catch (e) {}

      setStudents(effectiveStudents);
      localStorage.setItem('classroom_saved_students', JSON.stringify(effectiveStudents));

      // 기존 로그인 정보가 유효한지 검증
      const savedId = localStorage.getItem('classroom_student_id');
      if (savedId) {
        const found = effectiveStudents.find(s => s.id === savedId);
        if (found) {
          setCurrentStudentId(savedId);
        } else {
          localStorage.removeItem('classroom_student_id');
          setCurrentStudentId('');
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      showToast('데이터를 불러오지 못했습니다.', 'error');
    } finally {
      setLoadingStocks(false);
    }
  };

  useEffect(() => {
    loadData();
    // 15초마다 자동 시세 갱신
    const interval = setInterval(async () => {
      try {
        const freshStocks = await fetchStocks();
        setStocks(freshStocks);
      } catch (e) {
        // 백그라운드 갱신 에러 무시
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // 선택된 학생 변경 시 상세 정보 재조회
  useEffect(() => {
    if (!currentStudentId) {
      setCurrentStudent(null);
      return;
    }
    fetchStudent(currentStudentId).then(data => {
      if (data) setCurrentStudent(data);
    });
  }, [currentStudentId]);

  // 학생 정보 새로고침 헬퍼
  const refreshCurrentStudent = async () => {
    if (!currentStudentId) return;
    const updated = await fetchStudent(currentStudentId);
    if (updated) setCurrentStudent(updated);
    const updatedList = await fetchStudents();
    setStudents(updatedList);
  };

  // 학생 로그인 완료 핸들러
  const handleStudentLoginSuccess = (student) => {
    localStorage.setItem('classroom_student_id', student.id);
    setCurrentStudentId(student.id);
    setCurrentStudent(student);
    setCurrentTab('STOCKS');
    showToast(`${student.name} 학생으로 로그인되었습니다!`, 'success');
  };

  // 학생 로그아웃
  const handleStudentLogout = () => {
    localStorage.removeItem('classroom_student_id');
    setCurrentStudentId('');
    setCurrentStudent(null);
    setCurrentTab('STOCKS');
    showToast('로그아웃되었습니다.', 'info');
  };

  // 관리자 로그인 핸들러
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await loginAdmin(adminPasswordInput);
      if (res.success) {
        setIsAdmin(true);
        setShowAdminLoginModal(false);
        setAdminPasswordInput('');
        setCurrentTab('ADMIN');
        showToast('선생님 관리자 모드로 전환되었습니다.', 'success');
      } else {
        showToast(res.message || '비밀번호가 올바르지 않습니다.', 'error');
      }
    } catch (err) {
      showToast('로그인 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <div className="app-container">
      {/* ===================== 상단 네비게이션 헤더 ===================== */}
      <header className="main-header">
        {/* 로고 */}
        <div className="logo-section" style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('STOCKS')}>
          <div className="logo-badge">📈</div>
          <div>
            <div className="logo-title">우리 반 모의 주식 거래소</div>
            <div className="logo-sub">KOSPI 상위 20개 종목 실시간 경제교실</div>
          </div>
        </div>

        {/* 학생 또는 관리자가 로그인된 경우 탭 표시 */}
        {(currentStudent || isAdmin) && (
          <nav className="nav-tabs">
            <button
              className={`nav-tab ${currentTab === 'STOCKS' ? 'active' : ''}`}
              onClick={() => setCurrentTab('STOCKS')}
            >
              <TrendingUp size={16} /> 시세표
            </button>
            <button
              className={`nav-tab ${currentTab === 'PORTFOLIO' ? 'active' : ''}`}
              onClick={() => setCurrentTab('PORTFOLIO')}
            >
              <Wallet size={16} /> 내 투자
            </button>
            <button
              className={`nav-tab ${currentTab === 'LEADERBOARD' ? 'active' : ''}`}
              onClick={() => setCurrentTab('LEADERBOARD')}
            >
              <Trophy size={16} /> 학급 랭킹
            </button>
            <button
              className={`nav-tab ${currentTab === 'HISTORY' ? 'active' : ''}`}
              onClick={() => setCurrentTab('HISTORY')}
            >
              <History size={16} /> 체결 일지
            </button>
            {isAdmin && (
              <button
                className={`nav-tab ${currentTab === 'ADMIN' ? 'active' : ''}`}
                onClick={() => setCurrentTab('ADMIN')}
                style={{ background: currentTab === 'ADMIN' ? '#9333ea' : 'transparent', color: '#c084fc' }}
              >
                <Shield size={16} /> 관리자 패널
              </button>
            )}
          </nav>
        )}

        {/* 우측 프로필 / 로그인 / 관리자 전환 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* 학생 로그인 상태 표시 (다른 학생 스위칭 불가) */}
          {currentStudent && !isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontWeight: 800, color: '#818cf8' }}>
                  {currentStudent.studentNo}번 {currentStudent.name}
                </span>
                <span style={{ color: 'var(--border-subtle)' }}>|</span>
                <span style={{ color: 'var(--text-muted)' }}>현금:</span>
                <strong style={{ color: '#10b981' }}>{currentStudent.cash?.toLocaleString()}원</strong>
              </div>

              {/* 비밀번호 변경 버튼 */}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowChangePinModal(true)}
                title="내 비밀번호 변경"
                style={{ padding: '6px 10px' }}
              >
                <Key size={13} />
              </button>

              {/* 학생 로그아웃 버튼 */}
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleStudentLogout}
                title="로그아웃"
                style={{ padding: '6px 10px', color: 'var(--text-muted)' }}
              >
                <LogOut size={13} />
              </button>
            </div>
          )}

          {/* 관리자 모드 토글 버튼 */}
          {!isAdmin ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAdminLoginModal(true)}
              style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
            >
              <Lock size={14} /> 관리자 모드
            </button>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setIsAdmin(false);
                setCurrentTab('STOCKS');
                showToast('관리자 모드를 종료했습니다.', 'info');
              }}
              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
            >
              <LogOut size={14} /> 관리자 종료
            </button>
          )}
        </div>
      </header>

      {/* ===================== 메인 뷰 컨텐츠 ===================== */}
      <main>
        {/* 학생도 관리자도 로그인하지 않은 경우 -> 학생 로그인 화면 제공 */}
        {!currentStudent && !isAdmin ? (
          <StudentLogin
            students={students}
            onLoginSuccess={handleStudentLoginSuccess}
            showToast={showToast}
          />
        ) : (
          <>
            {currentTab === 'STOCKS' && (
              <StockList
                stocks={stocks}
                loading={loadingStocks}
                onRefresh={async () => {
                  setLoadingStocks(true);
                  const updated = await fetchStocks();
                  setStocks(updated);
                  setLoadingStocks(false);
                  showToast('최신 주가 시세를 불러왔습니다.', 'info');
                }}
                onSelectStock={stock => setSelectedStockForDetail(stock)}
                onQuickTrade={(stock, type) => setTradeModalConfig({ stock, type })}
                student={currentStudent}
              />
            )}

            {currentTab === 'PORTFOLIO' && (
              <MyPortfolio
                student={currentStudent}
                stocks={stocks}
                onQuickTrade={(stock, type) => setTradeModalConfig({ stock, type })}
                onNavigateToStocks={() => setCurrentTab('STOCKS')}
              />
            )}

            {currentTab === 'LEADERBOARD' && (
              <Leaderboard currentStudentId={currentStudentId} />
            )}

            {currentTab === 'HISTORY' && (
              <TradeHistory student={currentStudent} />
            )}

            {currentTab === 'ADMIN' && isAdmin && (
              <AdminPanel
                stocks={stocks}
                students={students}
                adminSettings={adminSettings}
                onStudentsUpdated={updateStudentsList}
                onDataChanged={() => {
                  loadData();
                  refreshCurrentStudent();
                }}
                showToast={showToast}
                onExitAdmin={() => {
                  setIsAdmin(false);
                  setCurrentTab('STOCKS');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* ===================== 종목 상세 팝업 ===================== */}
      {selectedStockForDetail && (
        <StockDetailModal
          stock={selectedStockForDetail}
          onClose={() => setSelectedStockForDetail(null)}
          onOpenTrade={(stock, type) => setTradeModalConfig({ stock, type })}
          studentHolding={currentStudent?.portfolio?.[selectedStockForDetail.code]?.count || 0}
        />
      )}

      {/* ===================== 매수/매도 주문 모달 ===================== */}
      {tradeModalConfig && (
        <TradeModal
          stock={tradeModalConfig.stock}
          initialType={tradeModalConfig.type}
          student={currentStudent}
          onClose={() => setTradeModalConfig(null)}
          onTradeSuccess={(updatedStudent) => {
            setCurrentStudent(updatedStudent);
            refreshCurrentStudent();
          }}
          showToast={showToast}
        />
      )}

      {/* ===================== 학생 비밀번호 변경 모달 ===================== */}
      {showChangePinModal && currentStudent && (
        <ChangePinModal
          student={currentStudent}
          onClose={() => setShowChangePinModal(false)}
          onSuccess={(updatedStudent) => {
            setCurrentStudent(updatedStudent);
            refreshCurrentStudent();
          }}
          showToast={showToast}
        />
      )}

      {/* ===================== 관리자 로그인 모달 ===================== */}
      {showAdminLoginModal && (
        <div className="modal-overlay" onClick={() => setShowAdminLoginModal(false)}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <Shield size={26} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>선생님 관리자 로그인</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                종목 및 학생 명단을 관리하려면 비밀번호를 입력하세요.
              </p>
            </div>

            <form onSubmit={handleAdminLogin}>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="password"
                  placeholder="관리자 비밀번호 (기본: admin)"
                  value={adminPasswordInput}
                  onChange={e => setAdminPasswordInput(e.target.value)}
                  style={{ width: '100%', height: 44, fontSize: 15 }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowAdminLoginModal(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg, #9333ea, #7e22ce)' }}
                >
                  로그인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== 토스트 알림창 ===================== */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
