@echo off
setlocal enabledelayedexpansion

set "APP=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery\underground-gallery"

echo =====================================================
echo  Pull production env + start dev with localhost URLs
echo  Prereq: stop any running dev server (Ctrl+C its window)
echo =====================================================

REM Add npm global bin to PATH so vercel CLI is reachable
for /f "tokens=* delims=" %%P in ('npm config get prefix 2^>nul') do set "NPM_PREFIX=%%P"
if defined NPM_PREFIX set "PATH=!NPM_PREFIX!;!PATH!"

cd /d "%APP%" || (echo Cannot cd & pause & exit /b 1)

where vercel >nul 2>nul
if errorlevel 1 (
  echo [ERROR] vercel CLI missing.
  pause
  exit /b 1
)

echo === Pulling .env.local from PRODUCTION environment ===
call vercel env pull .env.local --environment=production --yes
if errorlevel 1 (
  echo [ERROR] vercel env pull failed.
  pause
  exit /b 1
)
echo.

echo === Overriding URL vars to localhost (so magic links return locally) ===
REM strip out any existing URL vars then append local ones
powershell -NoProfile -Command "& { $f='.env.local'; $lines = Get-Content $f | Where-Object { $_ -notmatch '^(AUTH_URL|NEXTAUTH_URL|AUTH_TRUST_HOST|NEXT_PUBLIC_SITE_URL|NEXT_PUBLIC_APP_URL)\s*=' }; $lines += @( '', '# --- local dev overrides ---', 'AUTH_URL=\"http://localhost:3000\"', 'NEXTAUTH_URL=\"http://localhost:3000\"', 'AUTH_TRUST_HOST=\"true\"', 'NEXT_PUBLIC_SITE_URL=\"http://localhost:3000\"', 'NEXT_PUBLIC_APP_URL=\"http://localhost:3000\"' ); Set-Content -Path $f -Value $lines -Encoding utf8 }"

echo .env.local refreshed. Quick sanity check (key names only, no values):
findstr /B /C:"RESEND_API_KEY" /C:"AUTH_SECRET" /C:"AUTH_URL" /C:"DATABASE_URL" /C:"GOOGLE_PLACES_API_KEY" /C:"ADMIN_EMAILS" .env.local | for /f "tokens=1 delims==" %%a in ('more') do @echo   %%a found

echo.
echo === Starting Next.js dev server ===
echo Open http://localhost:3000 in your browser.
echo Magic link emails will redirect back to localhost:3000 for sign-in.
echo Press Ctrl+C to stop.
echo.
call npm run dev
