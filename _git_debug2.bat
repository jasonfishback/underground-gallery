@echo off
setlocal

set "INNER=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery\underground-gallery"

cd /d "%INNER%"

echo === git ls-files (does git track these?) ===
git ls-files components/garage/AddCarWizard.tsx app/api/apply/route.ts drizzle scripts 2>&1
echo.

echo === git check-ignore (are they gitignored?) ===
git check-ignore -v components/garage/AddCarWizard.tsx app/api/apply/route.ts drizzle/0009_vehicle_name.sql scripts/apply-migration.mjs 2>&1
echo.

echo === git diff --name-only HEAD (anything modified?) ===
git diff --name-only HEAD 2>&1
echo.

echo === git update-index --refresh ===
git update-index --refresh 2>&1
echo.

echo === retry diff after refresh ===
git diff --name-only HEAD 2>&1
echo.

echo === HEAD's version of AddCarWizard line 1-12 ===
git show HEAD:underground-gallery/components/garage/AddCarWizard.tsx 2>&1 | findstr /N . | findstr /B "^[1-9]:" | findstr /B "^1[0-2]:" /V
git show HEAD:underground-gallery/components/garage/AddCarWizard.tsx 2>&1 | more +0 | head -12 2>nul
echo.

echo === what HEAD tracks under underground-gallery/components/garage ===
git ls-tree -r HEAD --name-only | findstr /R "^underground-gallery/components/garage" 2>&1
echo.

echo === core config ===
git config --get core.autocrlf
git config --get core.filemode
git config --get core.ignorecase
echo.

echo === diff with --no-renames to see if path mismatch ===
git diff --no-renames --stat HEAD 2>&1
echo.

echo === current local main vs origin/main ===
git log --oneline origin/main..HEAD 2>&1
git log --oneline HEAD..origin/main 2>&1
echo.

pause
