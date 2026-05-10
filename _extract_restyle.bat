@echo off
REM ============================================================================
REM _extract_restyle.bat
REM Extracts "underground resytle.zip" into _restyle_staging\ for inspection.
REM Run this first, then I'll write the apply+push script based on contents.
REM ============================================================================

setlocal
cd /d "%~dp0"

if exist "_restyle_staging" (
  echo Removing previous staging folder...
  rmdir /s /q "_restyle_staging"
)

echo Extracting "underground resytle.zip" -^> _restyle_staging\
powershell -ExecutionPolicy Bypass -NoProfile -Command "Expand-Archive -Path 'underground resytle.zip' -DestinationPath '_restyle_staging' -Force"
if errorlevel 1 goto :error

echo.
echo === FILE LISTING (also saved to _restyle_staging\_FILE_LIST.txt) ===
dir /s /b "_restyle_staging" > "_restyle_staging\_FILE_LIST.txt"
type "_restyle_staging\_FILE_LIST.txt"
echo.
echo === DONE. Tell Claude that extraction is complete. ===
echo.
pause
exit /b 0

:error
echo.
echo Extraction failed.
pause
exit /b 1
