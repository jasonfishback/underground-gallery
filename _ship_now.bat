@echo off
setlocal

set "OUTER=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery"
set "INNER=%OUTER%\underground-gallery"
set "MIG=drizzle\0009_vehicle_name.sql"

echo =====================================================
echo  SHIP: search fix + name feature + mojibake + design polish
echo  Step 1: apply 0009_vehicle_name migration to live DB
echo  Step 2: commit and push code (Vercel auto-deploys)
echo =====================================================
echo.

echo --- migration SQL (drizzle/0009_vehicle_name.sql) ---
type "%INNER%\%MIG%"
echo --- end SQL ---
echo.

set /p OK1="Apply migration to live DB now? (y/N): "
if /i not "%OK1%"=="y" (
  echo Aborted.
  pause
  exit /b 0
)

cd /d "%INNER%"
call node scripts/apply-migration.mjs "%MIG%"
if errorlevel 1 (
  echo [ERROR] migration failed. NOT pushing code.
  pause
  exit /b 1
)

echo.
echo Migration OK. Staging code changes...
cd /d "%OUTER%"

git add underground-gallery/lib/db/schema.ts
git add underground-gallery/lib/validation/race.ts
git add underground-gallery/app/garage/actions.ts
git add underground-gallery/components/garage/AddCarWizard.tsx
git add underground-gallery/app/globals.css
git add underground-gallery/public/landing.html

echo.
echo --- staged ---
git diff --cached --stat
echo --- end ---
echo.

set /p OK2="Commit + push? (y/N): "
if /i not "%OK2%"=="y" (
  echo Aborted. Code unstaged via git reset.
  git reset HEAD
  pause
  exit /b 0
)

git commit -m "Vehicle search + name feature + mojibake fix + iOS-frosted design polish" -m "AddCarWizard: now queries catalog AND NHTSA in parallel, dedupes by year/make/model, so '2017 ford' surfaces F-150/F-350/Mustang/Fusion/etc. instead of just the lone Focus RS in the curated catalog. vehicles.name: drizzle/0009 migration adds the column; schema/validation/actions/wizard all plumb it through (optional, max 40 chars). Restored Name input in confirm + manual steps. landing.html: replaced UTF-8 mojibake (â† -> left arrow, â”€ -> box drawings, â€¦ -> ellipsis) caused by double-encoding. globals.css: new design tokens for frosted-glass/iOS-style depth (modal, buttons, inputs, cards, banners, list rows). AddCarWizard restyled with the new tokens (.ug-modal, .ug-input, .ug-btn-primary, .ug-list)."
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
echo =====================================================
echo  Pushed. Vercel auto-deploys in ~90 seconds.
echo  Watch: https://vercel.com/jasonfishback-5845s-projects/underground-gallery
echo =====================================================
pause
