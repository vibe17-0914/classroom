const fs = require('fs');
const path = require('path');

const DATA_FILE = process.env.VERCEL
  ? path.join('/tmp', 'store.json')
  : path.join(__dirname, 'data', 'store.json');

const BUNDLED_FILE = path.join(__dirname, 'data', 'store.json');

// 기본 학생 목록
const DEFAULT_STUDENTS = [
  { id: 'stu-1', studentNo: 1, name: '김민준', pin: '1234', seedMoney: 1000000, cash: 1000000, portfolio: {}, tradeHistory: [] },
  { id: 'stu-2', studentNo: 2, name: '이서연', pin: '1234', seedMoney: 1000000, cash: 1000000, portfolio: {}, tradeHistory: [] },
  { id: 'stu-3', studentNo: 3, name: '박도윤', pin: '1234', seedMoney: 1000000, cash: 1000000, portfolio: {}, tradeHistory: [] },
  { id: 'stu-4', studentNo: 4, name: '정예은', pin: '1234', seedMoney: 1000000, cash: 1000000, portfolio: {}, tradeHistory: [] },
  { id: 'stu-5', studentNo: 5, name: '최현우', pin: '1234', seedMoney: 1000000, cash: 1000000, portfolio: {}, tradeHistory: [] },
  { id: 'stu-6', studentNo: 6, name: '강지민', pin: '1234', seedMoney: 1000000, cash: 1000000, portfolio: {}, tradeHistory: [] },
  { id: 'stu-7', studentNo: 7, name: '윤서진', pin: '1234', seedMoney: 1000000, cash: 1000000, portfolio: {}, tradeHistory: [] },
  { id: 'stu-8', studentNo: 8, name: '한수빈', pin: '1234', seedMoney: 1000000, cash: 1000000, portfolio: {}, tradeHistory: [] },
  { id: 'stu-9', studentNo: 9, name: '오준서', pin: '1234', seedMoney: 1000000, cash: 1000000, portfolio: {}, tradeHistory: [] },
  { id: 'stu-10', studentNo: 10, name: '송다은', pin: '1234', seedMoney: 1000000, cash: 1000000, portfolio: {}, tradeHistory: [] }
];

const DEFAULT_SETTINGS = {
  adminPassword: 'admin',
  defaultSeedMoney: 1000000,
  marketStatus: 'OPEN', // OPEN or CLOSED
  allowTrading: true,
  autoFluctuateCustom: false, // 커스텀 종목 랜덤 자동 변동
  fluctuationIntervalMinutes: 3, // 변동 주기 (분)
  fluctuationRangePercent: 5, // 최대 변동률 (+-5%)
  customStocks: []
};

let globalData = global._classroomData || null;

// DB 초기화 및 읽기
function loadData() {
  if (globalData) {
    return globalData;
  }
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      globalData = {
        students: Array.isArray(parsed.students) ? parsed.students : DEFAULT_STUDENTS,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
      };
      global._classroomData = globalData;
      return globalData;
    }

    if (process.env.VERCEL && fs.existsSync(BUNDLED_FILE)) {
      try {
        const bundledContent = fs.readFileSync(BUNDLED_FILE, 'utf-8');
        const parsed = JSON.parse(bundledContent);
        globalData = {
          students: Array.isArray(parsed.students) ? parsed.students : DEFAULT_STUDENTS,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
        };
        global._classroomData = globalData;
        saveData(globalData);
        return globalData;
      } catch (e) {}
    }

    const initialData = {
      students: DEFAULT_STUDENTS,
      settings: DEFAULT_SETTINGS
    };
    globalData = initialData;
    global._classroomData = globalData;
    saveData(initialData);
    return initialData;
  } catch (err) {
    console.error('Error loading DB file:', err);
    if (!globalData) {
      globalData = { students: DEFAULT_STUDENTS, settings: DEFAULT_SETTINGS };
      global._classroomData = globalData;
    }
    return globalData;
  }
}

