@echo off
setlocal

set "APP=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery\underground-gallery"

cd /d "%APP%" || (echo Cannot cd & pause & exit /b 1)

echo =====================================================
echo  Commit and push fixes to origin/main
echo  Vercel auto-deploys in ~90 seconds
echo =====================================================
echo.

echo === git status ===
git status --short
echo.

echo === diff summary ===
git diff --stat HEAD
echo.

git add components/garage/AddCarWizard.tsx app/api/apply/route.ts drizzle/0009_vehicle_name.sql scripts/apply-migration.mjs
if errorlevel 1 (
  echo [ERROR] git add failed.
  pause
  exit /b 1
)

git commit -m "Fix vehicle add (manualSpecs wrapper) and apply-route resubmit; draft vehicles.name migration" -m "AddCarWizard: every NHTSA-fallback and manual submission was failing Zod silently because the wizard sent flat {year, make, model, trim, name} but addCarFromManualSchema requires {manualSpecs: {...}}. Also `name` was never a real schema column. Wrap properly, default trim to '', drop name input, surface Zod errors as readable text. apply-route: idempotent on resubmit (UPDATE pending in place; 409 on approved/rejected; INSERT new) so users typo-fixing don't 500. drizzle/0009_vehicle_name.sql + scripts/apply-migration.mjs: idempotent ALTER TABLE for an optional vehicles.name column, ready to apply via _migrate.bat when we want to bring the nickname feature back; no code references it yet."
if errorlevel 1 (
  echo Note: nothing to commit, or commit failed. Skipping push.
  pause
  exit /b 1
)

git push origin main
if errorlevel 1 (
  echo [ERROR] git push failed. Check auth.
  pause
  exit /b 1
)

echo.
echo =====================================================
echo  Pushed. Vercel auto-deploys in ~90 seconds.
echo  Watch: https://vercel.com/jasonfishback-5845s-projects/underground-gallery
echo =====================================================
pause
