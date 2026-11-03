@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo ERROR: Install Node.js 20 LTS. & exit /b 1)
if not exist node_modules\ call npm install
if errorlevel 1 exit /b 1
call npm run desktop
