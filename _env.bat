@echo off
setlocal

set "APP=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery\underground-gallery"
set "LOG=%TEMP%\underground-gallery-env.log"

echo =====================================================
echo Pull Vercel env vars into .env.local
echo App: %APP%
echo Log: %LOG%
echo =====================================================

cd /d "%APP%" || (echo Cannot cd & pause & exit /b 1)

echo === checking Vercel CLI ===
where vercel >nul 2>nul
if errorlevel 1 (
  echo Installing Vercel CLI globally...
  call npm install -g vercel >> "%LOG%" 2>&1
  if errorlevel 1 (
    echo [ERROR] Could not install vercel CLI. Tail of log:
    powershell -NoProfile -Command "Get-Content -Tail 30 '%LOG%'"
    pause
    exit /b 1
  )
)
vercel --version

echo.
echo === seeding .vercel\project.json so we skip interactive link ===
if not exist ".vercel" mkdir ".vercel"
> .vercel\project.json (
  echo {
  echo   "projectId": "prj_E1Zv3KKi3udpxAoTqiarVwmgdF9o",
  echo   "orgId": "team_sSGerDPkWUnpnqV1oLzmIOtl"
  echo }
)
type .vercel\project.json

echo.
echo === pulling env (development environment) ===
call vercel env pull .env.local --environment=development --yes >> "%LOG%" 2>&1
if errorlevel 1 (
  echo.
  echo [WARN] dev env pull failed. Trying preview...
  call vercel env pull .env.local --environment=preview --yes >> "%LOG%" 2>&1
)
if errorlevel 1 (
  echo.
  echo [WARN] preview env pull failed. Trying production...
  call vercel env pull .env.local --environment=production --yes >> "%LOG%" 2>&1
)
if errorlevel 1 (
  echo.
  echo [ERROR] All env pulls failed. You probably need to log in once:
  echo   vercel login
  echo   ^(opens browser; sign in with the same account that owns the Vercel project^)
  echo Then re-run this script.
  echo.
  echo Tail of log:
  powershell -NoProfile -Command "Get-Content -Tail 30 '%LOG%'"
  pause
  exit /b 1
)

echo.
if exist .env.local (
  echo === .env.local created. ===
  for %%I in (.env.local) do echo size: %%~zI bytes
  findstr /B /C:"DATABASE_URL" /C:"AUTH_SECRET" /C:"RESEND_API_KEY" /C:"GOOGLE_PLACES_API_KEY" /C:"NEXT_PUBLIC_" .env.local 2>nul | for /f "tokens=1,2 delims==" %%a in ('more') do @echo   %%a = ^<set^>
) else (
  echo [WARN] .env.local was not created.
)

echo.
echo Done. Run _dev.bat next.
pause
