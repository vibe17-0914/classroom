const express = require('express');
const cors = require('cors');
const path = require('path');
const stockService = require('./stockService');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API 캐싱 방지 헤더 설정 (Vercel 및 브라우저 캐시로 인한 데이터 불일치 방지)
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// ================== 주식 시세 관련 API ==================

// 1. 전체 종목 목록 및 실시간 주가 조회
app.get('/api/stocks', async (req, res) => {
  try {
    const settings = db.getSettings();
    const stocks = await stockService.getAllStocksWithPrices(settings.customStocks || []);
    res.json({ success: true, stocks });
  } catch (err) {
    console.error('API /stocks error:', err);
    res.status(500).json({ success: false, message: '주식 시세를 가져오는 데 실패했습니다.' });
  }
});

// 2. 개별 종목 차트 데이터 조회
app.get('/api/stocks/:code/chart', async (req, res) => {
  try {
    const { code } = req.params;
    const settings = db.getSettings();
    const chartData = await stockService.fetchStockChart(code, settings.customStocks || []);
    res.json({ success: true, code, chart: chartData });
  } catch (err) {
    console.error('API /stocks/:code/chart error:', err);
    res.status(500).json({ success: false, message: '차트 데이터를 불러오지 못했습니다.' });
  }
});

// 관리자: 커스텀 종목 가격 변동
app.put('/api/stocks/:code/price', (req, res) => {
  try {
    const { code } = req.params;
    const { price, reason, autoFluctuate, fluctuateInterval, fluctuateRange } = req.body;
    if (price === undefined || isNaN(Number(price))) {
      return res.status(400).json({ success: false, message: '올바른 가격을 입력해주세요.' });
    }
    const extraOpts = {};
    if (autoFluctuate !== undefined) extraOpts.autoFluctuate = !!autoFluctuate;
    if (fluctuateInterval !== undefined) extraOpts.fluctuateInterval = Number(fluctuateInterval);
    if (fluctuateRange !== undefined) extraOpts.fluctuateRange = Number(fluctuateRange);

    const updated = db.updateCustomStockPrice(code, price, reason, extraOpts);
    res.json({
      success: true,
      stock: updated,
      message: `주가가 ${Number(price).toLocaleString()}원으로 성공적으로 변경되었습니다!`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || '가격 변경에 실패했습니다.' });
  }
});

// 관리자: 랜덤 가격 변동 트리거 (즉시 실행 또는 특정 종목)
app.post('/api/stocks/fluctuate', (req, res) => {
  try {
    const { code, force = true } = req.body;
    const updatedList = db.triggerRandomFluctuation(code || null, !!force);
    res.json({
      success: true,
      updated: updatedList,
      count: updatedList.length,
      message: updatedList.length > 0
        ? `${updatedList.length}개 종목의 주가가 랜덤으로 변동되었습니다.`
        : '변동 대상 종목이 없거나 주기에 아직 도달하지 않았습니다.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '랜덤 주가 변동 실패' });
  }
});

// 3. 종목코드로 네이버 실시간 정보 미리보기 검색
app.get('/api/stocks/search/:code', async (req, res) => {
  try {
    const code = req.params.code.trim();
    const detail = await stockService.fetchStockDetail(code);
    if (!detail) {
      return res.status(404).json({ success: false, message: '해당 종목코드 정보를 찾을 수 없습니다.' });
    }
    res.json({ success: true, stock: detail });
  } catch (err) {
    res.status(500).json({ success: false, message: '종목 조회 중 오류가 발생했습니다.' });
  }
});

// 4. 관리자: 종목 추가
app.post('/api/stocks', async (req, res) => {
  try {
    const {
      code, name, description, isManualPrice, manualPrice,
      autoFluctuate, fluctuateInterval, fluctuateRange
    } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: '종목코드를 입력해주세요.' });
    }

    // 네이버에서 기본 정보 확인 (수동 가격이 아닐 경우)
    let realInfo = null;
    if (!isManualPrice) {
      realInfo = await stockService.fetchStockDetail(code);
    }

    const stockData = {
      code: code.trim(),
      name: (name && name.trim()) || (realInfo ? realInfo.name : '신규 종목'),
      description: description || '',
      isManualPrice: !!isManualPrice,
      manualPrice: isManualPrice ? Number(manualPrice || 10000) : null,
      autoFluctuate: !!autoFluctuate,
      fluctuateInterval: Number(fluctuateInterval || 3),
      fluctuateRange: Number(fluctuateRange || 5),
      lastFluctuatedAt: new Date().toISOString(),
      deleted: false
    };

    db.saveCustomStock(stockData);
    res.json({ success: true, stock: stockData, message: '종목이 성공적으로 추가/저장되었습니다.' });
  } catch (err) {
    console.error('POST /stocks error:', err);
    res.status(500).json({ success: false, message: '종목 추가에 실패했습니다.' });
  }
});

