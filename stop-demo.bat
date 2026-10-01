@echo off
setlocal
set "BACKEND_DIR=%~dp0backend"
pushd "%BACKEND_DIR%"
call node scripts\demo-env.cjs stop
popd
echo.
echo Only processes started by run-demo.bat have been targeted.
echo Demo MongoDB and Redis data remain available for the next recording.
echo.
pause
