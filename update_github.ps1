[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "GitHub 저장소 업데이트 - vibe17-0914/classroom"

$gitDir = "$env:LOCALAPPDATA\Programs\Git\cmd"
$ghDir = "$env:LOCALAPPDATA\Programs\GitHubCLI"
$env:Path = "$gitDir;$ghDir;$env:Path"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "     우리 반 경제교육 플랫폼 GitHub 업로더          " -ForegroundColor Cyan
Write-Host "     저장소: https://github.com/vibe17-0914/classroom" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

$gitExe = "$gitDir\git.exe"
$ghExe = "$ghDir\gh.exe"

# 1. 파일 변경사항 확인 및 커밋
Write-Host "[1/3] 변경된 소스코드 확인 및 커밋 중..." -ForegroundColor Yellow
& $gitExe add .
$changes = & $gitExe status --porcelain
if ($changes) {
    & $gitExe commit -m "update: 학급 모의 주식 플랫폼 최신 업데이트"
    Write-Host " -> 최신 변경 사항이 로컬 커밋되었습니다." -ForegroundColor Green
} else {
    Write-Host " -> 로컬 변경 사항이 이미 모두 커밋되어 있습니다." -ForegroundColor Gray
}

Write-Host ""
# 2. GitHub 로그인 상태 확인
Write-Host "[2/3] GitHub 로그인(인증) 상태 확인 중..." -ForegroundColor Yellow
$authCheck = & $ghExe auth status 2>&1
$isLoggedIn = ($LASTEXITCODE -eq 0)

if (-not $isLoggedIn) {
    Write-Host ""
    Write-Host "※ 최초 1회 GitHub 브라우저 로그인이 필요합니다!" -ForegroundColor Magenta
    Write-Host "  잠시 후 브라우저가 열리면 화면에 표시되는 일회용 코드를 입력하고" -ForegroundColor White
    Write-Host "  [Authorize / 승인] 버튼을 눌러주시면 됩니다." -ForegroundColor White
    Write-Host ""
    Write-Host "엔터(Enter) 키를 누르면 브라우저 로그인을 시작합니다..." -ForegroundColor Yellow
    Read-Host
    
    & $ghExe auth login -h github.com -p https -w
    & $ghExe auth setup-git
} else {
    Write-Host " -> GitHub 계정이 이미 성공적으로 인증되어 있습니다." -ForegroundColor Green
    & $ghExe auth setup-git
}

Write-Host ""
# 3. GitHub으로 Push
Write-Host "[3/3] GitHub 저장소(main 브랜치)로 업로드(Push) 중..." -ForegroundColor Yellow
& $gitExe push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host " [성공] GitHub에 모든 코드가 업로드되었습니다! 🎉" -ForegroundColor Green
    Write-Host " 주소: https://github.com/vibe17-0914/classroom" -ForegroundColor Green
    Write-Host "=====================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Red
    Write-Host " [실패] 업로드 중 오류가 발생했습니다." -ForegroundColor Red
    Write-Host " 네트워크 연결이나 로그인 승인 상태를 확인해 주세요." -ForegroundColor Yellow
    Write-Host "=====================================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "아무 키나 누르면 창이 닫힙니다..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
