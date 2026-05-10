@echo off
setlocal

set "OUTER=C:\Users\Jason Fishback\Documents\Claude\Projects\Underground gallery"
set "OUT=%OUTER%\_git_lsdump.txt"

cd /d "%OUTER%"

echo === git ls-files (first 60) === > "%OUT%"
git ls-files >> "%OUT%" 2>&1
echo. >> "%OUT%"
echo === total tracked files === >> "%OUT%"
git ls-files | find /c /v "" >> "%OUT%" 2>&1
echo. >> "%OUT%"
echo === ls-files filtered to underground-gallery === >> "%OUT%"
git ls-files underground-gallery >> "%OUT%" 2>&1
echo. >> "%OUT%"
echo === git diff --stat HEAD (any change?) === >> "%OUT%"
git diff --stat HEAD >> "%OUT%" 2>&1
echo. >> "%OUT%"
echo === recent commits === >> "%OUT%"
git log --oneline -10 >> "%OUT%" 2>&1
echo. >> "%OUT%"
echo === git ls-tree HEAD === >> "%OUT%"
git ls-tree HEAD >> "%OUT%" 2>&1

echo Wrote %OUT%
type "%OUT%"
pause
