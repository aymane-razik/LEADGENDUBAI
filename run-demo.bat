@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%backend"
set "FRONTEND_DIR=%PROJECT_DIR%frontend"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js 20 or newer is required.
  pause
  exit /b 1
)

echo.
echo  DUNE REALTY INTELLIGENCE  ^|  DEMO ENVIRONMENT
echo  ===============================================
echo.

if not exist "%BACKEND_DIR%\node_modules" (
  echo Installing backend dependencies...
  pushd "%BACKEND_DIR%"
  call npm install
  if errorlevel 1 (popd & exit /b 1)
  popd
)
if not exist "%FRONTEND_DIR%\node_modules" (
  echo Installing frontend dependencies...
  pushd "%FRONTEND_DIR%"
  call npm install
  if errorlevel 1 (popd & exit /b 1)
  popd
)

powershell -NoProfile -Command "$c=New-Object Net.Sockets.TcpClient; try {$c.Connect('127.0.0.1',27017); exit 0} catch {exit 1} finally {$c.Dispose()}" >nul 2>nul
if errorlevel 1 (
  powershell -NoProfile -Command "$c=New-Object Net.Sockets.TcpClient; try {$c.Connect('127.0.0.1',6379); exit 0} catch {exit 1} finally {$c.Dispose()}" >nul 2>nul
  if errorlevel 1 (
    echo Starting isolated MongoDB and Redis demo services...
    pushd "%BACKEND_DIR%"
    call node scripts\demo-env.cjs infra
    if errorlevel 1 (
      popd
      echo [ERROR] Start Docker Desktop or run the demo services, then try again.
      pause
      exit /b 1
    )
    popd
    timeout /t 8 /nobreak >nul
  ) else (
    echo [ERROR] Redis is running but MongoDB is not. Start both demo services.
    pause
    exit /b 1
  )
 ) else (
  powershell -NoProfile -Command "$c=New-Object Net.Sockets.TcpClient; try {$c.Connect('127.0.0.1',6379); exit 0} catch {exit 1} finally {$c.Dispose()}" >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] Redis is not reachable. Start Redis, then try again.
    pause
    exit /b 1
  )
)

echo Preparing the isolated demo database and sample workspace...
pushd "%BACKEND_DIR%"
call node scripts\demo-env.cjs seed
set "SEED_RESULT=%errorlevel%"
if not "%SEED_RESULT%"=="0" (popd & exit /b %SEED_RESULT%)
start "Dune Demo API" cmd /k node scripts\demo-env.cjs api
start "Dune Demo Worker" cmd /k node scripts\demo-env.cjs worker
start "Dune Demo Frontend" cmd /k node scripts\demo-env.cjs frontend
popd

echo.
echo  Demo services are starting on their own ports:
echo    Landing    http://localhost:3010/
echo    Workspace  http://localhost:3010/login
echo    API health http://localhost:5010/api/v2/health/ready
echo    Demo user  admin@dubairealestate.com / Demo@123456
echo.
echo  Use stop-demo.bat to stop only these demo processes.
echo  Re-run seed-demo.bat to recreate the demo database.
echo.
start "" "http://localhost:3010/"
pause