// 5. 관리자: 종목 수정
app.put('/api/stocks/:code', (req, res) => {
  try {
    const { code } = req.params;
    const {
      name, description, disabled, pinned,
      autoFluctuate, fluctuateInterval, fluctuateRange
    } = req.body;

    const updateObj = {
      code,
      name,
      description,
      disabled: !!disabled,
      pinned: !!pinned
    };
    if (autoFluctuate !== undefined) updateObj.autoFluctuate = !!autoFluctuate;
    if (fluctuateInterval !== undefined) updateObj.fluctuateInterval = Number(fluctuateInterval);
    if (fluctuateRange !== undefined) updateObj.fluctuateRange = Number(fluctuateRange);

    const updated = db.saveCustomStock(updateObj);
    res.json({ success: true, stock: updated, message: '종목 정보가 수정되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '종목 수정에 실패했습니다.' });
  }
});

// 6. 관리자: 종목 삭제
app.delete('/api/stocks/:code', (req, res) => {
  try {
    const { code } = req.params;
    db.deleteCustomStock(code);
    res.json({ success: true, message: '종목이 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '종목 삭제에 실패했습니다.' });
  }
});

// 7. 관리자: 기본 KOSPI 20 종목으로 초기화
app.post('/api/stocks/restore', (req, res) => {
  try {
    db.restoreDefaultStocks();
    res.json({ success: true, message: '기본 KOSPI 상위 20개 종목으로 복원되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '종목 초기화에 실패했습니다.' });
  }
});

// ================== 학생 관리 API ==================

// 전체 학생 목록
app.get('/api/students', async (req, res) => {
  try {
    const settings = db.getSettings();
    const stocks = await stockService.getAllStocksWithPrices(settings.customStocks || []);
    const priceMap = {};
    stocks.forEach(s => { priceMap[s.code] = s.price; });

    const students = db.getStudents();
    const studentsWithSummary = students.map(s => {
      const assetInfo = db.calculateStudentTotalAsset(s, priceMap);
      return {
        ...s,
        ...assetInfo
      };
    });

    res.json({ success: true, students: studentsWithSummary });
  } catch (err) {
    console.error('GET /students error:', err);
    res.status(500).json({ success: false, message: '학생 목록을 불러오지 못했습니다.' });
  }
});

// 개별 학생 상세 (포트폴리오 실시간 가치 반영)
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = db.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: '학생을 찾을 수 없습니다.' });
    }

    const settings = db.getSettings();
    const stocks = await stockService.getAllStocksWithPrices(settings.customStocks || []);
    const priceMap = {};
    const stockMap = {};
    stocks.forEach(s => {
      priceMap[s.code] = s.price;
      stockMap[s.code] = s;
    });

    const assetInfo = db.calculateStudentTotalAsset(student, priceMap);

    // 포트폴리오 항목별 상세 계산
    const enrichedPortfolio = [];
    if (student.portfolio) {
      for (const [code, item] of Object.entries(student.portfolio)) {
        const curPrice = priceMap[code] || item.avgPrice;
        const curValue = curPrice * item.count;
        const profit = curValue - item.totalSpent;
        const profitRate = item.totalSpent > 0 ? ((profit / item.totalSpent) * 100) : 0;
        const stockInfo = stockMap[code] || {};

        enrichedPortfolio.push({
          code,
          name: item.name || stockInfo.name || code,
          count: item.count,
          avgPrice: item.avgPrice,
          totalSpent: item.totalSpent,
          currentPrice: curPrice,
          currentValue: curValue,
          profit,
          profitRate: parseFloat(profitRate.toFixed(2)),
          changeRate: stockInfo.changeRate || 0,
          changeDirection: stockInfo.changeDirection || 'EVEN'
        });
      }
    }

    res.json({
      success: true,
      student: {
        ...student,
        ...assetInfo,
        enrichedPortfolio
      }
    });
  } catch (err) {
    console.error('GET /students/:id error:', err);
    res.status(500).json({ success: false, message: '학생 정보를 불러오지 못했습니다.' });
  }
});

