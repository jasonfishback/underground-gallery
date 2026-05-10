@echo off
setlocal

set "APP=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery\underground-gallery"

cd /d "%APP%" || (echo Cannot cd & pause & exit /b 1)

echo =====================================================
echo  Apply a Drizzle migration to the live database
echo  WARNING: this writes to whatever DATABASE_URL points
echo  to in .env.local. Right now that's the production
echo  Neon database. Migrations here are idempotent
echo  (IF NOT EXISTS) but read the SQL before running.
echo =====================================================
echo.

set "MIG=%~1"
if "%MIG%"=="" set "MIG=drizzle\0009_vehicle_name.sql"

if not exist "%APP%\%MIG%" (
  echo [ERROR] Migration file not found: %MIG%
  pause
  exit /b 1
)

echo Migration: %MIG%
echo.
type "%APP%\%MIG%"
echo.

set /p CONFIRM="Apply this migration to the DB? (y/N): "
if /i not "%CONFIRM%"=="y" (
  echo Aborted.
  pause
  exit /b 0
)

call node scripts/apply-migration.mjs "%MIG%"
if errorlevel 1 (
  echo [ERROR] migration failed.
  pause
  exit /b 1
)

echo.
echo Done.
pause
