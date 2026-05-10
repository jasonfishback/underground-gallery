@echo off
setlocal

set "OUTER=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery"

cd /d "%OUTER%" || (echo Cannot cd & pause & exit /b 1)

echo === git rev-parse --show-toplevel ===
git rev-parse --show-toplevel
echo.

echo === git status (full) ===
git status
echo.

echo === Stage only the four real changes (full paths from repo root) ===
git add underground-gallery/components/garage/AddCarWizard.tsx
git add underground-gallery/app/api/apply/route.ts
git add underground-gallery/drizzle/0009_vehicle_name.sql
git add underground-gallery/scripts/apply-migration.mjs
echo.

echo === post-add diff --cached --stat ===
git diff --cached --stat
echo.

echo === post-add status ===
git status
echo.

set /p CONFIRM="Stage list above looks right? Commit + push? (y/N): "
if /i not "%CONFIRM%"=="y" (
  echo Aborted. Running 'git reset HEAD' to unstage.
  git reset HEAD
  pause
  exit /b 0
)

git commit -m "Fix vehicle add (manualSpecs wrapper) and apply-route resubmit; draft vehicles.name migration" -m "AddCarWizard: every NHTSA-fallback and manual submission was failing Zod silently because the wizard sent flat {year, make, model, trim, name} but addCarFromManualSchema requires {manualSpecs: {...}}. Also `name` was never a real schema column. Wrap properly, default trim to '', drop name input, surface Zod errors as readable text. apply-route: idempotent on resubmit (UPDATE pending in place; 409 on approved/rejected; INSERT new) so users typo-fixing don't 500. drizzle/0009_vehicle_name.sql + scripts/apply-migration.mjs: idempotent ALTER TABLE for an optional vehicles.name column, ready to apply via _migrate.bat when we want to bring the nickname feature back; no code references it yet."
if errorlevel 1 (
  echo Note: nothing committed.
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
echo === pushed ===
pause
