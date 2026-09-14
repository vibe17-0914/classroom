const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');

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
  marketStatus: 'OPEN',
  allowTrading: true,
  autoFluctuateCustom: false,
  fluctuationIntervalMinutes: 3,
  fluctuationRangePercent: 5,
  customStocks: []
};

let globalData = global._classroomData || null;

// ================== DB 매퍼 헬퍼 ==================

function toStudentObj(row) {
  if (!row) return null;
  return {
    id: row.id,
    studentNo: Number(row.student_no),
    name: row.name,
    pin: row.pin || '1234',
    seedMoney: Number(row.seed_money || 1000000),
    cash: Number(row.cash !== undefined ? row.cash : (row.seed_money || 1000000)),
    portfolio: typeof row.portfolio === 'object' && row.portfolio !== null ? row.portfolio : {},
    tradeHistory: Array.isArray(row.trade_history) ? row.trade_history : []
  };
}

function toStudentRow(student) {
  return {
    id: student.id,
    student_no: Number(student.studentNo),
    name: student.name,
    pin: student.pin || '1234',
    seed_money: Number(student.seedMoney || 1000000),
    cash: Number(student.cash !== undefined ? student.cash : 1000000),
    portfolio: student.portfolio || {},
    trade_history: student.tradeHistory || [],
    updated_at: new Date().toISOString()
  };
}

function toSettingsObj(row) {
  if (!row) return DEFAULT_SETTINGS;
  return {
    adminPassword: row.admin_password || DEFAULT_SETTINGS.adminPassword,
    defaultSeedMoney: Number(row.default_seed_money || DEFAULT_SETTINGS.defaultSeedMoney),
    marketStatus: row.market_status || DEFAULT_SETTINGS.marketStatus,
    allowTrading: row.allow_trading !== undefined ? !!row.allow_trading : DEFAULT_SETTINGS.allowTrading,
    autoFluctuateCustom: row.auto_fluctuate_custom !== undefined ? !!row.auto_fluctuate_custom : DEFAULT_SETTINGS.autoFluctuateCustom,
    fluctuationIntervalMinutes: Number(row.fluctuation_interval_minutes || DEFAULT_SETTINGS.fluctuationIntervalMinutes),
    fluctuationRangePercent: Number(row.fluctuation_range_percent || DEFAULT_SETTINGS.fluctuationRangePercent),
    customStocks: Array.isArray(row.custom_stocks) ? row.custom_stocks : []
  };
}

function toSettingsRow(settings) {
  return {
    id: 'global',
    admin_password: settings.adminPassword || 'admin',
    default_seed_money: Number(settings.defaultSeedMoney || 1000000),
    market_status: settings.marketStatus || 'OPEN',
    allow_trading: settings.allowTrading !== undefined ? !!settings.allowTrading : true,
    auto_fluctuate_custom: !!settings.autoFluctuateCustom,
    fluctuation_interval_minutes: Number(settings.fluctuationIntervalMinutes || 3),
    fluctuation_range_percent: Number(settings.fluctuationRangePercent || 5),
    custom_stocks: settings.customStocks || [],
    updated_at: new Date().toISOString()
  };
}

// ================== 로컬 파일 캐시 관리 ==================

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

// ================== 학생 관리 (비동기 / Supabase 우선) ==================

async function getStudents() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('student_no', { ascending: true });
      if (!error && Array.isArray(data)) {
        const students = data.map(toStudentObj);
        const current = loadData();
        current.students = students;
        saveData(current);
        return students;
      } else if (error) {
        console.error('Supabase getStudents error:', error.message);
      }
    } catch (e) {
      console.error('Supabase getStudents exception:', e.message);
    }
  }
  const local = loadData();
  return local.students;
}

async function getStudentById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        return toStudentObj(data);
      }
    } catch (e) {
      console.error('Supabase getStudentById exception:', e.message);
    }
  }
  const data = loadData();
  return data.students.find(s => s.id === id) || null;
}

async function addStudent(studentData) {
  const currentStudents = await getStudents();
  const nextNo = studentData.studentNo || (currentStudents.length > 0 ? Math.max(...currentStudents.map(s => s.studentNo || 0)) + 1 : 1);
  const settings = await getSettings();

  const newStudent = {
    id: 'stu-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    studentNo: Number(nextNo),
    name: studentData.name.trim(),
    pin: studentData.pin || '1234',
    seedMoney: Number(studentData.seedMoney || settings.defaultSeedMoney || 1000000),
    cash: Number(studentData.seedMoney || settings.defaultSeedMoney || 1000000),
    portfolio: {},
    tradeHistory: []
  };

  if (supabase) {
    try {
      const { error } = await supabase
        .from('students')
        .insert([toStudentRow(newStudent)]);
      if (error) console.error('Supabase addStudent error:', error.message);
    } catch (e) {
      console.error('Supabase addStudent exception:', e.message);
    }
  }

  const local = loadData();
  local.students.push(newStudent);
  local.students.sort((a, b) => a.studentNo - b.studentNo);
  saveData(local);
  return newStudent;
}