// DB 저장
function saveData(data) {
  globalData = data;
  global._classroomData = data;
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

// ================== 학생 관리 ==================

function getStudents() {
  const data = loadData();
  return data.students;
}

function getStudentById(id) {
  const data = loadData();
  return data.students.find(s => s.id === id) || null;
}

function addStudent(studentData) {
  const data = loadData();
  const nextNo = studentData.studentNo || (data.students.length > 0 ? Math.max(...data.students.map(s => s.studentNo || 0)) + 1 : 1);
  const newStudent = {
    id: 'stu-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    studentNo: Number(nextNo),
    name: studentData.name.trim(),
    pin: studentData.pin || '1234',
    seedMoney: Number(studentData.seedMoney || data.settings.defaultSeedMoney || 1000000),
    cash: Number(studentData.seedMoney || data.settings.defaultSeedMoney || 1000000),
    portfolio: {},
    tradeHistory: []
  };
  data.students.push(newStudent);
  // 번호순 정렬
  data.students.sort((a, b) => a.studentNo - b.studentNo);
  saveData(data);
  return newStudent;
}

// 일괄 학생 등록 (여러 줄 텍스트: "1번 김철수" 또는 "김철수" 등)
function batchAddStudents(lines, defaultSeed = 1000000) {
  const data = loadData();
  let currentMaxNo = data.students.length > 0 ? Math.max(...data.students.map(s => s.studentNo || 0)) : 0;
  const added = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // 번호와 이름 파싱 시도 (예: "1. 김철수", "1 김철수", "김철수")
    const match = line.match(/^(\d+)[\.\s번\-:]+\s*(.+)$/);
    let no, name;
    if (match) {
      no = parseInt(match[1], 10);
      name = match[2].trim();
    } else {
      currentMaxNo += 1;
      no = currentMaxNo;
      name = line;
    }

    // 중복 번호 체크
    const existingIndex = data.students.findIndex(s => s.studentNo === no);
    if (existingIndex >= 0) {
      // 이미 번호가 있으면 이름만 갱신하거나 새 번호 부여
      currentMaxNo += 1;
      no = currentMaxNo;
    }

    const student = {
      id: 'stu-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      studentNo: no,
      name: name,
      pin: '1234',
      seedMoney: Number(defaultSeed),
      cash: Number(defaultSeed),
      portfolio: {},
      tradeHistory: []
    };
    data.students.push(student);
    added.push(student);
  }

  data.students.sort((a, b) => a.studentNo - b.studentNo);
  saveData(data);
  return added;
}

function updateStudent(id, updates) {
  const data = loadData();
  const index = data.students.findIndex(s => s.id === id);
  if (index === -1) return null;

  const current = data.students[index];
  data.students[index] = {
    ...current,
    name: updates.name !== undefined ? updates.name.trim() : current.name,
    studentNo: updates.studentNo !== undefined ? Number(updates.studentNo) : current.studentNo,
    pin: updates.pin !== undefined ? updates.pin : current.pin,
    seedMoney: updates.seedMoney !== undefined ? Number(updates.seedMoney) : current.seedMoney,
    cash: updates.cash !== undefined ? Number(updates.cash) : current.cash
  };
  data.students.sort((a, b) => a.studentNo - b.studentNo);
  saveData(data);
  return data.students[index];
}

// 학생 로그인 검증
function verifyStudentLogin(identifier, pin) {
  const data = loadData();
  // identifier는 id 또는 studentNo
  const student = data.students.find(s => s.id === identifier || String(s.studentNo) === String(identifier));
  if (!student) {
    throw new Error('해당 번호의 학생을 찾을 수 없습니다.');
  }
  const currentPin = student.pin || '1234';
  if (String(currentPin).trim() !== String(pin).trim()) {
    throw new Error('비밀번호가 올바르지 않습니다. (초기 비밀번호: 1234)');
  }
  return student;
}

// 학생 비밀번호 변경
function updateStudentPin(id, newPin) {
  const data = loadData();
  const student = data.students.find(s => s.id === id);
  if (!student) {
    throw new Error('학생을 찾을 수 없습니다.');
  }
  if (!newPin || String(newPin).trim().length < 2) {
    throw new Error('비밀번호는 최소 2자리 이상이어야 합니다.');
  }
  student.pin = String(newPin).trim();
  saveData(data);
  return student;
}

// 학생 비밀번호 단일 초기화
function resetStudentPin(id, defaultPin = '1234') {
  return updateStudentPin(id, defaultPin);
}

// 전체 학생 비밀번호 일괄 초기화
function resetAllStudentPins(defaultPin = '1234') {
  const data = loadData();
  data.students.forEach(s => {
    s.pin = String(defaultPin);
  });
  saveData(data);
  return data.students.length;
}

function deleteStudent(id) {
  const data = loadData();
  const beforeLen = data.students.length;
  data.students = data.students.filter(s => String(s.id) !== String(id));
  saveData(data);
  return data.students.length < beforeLen;
}

