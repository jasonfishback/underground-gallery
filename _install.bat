@echo off
setlocal

set "APP=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery\underground-gallery"
set "LOG=%TEMP%\underground-gallery-install.log"

echo =====================================================
echo Underground Gallery - install deps in app folder
echo App: %APP%
echo Log: %LOG%
echo =====================================================

cd /d "%APP%" || (echo Cannot cd to %APP% & pause & exit /b 1)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm not on PATH. Install Node.js then re-run.
  pause
  exit /b 1
)

echo === Running npm install (may take a few minutes) ===
call npm install > "%LOG%" 2>&1
if errorlevel 1 (
  echo [ERROR] npm install failed. Tail of log:
  powershell -NoProfile -Command "Get-Content -Tail 60 '%LOG%'"
  pause
  exit /b 1
)

echo === npm install OK ===
echo.

if exist "%APP%\.env.local" (
  echo .env.local already present.
) else (
  echo NOTE: %APP%\.env.local does not exist. Claude will create one next.
)

echo.
echo === DONE. node_modules installed. ===
echo You can close this window.
pause
