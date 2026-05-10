@echo off
setlocal

set "OUTER=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery"
set "INNER=%OUTER%\underground-gallery"
set "MIG=drizzle\0009_vehicle_name.sql"

echo =====================================================
echo  Ship vehicles.name feature
echo  Step 1: apply migration to live Neon DB
echo  Step 2: commit and push code that uses it
echo =====================================================
echo.

echo --- migration SQL ---
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
echo Migration OK. Now staging code changes...
cd /d "%OUTER%"
git add underground-gallery/lib/db/schema.ts
git add underground-gallery/lib/validation/race.ts
git add underground-gallery/app/garage/actions.ts
git add underground-gallery/components/garage/AddCarWizard.tsx

echo.
echo --- staged ---
git diff --cached --stat
echo --- end ---
echo.

set /p OK2="Commit + push? (y/N): "
if /i not "%OK2%"=="y" (
  echo Aborted. Migration applied, code unstaged via git reset.
  git reset HEAD
  pause
  exit /b 0
)

git commit -m "Wire vehicles.name through schema, validation, actions, wizard" -m "Re-adds the 'Name this car' UX (Daily, Track Rat, Project E36) now that drizzle/0009_vehicle_name.sql added the column. schema.ts: add name text on vehicles. validation/race.ts: add carNameSchema + include in addCarFromSpec/Manual. actions.ts: pass name through both inserts. AddCarWizard: restore name input in confirm step (catalog + NHTSA picks) and manual step. Optional, max 40 chars."
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
echo =====================================================
pause
