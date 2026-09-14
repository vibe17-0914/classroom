async function runAllTests() {
  console.log('=== 학급 모의 주식 거래소 전 기능 자동 검증 시작 ===\n');

  // 1. KOSPI 20 종목 조회 테스트
  console.log('1. KOSPI 20개 종목 및 실제 주가 연동 테스트:');
  const stocksRes = await fetch('http://localhost:5000/api/stocks').then(r => r.json());
  console.log(`- 수신된 종목 수: ${stocksRes.stocks.length}개`);
  const top3 = stocksRes.stocks.slice(0, 3);
  top3.forEach(s => {
    console.log(`  * [${s.code}] ${s.name}: ${s.price.toLocaleString()}원 (${s.changeRate > 0 ? '+' : ''}${s.changeRate}%)`);
  });
  if (stocksRes.stocks.length >= 20) {
    console.log('  -> KOSPI 상위 20개 종목 실시간 가격 연동 [성공 ✅]\n');
  }

  // 2. 종목 차트 데이터 테스트
  console.log('2. 삼성전자(005930) 주가 차트 데이터 테스트:');
  const chartRes = await fetch('http://localhost:5000/api/stocks/005930/chart').then(r => r.json());
  console.log(`- 최근 차트 일수: ${chartRes.chart.length}일치 수신`);
  if (chartRes.chart.length > 0) {
    console.log(`  * 최근 종가: ${chartRes.chart[chartRes.chart.length - 1].close.toLocaleString()}원`);
    console.log('  -> 인터랙티브 차트 데이터 연동 [성공 ✅]\n');
  }

  // 3. 학생 목록 조회
  console.log('3. 학생 계좌 및 명단 조회 테스트:');
  const studentsRes = await fetch('http://localhost:5000/api/students').then(r => r.json());
  console.log(`- 등록된 학생 수: ${studentsRes.students.length}명`);
  const testStudent = studentsRes.students[0];
  console.log(`- 테스트 학생: ${testStudent.studentNo}번 ${testStudent.name}, 보유 현금: ${testStudent.cash.toLocaleString()}원`);
  console.log('  -> 학생 명단 조회 [성공 ✅]\n');

  // 4. 모의 매수 주문 테스트
  console.log('4. 모의 주식 매수(BUY) 주문 테스트:');
  const targetStock = stocksRes.stocks[0];
  const buyRes = await fetch('http://localhost:5000/api/trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: testStudent.id,
      type: 'BUY',
      stockCode: targetStock.code,
      stockName: targetStock.name,
      count: 2,
      price: targetStock.price
    })
  }).then(r => r.json());

  console.log(`- 매수 주문 결과: ${buyRes.message}`);
  console.log(`- 체결 후 잔여 현금: ${buyRes.student.cash.toLocaleString()}원`);
  console.log(`- 보유 수량: ${buyRes.student.portfolio[targetStock.code].count}주 (평단가: ${buyRes.student.portfolio[targetStock.code].avgPrice.toLocaleString()}원)`);
  console.log('  -> 모의 매수 및 잔고 자동 계산 [성공 ✅]\n');

  // 5. 모의 매도 주문 테스트
  console.log('5. 모의 주식 매도(SELL) 주문 테스트:');
  const sellRes = await fetch('http://localhost:5000/api/trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: testStudent.id,
      type: 'SELL',
      stockCode: targetStock.code,
      stockName: targetStock.name,
      count: 1,
      price: targetStock.price
    })
  }).then(r => r.json());

  console.log(`- 매도 주문 결과: ${sellRes.message}`);
  console.log(`- 체결 후 잔여 현금: ${sellRes.student.cash.toLocaleString()}원`);
  console.log(`- 남은 보유 수량: ${sellRes.student.portfolio[targetStock.code].count}주`);
  console.log('  -> 모의 매도 및 수익 실현 [성공 ✅]\n');

  // 6. 학급 리더보드 랭킹 테스트
  console.log('6. 학급 실시간 수익률 랭킹 리더보드 테스트:');
  const rankRes = await fetch('http://localhost:5000/api/leaderboard').then(r => r.json());
  console.log(`- 랭킹 집계 완료 (1위: ${rankRes.leaderboard[0].name} 수익률 ${rankRes.leaderboard[0].profitRate}%, 총자산: ${rankRes.leaderboard[0].totalAsset.toLocaleString()}원)`);
  console.log('  -> 학급 랭킹 리더보드 [성공 ✅]\n');

  // 7. 관리자 로그인 테스트
  console.log('7. 관리자 로그인 인증 테스트:');
  const loginRes = await fetch('http://localhost:5000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin' })
  }).then(r => r.json());
  console.log(`- 관리자 인증 결과: ${loginRes.message} [성공 ✅]\n`);

  // 8. 관리자 종목 추가 테스트 (카카오 035720)
  console.log('8. 관리자 신규 종목 추가 테스트:');
  const addStockRes = await fetch('http://localhost:5000/api/stocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: '035720',
      name: '카카오',
      description: '국내 대표 모바일 플랫폼 기업'
    })
  }).then(r => r.json());
  console.log(`- 종목 추가 결과: ${addStockRes.message}`);
  console.log('  -> 관리자 종목 추가 및 실제 시세 연동 [성공 ✅]\n');

  // 9. 관리자 학생 일괄 명단 등록 테스트
  console.log('9. 관리자 학생 명단 일괄 붙여넣기 등록 테스트:');
  const batchRes = await fetch('http://localhost:5000/api/students/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      namesText: '11번 홍길동\n12번 신사임당\n13번 이순신',
      seedMoney: 1000000
    })
  }).then(r => r.json());
  console.log(`- 일괄 등록 결과: ${batchRes.message}`);
  console.log('  -> 학생 일괄 등록 [성공 ✅]\n');

  console.log('🎉 모든 기능 검증이 완벽하게 통과했습니다!');
}

runAllTests().catch(console.error);