async function batchAddStudents(lines, defaultSeed = 1000000) {
  const currentStudents = await getStudents();
  let currentMaxNo = currentStudents.length > 0 ? Math.max(...currentStudents.map(s => s.studentNo || 0)) : 0;
  const added = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

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

    const existingIndex = currentStudents.findIndex(s => s.studentNo === no);
    if (existingIndex >= 0) {
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
    currentStudents.push(student);
    added.push(student);
  }

  if (supabase && added.length > 0) {
    try {
      const rows = added.map(toStudentRow);
      const { error } = await supabase.from('students').insert(rows);
      if (error) console.error('Supabase batchAddStudents error:', error.message);
    } catch (e) {
      console.error('Supabase batchAddStudents exception:', e.message);
    }
  }

  const local = loadData();
  local.students = currentStudents;
  local.students.sort((a, b) => a.studentNo - b.studentNo);
  saveData(local);
  return added;
}

async function updateStudent(id, updates) {
  const student = await getStudentById(id);
  if (!student) return null;

  const updatedStudent = {
    ...student,
    name: updates.name !== undefined ? updates.name.trim() : student.name,
    studentNo: updates.studentNo !== undefined ? Number(updates.studentNo) : student.studentNo,
    pin: updates.pin !== undefined ? updates.pin : student.pin,
    seedMoney: updates.seedMoney !== undefined ? Number(updates.seedMoney) : student.seedMoney,
    cash: updates.cash !== undefined ? Number(updates.cash) : student.cash
  };

  if (supabase) {
    try {
      const { error } = await supabase
        .from('students')
        .update(toStudentRow(updatedStudent))
        .eq('id', id);
      if (error) console.error('Supabase updateStudent error:', error.message);
    } catch (e) {
      console.error('Supabase updateStudent exception:', e.message);
    }
  }

  const local = loadData();
  const idx = local.students.findIndex(s => s.id === id);
  if (idx !== -1) {
    local.students[idx] = updatedStudent;
    local.students.sort((a, b) => a.studentNo - b.studentNo);
    saveData(local);
  }
  return updatedStudent;
}

async function verifyStudentLogin(identifier, pin) {
  const students = await getStudents();
  const student = students.find(s => s.id === identifier || String(s.studentNo) === String(identifier));
  if (!student) {
    throw new Error('해당 번호의 학생을 찾을 수 없습니다.');
  }
  const currentPin = student.pin || '1234';
  if (String(currentPin).trim() !== String(pin).trim()) {
    throw new Error('비밀번호가 올바르지 않습니다. (초기 비밀번호: 1234)');
  }
  return student;
}

async function updateStudentPin(id, newPin) {
  if (!newPin || String(newPin).trim().length < 2) {
    throw new Error('비밀번호는 최소 2자리 이상이어야 합니다.');
  }
  const student = await getStudentById(id);
  if (!student) {
    throw new Error('학생을 찾을 수 없습니다.');
  }
  student.pin = String(newPin).trim();

  if (supabase) {
    try {
      await supabase.from('students').update({ pin: student.pin, updated_at: new Date().toISOString() }).eq('id', id);
    } catch (e) {
      console.error('Supabase updateStudentPin exception:', e.message);
    }
  }

  const local = loadData();
  const idx = local.students.findIndex(s => s.id === id);
  if (idx !== -1) {
    local.students[idx].pin = student.pin;
    saveData(local);
  }
  return student;
}

async function resetStudentPin(id, defaultPin = '1234') {
  return await updateStudentPin(id, defaultPin);
}

async function resetAllStudentPins(defaultPin = '1234') {
  if (supabase) {
    try {
      await supabase.from('students').update({ pin: String(defaultPin), updated_at: new Date().toISOString() }).neq('id', '');
    } catch (e) {
      console.error('Supabase resetAllStudentPins exception:', e.message);
    }
  }
  const local = loadData();
  local.students.forEach(s => {
    s.pin = String(defaultPin);
  });
  saveData(local);
  return local.students.length;
}

async function deleteStudent(id) {
  if (supabase) {
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) console.error('Supabase deleteStudent error:', error.message);
    } catch (e) {
      console.error('Supabase deleteStudent exception:', e.message);
    }
  }
  const local = loadData();
  const beforeLen = local.students.length;
  local.students = local.students.filter(s => String(s.id) !== String(id));
  saveData(local);
  return local.students.length < beforeLen;
}