// 전체 학생 목록 동기화 (클라이언트/서버리스 상태 보존)
function syncStudents(studentsList) {
  if (!Array.isArray(studentsList)) return [];
  const data = loadData();
  data.students = studentsList;
  data.students.sort((a, b) => (Number(a.studentNo) || 0) - (Number(b.studentNo) || 0));
  saveData(data);
  return data.students;
}

// 모든 학생 또는 특정 학생 시드머니 조정 및 잔고 초기화
function resetStudentPortfolio(id = null, newSeed = null) {
  const data = loadData();
  const seed = newSeed !== null ? Number(newSeed) : data.settings.defaultSeedMoney;

  if (id) {
    const student = data.students.find(s => s.id === id);
    if (student) {
      student.seedMoney = seed;
      student.cash = seed;
      student.portfolio = {};
      student.tradeHistory = [];
    }
  } else {
    // 전체 학생 초기화
    data.students.forEach(student => {
      student.seedMoney = seed;
      student.cash = seed;
      student.portfolio = {};
      student.tradeHistory = [];
    });
  }
  saveData(data);
  return true;
}

// ================== 거래 체결 시스템 ==================

function executeTrade(studentId, tradeRequest) {
  const { type, stockCode, stockName, count, price } = tradeRequest;
  const tradeCount = parseInt(count, 10);
  const tradePrice = parseInt(price, 10);

  if (isNaN(tradeCount) || tradeCount <= 0) {
    throw new Error('주문 수량은 1주 이상이어야 합니다.');
  }
  if (isNaN(tradePrice) || tradePrice <= 0) {
    throw new Error('유효한 주가가 아닙니다.');
  }

  const data = loadData();
  const student = data.students.find(s => s.id === studentId);
  if (!student) {
    throw new Error('학생 정보를 찾을 수 없습니다.');
  }

  const totalAmount = tradeCount * tradePrice;

  if (type === 'BUY') {
    if (student.cash < totalAmount) {
      throw new Error(`보유 현금이 부족합니다. (필요: ${totalAmount.toLocaleString()}원, 보유: ${student.cash.toLocaleString()}원)`);
    }

    // 현금 차감
    student.cash -= totalAmount;

    // 포트폴리오 갱신
    if (!student.portfolio[stockCode]) {
      student.portfolio[stockCode] = {
        code: stockCode,
        name: stockName,
        count: tradeCount,
        avgPrice: tradePrice,
        totalSpent: totalAmount
      };
    } else {
      const existing = student.portfolio[stockCode];
      const newTotalSpent = existing.totalSpent + totalAmount;
      const newCount = existing.count + tradeCount;
      existing.count = newCount;
      existing.totalSpent = newTotalSpent;
      existing.avgPrice = Math.round(newTotalSpent / newCount);
      existing.name = stockName || existing.name;
    }

  } else if (type === 'SELL') {
    const existing = student.portfolio[stockCode];
    if (!existing || existing.count < tradeCount) {
      const currentCount = existing ? existing.count : 0;
      throw new Error(`보유 주식이 부족합니다. (보유: ${currentCount}주, 주문: ${tradeCount}주)`);
    }

    // 현금 증가
    student.cash += totalAmount;

    // 포트폴리오 차감
    const remainingCount = existing.count - tradeCount;
    if (remainingCount === 0) {
      delete student.portfolio[stockCode];
    } else {
      existing.count = remainingCount;
      existing.totalSpent = Math.round(existing.avgPrice * remainingCount);
    }
  } else {
    throw new Error('올바르지 않은 거래 유형입니다. (BUY 또는 SELL)');
  }

  // 거래 내역 기록
  const tradeLog = {
    id: 'tr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    type: type, // 'BUY' | 'SELL'
    stockCode: stockCode,
    stockName: stockName,
    price: tradePrice,
    count: tradeCount,
    total: totalAmount,
    timestamp: new Date().toISOString()
  };

  student.tradeHistory = student.tradeHistory || [];
  student.tradeHistory.unshift(tradeLog);

  saveData(data);
  return {
    student,
    tradeLog
  };
}

// ================== 학급 랭킹 산출 ==================

function calculateStudentTotalAsset(student, stockPriceMap) {
  let stockValuation = 0;
  if (student.portfolio) {
    for (const [code, item] of Object.entries(student.portfolio)) {
      const currentPrice = stockPriceMap[code] !== undefined ? stockPriceMap[code] : item.avgPrice;
      stockValuation += currentPrice * item.count;
    }
  }
  const totalAsset = student.cash + stockValuation;
  const seedMoney = student.seedMoney || 1000000;
  const profit = totalAsset - seedMoney;
  const profitRate = seedMoney > 0 ? ((profit / seedMoney) * 100) : 0;

  return {
    totalAsset,
    stockValuation,
    cash: student.cash,
    seedMoney,
    profit,
    profitRate: parseFloat(profitRate.toFixed(2))
  };
}

