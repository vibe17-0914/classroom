@echo off
chcp 65001 > nul
title 우리 반 모의 주식 거래소 경제교실

echo ========================================================
echo   📈 우리 반 모의 주식 거래소 (KOSPI 실시간 연동) 실행기
echo ========================================================
echo.

set "PATH=C:\Program Files\nodejs;%PATH%"

echo 1. 백엔드 서버 시작 중 (포트 5000)...
start "모의주식-백엔드" cmd /c "cd /d "%~dp0server" && node index.js"

echo 2. 프론트엔드 웹 서버 시작 중 (포트 5173)...
start "모의주식-프론트엔드" cmd /c "cd /d "%~dp0client" && npm run dev"

timeout /t 3 > nul
echo.
echo 3. 웹 브라우저를 엽니다...
start http://localhost:5173

echo.
echo ========================================================
echo   실행이 완료되었습니다!
echo   브라우저 주소: http://localhost:5173
echo   선생님 관리자 기본 비밀번호: admin
echo ========================================================
pause