async function syncStudents(studentsList) {
  if (!Array.isArray(studentsList)) return [];

  if (supabase && studentsList.length > 0) {
    try {
      const rows = studentsList.map(toStudentRow);
      const { error } = await supabase.from('students').upsert(rows);
      if (error) console.error('Supabase syncStudents upsert error:', error.message);
    } catch (e) {
      console.error('Supabase syncStudents exception:', e.message);
    }
  }

  const local = loadData();
  local.students = studentsList;
  local.students.sort((a, b) => (Number(a.studentNo) || 0) - (Number(b.studentNo) || 0));
  saveData(local);
  return local.students;
}

async function resetStudentPortfolio(id = null, newSeed = null) {
  const settings = await getSettings();
  const seed = newSeed !== null ? Number(newSeed) : settings.defaultSeedMoney;

  if (id) {
    const student = await getStudentById(id);
    if (student) {
      student.seedMoney = seed;
      student.cash = seed;
      student.portfolio = {};
      student.tradeHistory = [];

      if (supabase) {
        try {
          await supabase.from('students').update(toStudentRow(student)).eq('id', id);
        } catch (e) {}
      }

      const local = loadData();
      const idx = local.students.findIndex(s => s.id === id);
      if (idx !== -1) {
        local.students[idx] = student;
        saveData(local);
      }
    }
  } else {
    // 전체 학생 초기화
    const students = await getStudents();
    students.forEach(student => {
      student.seedMoney = seed;
      student.cash = seed;
      student.portfolio = {};
      student.tradeHistory = [];
    });

    if (supabase && students.length > 0) {
      try {
        const rows = students.map(toStudentRow);
        await supabase.from('students').upsert(rows);
      } catch (e) {}
    }

    const local = loadData();
    local.students = students;
    saveData(local);
  }
  return true;
}

// ================== 거래 체결 시스템 ==================

async function executeTrade(studentId, tradeRequest) {
  const { type, stockCode, stockName, count, price } = tradeRequest;
  const tradeCount = parseInt(count, 10);
  const tradePrice = parseInt(price, 10);

  if (isNaN(tradeCount) || tradeCount <= 0) {
    throw new Error('주문 수량은 1주 이상이어야 합니다.');
  }
  if (isNaN(tradePrice) || tradePrice <= 0) {
    throw new Error('유효한 주가가 아닙니다.');
  }

  const student = await getStudentById(studentId);
  if (!student) {
    throw new Error('학생 정보를 찾을 수 없습니다.');
  }

  const totalAmount = tradeCount * tradePrice;

  if (type === 'BUY') {
    if (student.cash < totalAmount) {
      throw new Error(`보유 현금이 부족합니다. (필요: ${totalAmount.toLocaleString()}원, 보유: ${student.cash.toLocaleString()}원)`);
    }

    student.cash -= totalAmount;

    student.portfolio = student.portfolio || {};
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
    student.portfolio = student.portfolio || {};
    const existing = student.portfolio[stockCode];
    if (!existing || existing.count < tradeCount) {
      const currentCount = existing ? existing.count : 0;
      throw new Error(`보유 주식이 부족합니다. (보유: ${currentCount}주, 주문: ${tradeCount}주)`);
    }

    student.cash += totalAmount;

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

  const tradeLog = {
    id: 'tr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    type: type,
    stockCode: stockCode,
    stockName: stockName,
    price: tradePrice,
    count: tradeCount,
    total: totalAmount,
    timestamp: new Date().toISOString()
  };

  student.tradeHistory = student.tradeHistory || [];
  student.tradeHistory.unshift(tradeLog);

  if (supabase) {
    try {
      const { error } = await supabase
        .from('students')
        .update(toStudentRow(student))
        .eq('id', studentId);
      if (error) console.error('Supabase executeTrade error:', error.message);
    } catch (e) {
      console.error('Supabase executeTrade exception:', e.message);
    }
  }

  const local = loadData();
  const idx = local.students.findIndex(s => s.id === studentId);
  if (idx !== -1) {
    local.students[idx] = student;
    saveData(local);
  }

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

async function getLeaderboard(stockPriceMap = {}) {
  const students = await getStudents();
  const ranked = students.map(s => {
    const assetInfo = calculateStudentTotalAsset(s, stockPriceMap);
    return {
      id: s.id,
      studentNo: s.studentNo,
      name: s.name,
      ...assetInfo
    };
  });

  ranked.sort((a, b) => b.profitRate - a.profitRate);

  return ranked.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

// ================== 관리자 및 종목 관리 ==================

async function getSettings() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();
      if (!error && data) {
        const settings = toSettingsObj(data);
        const local = loadData();
        local.settings = settings;
        saveData(local);
        return settings;
      }
    } catch (e) {
      console.error('Supabase getSettings exception:', e.message);
    }
  }
  const data = loadData();
  return data.settings;
}

