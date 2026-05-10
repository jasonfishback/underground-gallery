@echo off
REM ============================================================================
REM _deploy_marketplace.bat
REM
REM Double-click to commit + push the marketplace module to GitHub.
REM Vercel auto-deploys from the push. After it deploys, visit
REM https://undergroundgallery.ai/admin/init-db on your live site, paste your
REM ADMIN_TOKEN, and click "RUN MARKETPLACE MIGRATION".
REM
REM Safe to rerun — git will skip if there's nothing to commit.
REM ============================================================================

setlocal
cd /d "%~dp0"

echo.
echo ============================================================
echo  Underground Gallery - Marketplace deploy
echo  Repo: %CD%
echo ============================================================
echo.

echo [1/4] Checking git status...
git status --short
if errorlevel 1 goto :error
echo.

echo [2/4] Staging all changes...
git add -A
if errorlevel 1 goto :error
echo.

echo [3/4] Committing...
git commit -m "Add marketplace module: classifieds for cars and parts"
if errorlevel 1 (
  echo Nothing new to commit, or commit failed. Continuing anyway...
)
echo.

echo [4/4] Pushing to GitHub...
git push
if errorlevel 1 goto :error
echo.

echo ============================================================
echo  DONE. Vercel is now deploying.
echo  Next steps:
echo    1. Wait ~60s for Vercel to finish the build.
echo    2. Visit https://undergroundgallery.ai/admin/init-db
echo    3. Paste your ADMIN_TOKEN.
echo    4. Click "RUN MARKETPLACE MIGRATION".
echo ============================================================
echo.
pause
exit /b 0

:error
echo.
echo ============================================================
echo  FAILED. See output above.
echo  Common fixes:
echo    - Sign in to GitHub: git config --global credential.helper manager
echo    - Pull first if remote moved: git pull --rebase
echo    - Check you have a remote: git remote -v
echo ============================================================
echo.
pause
exit /b 1