// 학생 로그인 (출석번호 또는 ID + PIN)
app.post('/api/students/login', (req, res) => {
  try {
    const { studentId, studentNo, pin } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, message: '비밀번호(PIN)를 입력해주세요.' });
    }
    const student = db.verifyStudentLogin(studentId || studentNo, pin);
    res.json({
      success: true,
      student,
      message: `${student.name} 학생으로 로그인되었습니다!`
    });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message || '로그인에 실패했습니다.' });
  }
});

// 학생 비밀번호 변경 (학생 본인 또는 관리자)
app.put('/api/students/:id/pin', (req, res) => {
  try {
    const { pin } = req.body;
    const updated = db.updateStudentPin(req.params.id, pin);
    res.json({
      success: true,
      student: updated,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || '비밀번호 변경 실패' });
  }
});

// 학생 개별 비밀번호 초기화 (관리자용: 기본값 1234로 리셋)
app.post('/api/students/:id/reset-pin', (req, res) => {
  try {
    const updated = db.resetStudentPin(req.params.id, '1234');
    res.json({
      success: true,
      student: updated,
      message: `${updated.name} 학생의 비밀번호가 '1234'로 초기화되었습니다.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '비밀번호 초기화 실패' });
  }
});

// 전체 학생 비밀번호 일괄 초기화 (관리자용: 전체 1234 리셋)
app.post('/api/students/reset-all-pins', (req, res) => {
  try {
    const count = db.resetAllStudentPins('1234');
    res.json({
      success: true,
      count,
      message: `전체 ${count}명 학생의 비밀번호가 '1234'로 초기화되었습니다.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '전체 비밀번호 초기화 실패' });
  }
});

// 학생 단일 추가
app.post('/api/students', (req, res) => {
  try {
    const { name, studentNo, pin, seedMoney } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '학생 이름을 입력해주세요.' });
    }
    const student = db.addStudent({ name, studentNo, pin, seedMoney });
    res.json({ success: true, student, message: `${student.name} 학생이 등록되었습니다.` });
  } catch (err) {
    res.status(500).json({ success: false, message: '학생 추가에 실패했습니다.' });
  }
});

// 학생 일괄 등록 (명단 텍스트)
app.post('/api/students/batch', (req, res) => {
  try {
    const { namesText, seedMoney } = req.body;
    if (!namesText || !namesText.trim()) {
      return res.status(400).json({ success: false, message: '등록할 학생 명단을 입력해주세요.' });
    }
    const lines = namesText.split('\n').map(l => l.trim()).filter(Boolean);
    const added = db.batchAddStudents(lines, seedMoney);
    res.json({ success: true, count: added.length, students: added, message: `${added.length}명의 학생이 일괄 등록되었습니다.` });
  } catch (err) {
    res.status(500).json({ success: false, message: '학생 일괄 등록에 실패했습니다.' });
  }
});