async function updateSettings(newSettings) {
  const current = await getSettings();
  const updated = {
    ...current,
    ...newSettings
  };

  if (supabase) {
    try {
      const row = toSettingsRow(updated);
      const { error } = await supabase.from('settings').upsert(row);
      if (error) console.error('Supabase updateSettings error:', error.message);
    } catch (e) {
      console.error('Supabase updateSettings exception:', e.message);
    }
  }

  const local = loadData();
  local.settings = updated;
  saveData(local);
  return updated;
}

async function verifyAdmin(password) {
  const settings = await getSettings();
  return settings.adminPassword === password;
}

async function saveCustomStock(stockData) {
  const settings = await getSettings();
  settings.customStocks = settings.customStocks || [];

  const index = settings.customStocks.findIndex(s => s.code === stockData.code);
  if (index >= 0) {
    settings.customStocks[index] = {
      ...settings.customStocks[index],
      ...stockData
    };
  } else {
    settings.customStocks.push(stockData);
  }

  await updateSettings({ customStocks: settings.customStocks });
  return stockData;
}

async function updateCustomStockPrice(code, newPrice, reason = '', extraOpts = {}) {
  const settings = await getSettings();
  settings.customStocks = settings.customStocks || [];

  const targetPrice = parseInt(newPrice, 10);
  if (isNaN(targetPrice) || targetPrice <= 0) {
    throw new Error('올바른 가격을 입력해주세요.');
  }

  let index = settings.customStocks.findIndex(s => s.code === code);
  let stock;

  if (index >= 0) {
    stock = settings.customStocks[index];
  } else {
    stock = {
      code,
      name: code,
      isManualPrice: true,
      manualPrice: targetPrice,
      basePrice: targetPrice,
      priceHistory: []
    };
    settings.customStocks.push(stock);
    index = settings.customStocks.length - 1;
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
  if (stock.priceHistory.length > 30) {
    stock.priceHistory.shift();
  }

  settings.customStocks[index] = stock;
  await updateSettings({ customStocks: settings.customStocks });
  return stock;
}

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

async function triggerRandomFluctuation(targetCode = null, force = false) {
  const settings = await getSettings();
  const globalAuto = !!settings.autoFluctuateCustom;
  const globalInterval = Number(settings.fluctuationIntervalMinutes || 3);
  const globalRange = Number(settings.fluctuationRangePercent || 5);
  const now = Date.now();

  const customStocks = settings.customStocks || [];
  const updatedStocks = [];

  for (let i = 0; i < customStocks.length; i++) {
    const stock = customStocks[i];
    if (stock.deleted) continue;

    const isTarget = targetCode ? stock.code === targetCode : true;
    if (!isTarget) continue;

    const isAutoOn = stock.autoFluctuate !== undefined ? stock.autoFluctuate : globalAuto;
    if (!isAutoOn && !force) continue;

    const intervalMin = stock.fluctuateInterval ? Number(stock.fluctuateInterval) : globalInterval;
    const intervalMs = Math.max(0.5, intervalMin) * 60 * 1000;
    const lastFluct = stock.lastFluctuatedAt ? new Date(stock.lastFluctuatedAt).getTime() : 0;

    if (!force && (now - lastFluct < intervalMs)) {
      continue;
    }

    const range = stock.fluctuateRange ? Number(stock.fluctuateRange) : globalRange;
    const curPrice = stock.manualPrice || stock.price || 10000;

    let percentDelta = (Math.random() * (range * 2) - range);
    if (Math.abs(percentDelta) < 0.5) {
      percentDelta = percentDelta >= 0 ? 0.8 : -0.8;
    }

    let nextPrice = Math.round(curPrice * (1 + percentDelta / 100));
    nextPrice = Math.max(100, Math.round(nextPrice / 10) * 10);
    if (nextPrice === curPrice) {
      nextPrice = percentDelta > 0 ? curPrice + 10 : Math.max(100, curPrice - 10);
    }

    const newsList = nextPrice > curPrice ? RISE_NEWS : FALL_NEWS;
    const randomNews = newsList[Math.floor(Math.random() * newsList.length)];

    stock.lastFluctuatedAt = new Date().toISOString();
    const updated = await updateCustomStockPrice(stock.code, nextPrice, randomNews);
    updatedStocks.push(updated);
  }

  return updatedStocks;
}

async function deleteCustomStock(code) {
  const settings = await getSettings();
  settings.customStocks = settings.customStocks || [];
  const index = settings.customStocks.findIndex(s => s.code === code);
  if (index >= 0) {
    settings.customStocks[index].deleted = true;
  } else {
    settings.customStocks.push({ code, deleted: true });
  }
  await updateSettings({ customStocks: settings.customStocks });
  return true;
}

async function restoreDefaultStocks() {
  await updateSettings({ customStocks: [] });
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