function getLeaderboard(stockPriceMap = {}) {
  const data = loadData();
  const ranked = data.students.map(s => {
    const assetInfo = calculateStudentTotalAsset(s, stockPriceMap);
    return {
      id: s.id,
      studentNo: s.studentNo,
      name: s.name,
      ...assetInfo
    };
  });

  // 수익률 높은 순서 정렬
  ranked.sort((a, b) => b.profitRate - a.profitRate);

  return ranked.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

// ================== 관리자 및 종목 관리 ==================

function getSettings() {
  const data = loadData();
  return data.settings;
}

function updateSettings(newSettings) {
  const data = loadData();
  data.settings = {
    ...data.settings,
    ...newSettings
  };
  saveData(data);
  return data.settings;
}

function verifyAdmin(password) {
  const data = loadData();
  return data.settings.adminPassword === password;
}

// 종목 추가 / 수정 / 삭제
function saveCustomStock(stockData) {
  const data = loadData();
  data.settings.customStocks = data.settings.customStocks || [];

  const index = data.settings.customStocks.findIndex(s => s.code === stockData.code);
  if (index >= 0) {
    data.settings.customStocks[index] = {
      ...data.settings.customStocks[index],
      ...stockData
    };
  } else {
    data.settings.customStocks.push(stockData);
  }

  saveData(data);
  return stockData;
}

// 커스텀 종목 가격 변동
function updateCustomStockPrice(code, newPrice, reason = '', extraOpts = {}) {
  const data = loadData();
  data.settings.customStocks = data.settings.customStocks || [];

  const targetPrice = parseInt(newPrice, 10);
  if (isNaN(targetPrice) || targetPrice <= 0) {
    throw new Error('올바른 가격을 입력해주세요.');
  }

  let index = data.settings.customStocks.findIndex(s => s.code === code);
  let stock;

  if (index >= 0) {
    stock = data.settings.customStocks[index];
  } else {
    // 만약 기존 KOSPI 종목을 수동 변경하는 경우 신규 커스텀 엔트리로 등록
    stock = {
      code,
      name: code,
      isManualPrice: true,
      manualPrice: targetPrice,
      basePrice: targetPrice,
      priceHistory: []
    };
    data.settings.customStocks.push(stock);
    index = data.settings.customStocks.length - 1;
  }

  const prevPrice = stock.manualPrice || stock.basePrice || targetPrice;
  const change = targetPrice - prevPrice;
  const changeRate = prevPrice > 0 ? parseFloat(((change / prevPrice) * 100).toFixed(2)) : 0;
  const changeDirection = change > 0 ? 'RISE' : (change < 0 ? 'FALL' : 'EVEN');

  const now = new Date();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const historyItem = {
    date: dateStr,
    fullDate: now.toISOString().slice(0, 10),
    close: targetPrice,
    open: prevPrice,
    high: Math.max(prevPrice, targetPrice),
    low: Math.min(prevPrice, targetPrice),
    volume: Math.floor(Math.random() * 100000) + 10000,
    reason: reason || '관리자 가격 변동'
  };

  stock.isManualPrice = true;
  stock.previousPrice = prevPrice;
  stock.manualPrice = targetPrice;
  stock.change = change;
  stock.changeRate = changeRate;
  stock.changeDirection = changeDirection;
  stock.lastReason = reason || stock.lastReason || '';
  stock.lastUpdated = now.toISOString();

  if (extraOpts.autoFluctuate !== undefined) {
    stock.autoFluctuate = !!extraOpts.autoFluctuate;
  }
  if (extraOpts.fluctuateInterval !== undefined) {
    stock.fluctuateInterval = Number(extraOpts.fluctuateInterval) || 3;
  }
  if (extraOpts.fluctuateRange !== undefined) {
    stock.fluctuateRange = Number(extraOpts.fluctuateRange) || 5;
  }

  stock.priceHistory = stock.priceHistory || [];
  stock.priceHistory.push(historyItem);
  // 최대 30개 이력 보존
  if (stock.priceHistory.length > 30) {
    stock.priceHistory.shift();
  }

  data.settings.customStocks[index] = stock;
  saveData(data);
  return stock;
}

// 자동/랜덤 가격 변동 처리
const RISE_NEWS = [
  '📈 신제품 판매 돌풍 및 실적 호조',
  '📈 대규모 공급 계약 체결 소식',
  '📈 신기술 특허 취득 및 시장 호평',
  '📈 기관/외국인 매수세 대거 유입',
  '📈 긍정적인 실적 전망 리포트 발표',
  '📈 정부 정책 수혜 기대감 확대'
];

const FALL_NEWS = [
  '📉 단기 급등에 따른 차익 실현 매물 출회',
  '📉 원자재 가격 급등으로 수익성 악화 우려',
  '📉 주요 거래처 주문 축소 우려',
  '📉 시장 변동성 확대로 인한 투자 심리 위축',
  '📉 글로벌 경기 불확실성 지속',
  '📉 업계 경쟁 심화로 인한 단가 인하 압박'
];

function triggerRandomFluctuation(targetCode = null, force = false) {
  const data = loadData();
  const settings = data.settings || {};
  const globalAuto = !!settings.autoFluctuateCustom;
  const globalInterval = Number(settings.fluctuationIntervalMinutes || 3);
  const globalRange = Number(settings.fluctuationRangePercent || 5);
  const now = Date.now();

  const customStocks = settings.customStocks || [];
  const updatedStocks = [];

  for (let i = 0; i < customStocks.length; i++) {
    const stock = customStocks[i];
    if (stock.deleted) continue;

    // 특정 종목 대상이거나, 자동 변동이 켜진 종목
    const isTarget = targetCode ? stock.code === targetCode : true;
    if (!isTarget) continue;

    const isAutoOn = stock.autoFluctuate !== undefined ? stock.autoFluctuate : globalAuto;
    if (!isAutoOn && !force) continue;

    const intervalMin = stock.fluctuateInterval ? Number(stock.fluctuateInterval) : globalInterval;
    const intervalMs = Math.max(0.5, intervalMin) * 60 * 1000;
    const lastFluct = stock.lastFluctuatedAt ? new Date(stock.lastFluctuatedAt).getTime() : 0;

    // 주기 도달 여부 체크 (강제 실행이 아닐 경우)
    if (!force && (now - lastFluct < intervalMs)) {
      continue;
    }

    const range = stock.fluctuateRange ? Number(stock.fluctuateRange) : globalRange;
    const curPrice = stock.manualPrice || stock.price || 10000;

    // 랜덤 퍼센트 생성 (-range ~ +range, 0 제외)
    let percentDelta = (Math.random() * (range * 2) - range);
    if (Math.abs(percentDelta) < 0.5) {
      percentDelta = percentDelta >= 0 ? 0.8 : -0.8;
    }

    let nextPrice = Math.round(curPrice * (1 + percentDelta / 100));
    // 10원 단위로 반올림
    nextPrice = Math.max(100, Math.round(nextPrice / 10) * 10);
    if (nextPrice === curPrice) {
      nextPrice = percentDelta > 0 ? curPrice + 10 : Math.max(100, curPrice - 10);
    }

    // 뉴스 사유 선택
    const newsList = nextPrice > curPrice ? RISE_NEWS : FALL_NEWS;
    const randomNews = newsList[Math.floor(Math.random() * newsList.length)];

    stock.lastFluctuatedAt = new Date().toISOString();
    const updated = updateCustomStockPrice(stock.code, nextPrice, randomNews);
    updatedStocks.push(updated);
  }

  return updatedStocks;
}

function deleteCustomStock(code) {
  const data = loadData();
  data.settings.customStocks = data.settings.customStocks || [];
  // 소프트 삭제 또는 삭제 플래그
  const index = data.settings.customStocks.findIndex(s => s.code === code);
  if (index >= 0) {
    data.settings.customStocks[index].deleted = true;
  } else {
    data.settings.customStocks.push({ code, deleted: true });
  }
  saveData(data);
  return true;
}

function restoreDefaultStocks() {
  const data = loadData();
  data.settings.customStocks = [];
  saveData(data);
  return true;
}

module.exports = {
  loadData,
  saveData,
  getStudents,
  getStudentById,
  addStudent,
  batchAddStudents,
  updateStudent,
  deleteStudent,
  syncStudents,
  resetStudentPortfolio,
  executeTrade,
  calculateStudentTotalAsset,
  getLeaderboard,
  getSettings,
  updateSettings,
  verifyAdmin,
  verifyStudentLogin,
  updateStudentPin,
  resetStudentPin,
  resetAllStudentPins,
  saveCustomStock,
  updateCustomStockPrice,
  triggerRandomFluctuation,
  deleteCustomStock,
  restoreDefaultStocks
};
