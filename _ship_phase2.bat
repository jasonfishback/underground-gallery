@echo off
setlocal

set "OUTER=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery"

cd /d "%OUTER%" || (echo Cannot cd & pause & exit /b 1)

echo =====================================================
echo  Phase 2 ship: NHTSA fix + site-wide design polish
echo =====================================================
echo.

git add underground-gallery/app/api/vehicle-data/search/route.ts
git add underground-gallery/components/SiteHeader.tsx
git add underground-gallery/components/me/MeView.tsx
git add underground-gallery/app/auth/signin/page.tsx
git add underground-gallery/public/landing.html

echo --- staged ---
git diff --cached --stat
echo --- end ---
echo.

set /p OK="Commit + push? (y/N): "
if /i not "%OK%"=="y" (
  echo Aborted. Resetting.
  git reset HEAD
  pause
  exit /b 0
)

git commit -m "Phase 2: site-wide iOS-frosted polish + fix NHTSA hyphen-aware search" -m "vehicle-data/search: NHTSA model names use hyphens (F-250 SD); user query 'f250' had no hyphen so .includes() missed. Now normalize both sides (strip non-alphanumeric, lowercase) before substring match. SiteHeader: stronger frosted-glass, inner highlight, accent dot before wordmark, pill-shaped + INVITE primary button. MeView garage: vehicle list now uses .ug-card (frosted, hover lift), thumbnail has rounded corners + soft shadow, primary button uses .ug-btn ug-btn-primary. auth/signin: full restyle with .ug-glass card, gradient backdrop with subtle red glow, .ug-input-lg, success banner shows where the email went. landing.html: residual mojibake (Â© -> ©) fixed."
if errorlevel 1 (
  echo [ERROR] commit failed.
  pause
  exit /b 1
)

git push origin main
if errorlevel 1 (
  echo [ERROR] push failed.
  pause
  exit /b 1
)

echo.
echo Pushed. Vercel auto-deploys in ~90 seconds.
echo Hard-refresh undergroundgallery.ai/me after to bypass cache.
pause
