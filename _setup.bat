@echo off
setlocal enabledelayedexpansion

set "TARGET=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery"
set "TEMP_CLONE=%TEMP%\ug-clone-%RANDOM%%RANDOM%"
set "LOG=%TEMP%\underground-gallery-setup.log"

echo ========================================================
echo Underground Gallery - one-click local setup
echo Target: %TARGET%
echo Log:    %LOG%
echo ========================================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git is not on PATH. Install Git for Windows or open Git Bash once and re-run.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not on PATH. Install Node.js from https://nodejs.org and re-run.
  pause
  exit /b 1
)

echo === Cloning to temp folder: %TEMP_CLONE% ===
git clone https://github.com/jasonfishback/underground-gallery.git "%TEMP_CLONE%" > "%LOG%" 2>&1
if errorlevel 1 (
  echo [ERROR] git clone failed. Log:
  type "%LOG%"
  pause
  exit /b 1
)
echo Clone OK.

echo.
echo === Moving files into "%TARGET%" ===
robocopy "%TEMP_CLONE%" "%TARGET%" /E /MOVE /XF _setup.bat >> "%LOG%" 2>&1
rem robocopy exit codes 0-7 are success
if errorlevel 8 (
  echo [ERROR] robocopy reported errors. Log:
  type "%LOG%"
  pause
  exit /b 1
)
echo Move OK.

echo.
echo === Installing dependencies ===
cd /d "%TARGET%"
call npm install >> "%LOG%" 2>&1
if errorlevel 1 (
  echo [WARN] npm install had warnings/errors. Tail of log:
  powershell -NoProfile -Command "Get-Content -Tail 40 '%LOG%'"
  pause
  exit /b 1
)
echo Install OK.

echo.
echo ========================================================
echo  DONE. Project is in %TARGET%
echo  Log: %LOG%
echo  You can close this window.
echo ========================================================
pause
