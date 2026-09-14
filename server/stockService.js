const https = require('https');

// 인메모리 캐시
let cachedStocks = [];
let lastFetchTime = 0;
const CACHE_TTL = 3000; // 3초 캐시

// 숫자로 변환 헬퍼 (쉼표 제거)
function parseNumber(val) {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/,/g, '').trim();
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

// 네이버 금융 KOSPI 시가총액 상위 20개 조회
async function fetchKospiTop20() {
  const url = 'https://m.stock.naver.com/api/stocks/marketValue/KOSPI?page=1&pageSize=20';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch KOSPI top 20: ${response.status}`);
  }

  const data = await response.json();
  const rawList = data.stocks || [];

  return rawList.map((item, index) => {
    const currentPrice = parseNumber(item.closePrice);
    const changeAmount = parseNumber(item.compareToPreviousClosePrice);
    const changeRate = parseFloat(item.fluctuationsRatio || '0');
    // fluctuationCode: 2(상승), 5(하락), 3(보합), 등
    const changeDirection = item.fluctuationsRatio?.startsWith('-') ? 'FALL' : (changeRate > 0 ? 'RISE' : 'EVEN');

    return {
      code: item.itemCode,
      name: item.stockName,
      price: currentPrice,
      change: changeAmount,
      changeRate: changeRate,
      changeDirection: changeDirection,
      marketCap: item.marketValue, // 시가총액 표시용
      accumulatedTradingVolume: parseNumber(item.accumulatedTradingVolume),
      rank: index + 1,
      isKospiTop20: true,
      lastUpdated: new Date().toISOString()
    };
  });
}

// 개별 종목 실제 시세 조회 (종목코드로 조회)
async function fetchStockDetail(itemCode) {
  try {
    const basicUrl = `https://m.stock.naver.com/api/stock/${itemCode}/basic`;
    const res = await fetch(basicUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.stockName) return null;

    const currentPrice = parseNumber(data.closePrice);
    const changeAmount = parseNumber(data.compareToPreviousClosePrice);
    const changeRate = parseFloat(data.fluctuationsRatio || '0');
    const changeDirection = data.fluctuationsRatio?.startsWith('-') ? 'FALL' : (changeRate > 0 ? 'RISE' : 'EVEN');

    return {
      code: itemCode,
      name: data.stockName,
      price: currentPrice,
      change: changeAmount,
      changeRate: changeRate,
      changeDirection: changeDirection,
      marketCap: data.marketValue || '-',
      accumulatedTradingVolume: parseNumber(data.accumulatedTradingVolume),
      highPrice: parseNumber(data.highPrice),
      lowPrice: parseNumber(data.lowPrice),
      openPrice: parseNumber(data.openPrice),
      lastUpdated: new Date().toISOString()
    };
  } catch (err) {
    console.error(`Error fetching stock detail for ${itemCode}:`, err.message);
    return null;
  }
}

// 개별 종목 일별 주가 차트 조회 (최근 20~30일)
async function fetchStockChart(itemCode, customStocks = []) {
  try {
    // 커스텀 종목인지 확인
    const custom = customStocks.find(s => s.code === itemCode && s.isManualPrice);
    if (custom && custom.priceHistory && custom.priceHistory.length > 0) {
      return custom.priceHistory;
    }

    const chartUrl = `https://m.stock.naver.com/api/stock/${itemCode}/price?range=day`;
    const res = await fetch(chartUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      if (custom) {
        return [{
          date: '시작가',
          fullDate: new Date().toISOString().slice(0, 10),
          close: custom.manualPrice || 10000,
          open: custom.manualPrice || 10000,
          high: custom.manualPrice || 10000,
          low: custom.manualPrice || 10000,
          volume: 10000
        }];
      }
      return [];
    }
    const rawData = await res.json();
    if (!Array.isArray(rawData)) return [];

    // 역순 정렬 (오래된 날짜 -> 최근 날짜)
    return rawData.slice(0, 30).reverse().map(item => ({
      date: item.localDate ? `${item.localDate.slice(4, 6)}/${item.localDate.slice(6, 8)}` : item.localDate,
      fullDate: item.localDate,
      close: parseNumber(item.closePrice),
      open: parseNumber(item.openPrice),
      high: parseNumber(item.highPrice),
      low: parseNumber(item.lowPrice),
      volume: parseNumber(item.accumulatedTradingVolume)
    }));
  } catch (err) {
    console.error(`Error fetching stock chart for ${itemCode}:`, err.message);
    return [];
  }
}

