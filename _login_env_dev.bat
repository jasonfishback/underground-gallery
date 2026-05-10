@echo off
setlocal

set "APP=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery\underground-gallery"

echo =====================================================
echo  Vercel login (if needed) + env pull + npm run dev
echo  App: %APP%
echo =====================================================

REM ── Add npm global bin to PATH so freshly installed `vercel` is reachable ──
for /f "tokens=* delims=" %%P in ('npm config get prefix 2^>nul') do set "NPM_PREFIX=%%P"
if defined NPM_PREFIX (
  echo Adding npm global bin to PATH: %NPM_PREFIX%
  set "PATH=%NPM_PREFIX%;%PATH%"
) else (
  echo [WARN] could not read npm prefix
)
echo.

cd /d "%APP%" || (echo Cannot cd & pause & exit /b 1)

echo === Verifying vercel CLI ===
where vercel
if errorlevel 1 (
  echo [ERROR] vercel still not found. Trying default location...
  if exist "%APPDATA%\npm\vercel.cmd" (
    set "PATH=%APPDATA%\npm;%PATH%"
    echo Added %APPDATA%\npm to PATH.
    where vercel
  )
)
where vercel >nul 2>nul
if errorlevel 1 (
  echo [ERROR] vercel CLI is not installed. Run _env.bat first.
  pause
  exit /b 1
)

call vercel --version
echo.

echo === Checking Vercel auth ===
call vercel whoami 2>nul
if errorlevel 1 (
  echo.
  echo ----------------------------------------------------
  echo  Not logged in. Running 'vercel login' below.
  echo  A browser tab will open. Sign in with the same
  echo  account that owns prj_E1Zv3KKi3udpxAoTqiarVwmgdF9o.
  echo ----------------------------------------------------
  call vercel login
  if errorlevel 1 (
    echo [ERROR] vercel login failed.
    pause
    exit /b 1
  )
)

echo.
echo === Pulling env vars (development) ===
call vercel env pull .env.local --environment=development --yes
if errorlevel 1 (
  echo [WARN] development pull failed. Trying preview...
  call vercel env pull .env.local --environment=preview --yes
)
if errorlevel 1 (
  echo [WARN] preview pull failed. Trying production...
  call vercel env pull .env.local --environment=production --yes
)
if errorlevel 1 (
  echo [ERROR] All env pulls failed. Stopping.
  pause
  exit /b 1
)

if not exist .env.local (
  echo [ERROR] .env.local was not created.
  pause
  exit /b 1
)

echo.
echo === .env.local created ===
for %%I in (.env.local) do echo size: %%~zI bytes

echo.
echo === Starting Next.js dev server ===
echo Open http://localhost:3000 in your browser.
echo Press Ctrl+C in this window to stop.
echo.
call npm run dev
