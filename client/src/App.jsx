import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Wallet, Trophy, History, Shield, LogOut,
  RefreshCw, CheckCircle, AlertCircle, Info, Lock
} from 'lucide-react';
import StockList from './components/StockList.jsx';
import StockDetailModal from './components/StockDetailModal.jsx';
import TradeModal from './components/TradeModal.jsx';
import MyPortfolio from './components/MyPortfolio.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import TradeHistory from './components/TradeHistory.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import {
  fetchStocks, fetchStudents, fetchStudent, loginAdmin, fetchAdminSettings
} from './api.js';

export default function App() {
  const [stocks, setStocks] = useState([]);
  const [students, setStudents] = useState([]);
  const [currentStudentId, setCurrentStudentId] = useState('');
  const [currentStudent, setCurrentStudent] = useState(null);
  const [adminSettings, setAdminSettings] = useState({});

  // 뷰 탭: 'STOCKS' | 'PORTFOLIO' | 'LEADERBOARD' | 'HISTORY' | 'ADMIN'
  const [currentTab, setCurrentTab] = useState('STOCKS');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

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

  // 초기 데이터 로딩
  const loadData = async () => {
    setLoadingStocks(true);
    try {
      const [stockData, studentList, settings] = await Promise.all([
        fetchStocks(),
        fetchStudents(),
        fetchAdminSettings()
      ]);
      setStocks(stockData);
      setStudents(studentList);
      setAdminSettings(settings);

      // 첫 번째 학생을 기본 선택
      if (studentList.length > 0 && !currentStudentId) {
        setCurrentStudentId(studentList[0].id);
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
    if (!currentStudentId) return;
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
        showToast('관리자 모드로 전환되었습니다.', 'success');
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
        <div className="logo-section">
          <div className="logo-badge">📈</div>
          <div>
            <div className="logo-title">우리 반 모의 주식 거래소</div>
            <div className="logo-sub">KOSPI 상위 20개 종목 실시간 경제교실</div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
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

        {/* 우측 프로필 및 관리자 전환 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* 학생 선택 드롭다운 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>내 계좌:</span>
            <select
              value={currentStudentId}
              onChange={e => setCurrentStudentId(e.target.value)}
              style={{ fontWeight: 600, height: 38 }}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.studentNo}번 {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 현재 학생의 자산 뱃지 */}
          {currentStudent && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>현금:</span>
              <strong style={{ color: '#10b981' }}>{currentStudent.cash?.toLocaleString()}원</strong>
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
