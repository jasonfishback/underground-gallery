@echo off
setlocal

set "APP=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery\underground-gallery"

cd /d "%APP%" || (echo Cannot cd & pause & exit /b 1)

if not exist node_modules (
  echo node_modules missing - run _install.bat first.
  pause
  exit /b 1
)
if not exist .env.local (
  echo .env.local missing - run _env.bat first.
  pause
  exit /b 1
)

echo Starting Next.js dev server. Open http://localhost:3000 in your browser.
echo Press Ctrl+C in this window to stop.
echo.
call npm run dev
