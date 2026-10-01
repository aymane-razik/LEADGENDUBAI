@echo off
setlocal
set "BACKEND_DIR=%~dp0backend"
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js 20 or newer is required.
  pause
  exit /b 1
)
pushd "%BACKEND_DIR%"
call node scripts\demo-env.cjs seed
set "SEED_RESULT=%errorlevel%"
popd
if not "%SEED_RESULT%"=="0" (
  echo.
  echo Demo seeding failed. Check that local MongoDB is running.
  pause
  exit /b %SEED_RESULT%
)
echo.
echo Seed refreshed in the isolated dubai-realestate-demo database.
pause