// 학생 정보 수정
app.put('/api/students/:id', (req, res) => {
  try {
    const updated = db.updateStudent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: '학생을 찾을 수 없습니다.' });
    }
    res.json({ success: true, student: updated, message: '학생 정보가 수정되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '학생 수정에 실패했습니다.' });
  }
});

// 학생 삭제
app.delete('/api/students/:id', (req, res) => {
  try {
    const success = db.deleteStudent(req.params.id);
    res.json({ success, message: success ? '학생이 삭제되었습니다.' : '학생을 찾을 수 없습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '학생 삭제에 실패했습니다.' });
  }
});

// 학생 목록 일괄 동기화 (클라이언트 상태 보존 및 Vercel 다중 인스턴스 동기화)
app.post('/api/students/sync', (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students)) {
      return res.status(400).json({ success: false, message: '학생 배열이 필요합니다.' });
    }
    const synced = db.syncStudents(students);
    res.json({ success: true, count: synced.length, students: synced, message: '학생 목록이 동기화되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '학생 목록 동기화 실패' });
  }
});

// 학생 계좌 초기화 (전체 또는 개별)
app.post('/api/students/reset', (req, res) => {
  try {
    const { studentId, seedMoney } = req.body;
    db.resetStudentPortfolio(studentId || null, seedMoney || null);
    res.json({ success: true, message: studentId ? '해당 학생의 계좌가 초기화되었습니다.' : '전체 학생의 계좌가 초기화되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '계좌 초기화에 실패했습니다.' });
  }
});

// ================== 모의 주식 거래 체결 API ==================

app.post('/api/trade', async (req, res) => {
  try {
    const { studentId, type, stockCode, stockName, count, price } = req.body;

    const settings = db.getSettings();
    if (!settings.allowTrading) {
      return res.status(400).json({ success: false, message: '현재 선생님이 거래를 일시 중지했습니다.' });
    }

    if (!studentId || !type || !stockCode || !count || !price) {
      return res.status(400).json({ success: false, message: '필수 거래 정보가 누락되었습니다.' });
    }

    const result = db.executeTrade(studentId, {
      type,
      stockCode,
      stockName,
      count,
      price
    });

    res.json({
      success: true,
      message: `${type === 'BUY' ? '매수' : '매도'} 주문이 정상 체결되었습니다!`,
      student: result.student,
      trade: result.tradeLog
    });
  } catch (err) {
    console.error('Trade error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ================== 학급 랭킹 API ==================

app.get('/api/leaderboard', async (req, res) => {
  try {
    const settings = db.getSettings();
    const stocks = await stockService.getAllStocksWithPrices(settings.customStocks || []);
    const priceMap = {};
    stocks.forEach(s => { priceMap[s.code] = s.price; });

    const leaderboard = db.getLeaderboard(priceMap);
    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error('GET /leaderboard error:', err);
    res.status(500).json({ success: false, message: '랭킹을 계산하지 못했습니다.' });
  }
});

// ================== 관리자 인증 및 설정 API ==================

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const isMatch = db.verifyAdmin(password);
  if (isMatch) {
    res.json({ success: true, message: '관리자로 로그인되었습니다.' });
  } else {
    res.status(401).json({ success: false, message: '관리자 비밀번호가 올바르지 않습니다.' });
  }
});

app.get('/api/admin/settings', (req, res) => {
  const settings = db.getSettings();
  res.json({ success: true, settings });
});

app.put('/api/admin/settings', (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated, message: '설정이 저장되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '설정 저장에 실패했습니다.' });
  }
});

// 정적 파일 서빙 (프로덕션 빌드 연동 시)
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA Fallback: 모든 미처리 GET 요청은 client/dist/index.html로 전달
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 10초마다 자동 가격 변동 체크 (설정된 분 주기에 도달한 커스텀 종목 자동 갱신)
setInterval(() => {
  try {
    db.triggerRandomFluctuation(null, false);
  } catch (e) {
    console.error('Auto fluctuation check error:', e.message);
  }
}, 10000);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Classroom Stock Server is running on port ${PORT}`);
  });
}

module.exports = app;
