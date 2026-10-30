@echo off
setlocal
cd /d "%~dp0"
echo ============================================
echo VoiceConnect P2P - Windows build
echo ============================================
where node >nul 2>nul || (echo ERROR: Install Node.js 20 LTS from https://nodejs.org/ & exit /b 1)
where npm >nul 2>nul || (echo ERROR: npm was not found. & exit /b 1)
for /f "tokens=1" %%v in ('node -p "process.versions.node.split('.')[0]"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 20 (echo ERROR: Node.js 20 or newer is required.& exit /b 1)
if not exist node_modules\ (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)
echo Checking source syntax...
call npm test
if errorlevel 1 exit /b 1
echo Packaging Windows NSIS installer, MSI package and portable executable...
call npm run build:win
if errorlevel 1 exit /b 1
echo.
echo SUCCESS. Check the dist\ directory.
exit /b 0
