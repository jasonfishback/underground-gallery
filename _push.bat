@echo off
setlocal

set "OUTER=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery"
set "OUT=%OUTER%\_push.txt"

cd /d "%OUTER%" || (echo Cannot cd & pause & exit /b 1)

echo === local vs origin/main === > "%OUT%"
git log --oneline origin/main..HEAD >> "%OUT%" 2>&1
echo. >> "%OUT%"

echo === pushing to origin/main === >> "%OUT%"
git push origin main >> "%OUT%" 2>&1
echo. >> "%OUT%"

echo === post-push status === >> "%OUT%"
git status >> "%OUT%" 2>&1

type "%OUT%"
echo.
echo Vercel will auto-deploy in ~90 seconds.
echo Watch: https://vercel.com/jasonfishback-5845s-projects/underground-gallery
pause
