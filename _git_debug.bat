@echo off
setlocal

set "OUTER=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery"
set "INNER=%OUTER%\underground-gallery"

echo === checking for .git folders ===
if exist "%OUTER%\.git" (echo OUTER has .git) else (echo OUTER no .git)
if exist "%INNER%\.git" (echo INNER has .git) else (echo INNER no .git)
echo.

echo === git rev-parse from OUTER ===
cd /d "%OUTER%"
git rev-parse --show-toplevel 2>&1
echo.

echo === git rev-parse from INNER ===
cd /d "%INNER%"
git rev-parse --show-toplevel 2>&1
echo.

echo === git status from INNER (porcelain) ===
git status --porcelain=v1 --untracked-files=all 2>&1 | findstr /R "components/garage/AddCarWizard.tsx app/api/apply/route.ts drizzle/0009 scripts/apply-migration.mjs"
echo.

echo === ls inner files ===
if exist "%INNER%\components\garage\AddCarWizard.tsx" (echo wizard exists) else (echo WIZARD MISSING)
if exist "%INNER%\app\api\apply\route.ts" (echo apply route exists) else (echo APPLY MISSING)
if exist "%INNER%\drizzle\0009_vehicle_name.sql" (echo migration exists) else (echo MIGRATION MISSING)
if exist "%INNER%\scripts\apply-migration.mjs" (echo script exists) else (echo SCRIPT MISSING)
echo.

echo === full git status ===
git status
echo.

pause