// 종합 종목 목록 반환 (KOSPI 상위 20 + 관리자 추가 종목 결합)
async function getAllStocksWithPrices(customStocks = []) {
  const now = Date.now();
  if (now - lastFetchTime > CACHE_TTL || cachedStocks.length === 0) {
    try {
      cachedStocks = await fetchKospiTop20();
      lastFetchTime = now;
    } catch (err) {
      console.error('Error refreshing KOSPI top 20:', err.message);
      // 실패 시 기존 캐시 유지
    }
  }

  // 관리자 커스텀/추가 종목 처리
  const stockMap = new Map();
  // KOSPI 상위 20 먼저 맵에 등록
  for (const s of cachedStocks) {
    stockMap.set(s.code, { ...s });
  }

  // 관리자가 추가/수정한 종목 병합
  for (const custom of customStocks) {
    if (custom.deleted) {
      stockMap.delete(custom.code);
      continue;
    }

    if (stockMap.has(custom.code)) {
      // 기존 종목에 관리자 커스텀 메타데이터 오버라이드
      const existing = stockMap.get(custom.code);
      stockMap.set(custom.code, {
        ...existing,
        name: custom.name || existing.name,
        description: custom.description || existing.description,
        pinned: custom.pinned || false,
        disabled: custom.disabled || false
      });
    } else {
      // KOSPI 20에 없는 추가 종목
      // 실시간 시세 조회가 필요한 경우
      let priceInfo = null;
      if (custom.isManualPrice) {
        priceInfo = {
          price: custom.manualPrice || 10000,
          change: custom.change !== undefined ? custom.change : 0,
          changeRate: custom.changeRate !== undefined ? custom.changeRate : 0,
          changeDirection: custom.changeDirection || 'EVEN'
        };
      } else {
        priceInfo = await fetchStockDetail(custom.code);
      }

      stockMap.set(custom.code, {
        code: custom.code,
        name: custom.name || (priceInfo?.name || '신규 종목'),
        price: custom.isManualPrice ? (custom.manualPrice || 10000) : (priceInfo?.price || custom.manualPrice || 10000),
        change: custom.isManualPrice ? (custom.change || 0) : (priceInfo?.change || 0),
        changeRate: custom.isManualPrice ? (custom.changeRate || 0) : (priceInfo?.changeRate || 0),
        changeDirection: custom.isManualPrice ? (custom.changeDirection || 'EVEN') : (priceInfo?.changeDirection || 'EVEN'),
        marketCap: priceInfo?.marketCap || '학급 모의 종목',
        accumulatedTradingVolume: priceInfo?.accumulatedTradingVolume || 50000,
        description: custom.description || '학급 관리자가 추가한 종목',
        isCustom: true,
        isManualPrice: !!custom.isManualPrice,
        priceHistory: custom.priceHistory || [],
        lastReason: custom.lastReason || '',
        autoFluctuate: custom.autoFluctuate !== undefined ? !!custom.autoFluctuate : false,
        fluctuateInterval: custom.fluctuateInterval !== undefined ? Number(custom.fluctuateInterval) : 3,
        fluctuateRange: custom.fluctuateRange !== undefined ? Number(custom.fluctuateRange) : 5,
        disabled: custom.disabled || false,
        pinned: custom.pinned || false,
        lastUpdated: custom.lastUpdated || new Date().toISOString()
      });
    }
  }

  return Array.from(stockMap.values());
}

module.exports = {
  fetchKospiTop20,
  fetchStockDetail,
  fetchStockChart,
  getAllStocksWithPrices
};
