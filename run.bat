@echo off
setlocal enabledelayedexpansion

set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%backend"
set "FRONTEND_DIR=%PROJECT_DIR%frontend"
set "API_PORT=5000"
set "WEB_PORT=3000"

:: Force demo ports (ignore any stray PORT variable on this PC)
set "PORT=%API_PORT%"

set "API_URL=http://localhost:%API_PORT%"
set "WEB_URL=http://localhost:%WEB_PORT%"

title Dubai Real Estate LeadGen - Full System Launcher

echo.
echo ============================================================
echo   Dubai Real Estate Lead Generation System
echo   Backend: %API_URL%
echo   Frontend: %WEB_URL%
echo ============================================================
echo.

:: ------------------------------------------------------------------
:: 1. Locate Node.js (PATH, then common install dirs)
:: ------------------------------------------------------------------
set "NODE_FOUND=0"

where node >nul 2>nul
if not errorlevel 1 set "NODE_FOUND=1"

if %NODE_FOUND% equ 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;!PATH!"
        set "NODE_FOUND=1"
    )
)

if %NODE_FOUND% equ 0 (
    if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=C:\Program Files (x86)\nodejs;!PATH!"
        set "NODE_FOUND=1"
    )
)

if %NODE_FOUND% equ 0 (
    if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\nodejs;!PATH!"
        set "NODE_FOUND=1"
    )
)

if %NODE_FOUND% equ 0 (
    echo [ERROR] Node.js not found on this computer.
    echo.
    echo   Install it from: https://nodejs.org/en/download
    echo   Or run run-demo.bat which can install it automatically via winget.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected:
node --version
echo.

:: ------------------------------------------------------------------
:: 2. Start infrastructure (MongoDB + Redis) if Docker is available
:: ------------------------------------------------------------------
if not defined SKIP_INFRA (
    echo [1/5] Starting infrastructure (MongoDB + Redis) via Docker Compose...
    echo       Using: %BACKEND_DIR%docker-compose.yml

    cd /d "%BACKEND_DIR%"

    docker compose up -d mongodb redis

    if %errorlevel% neq 0 (
        echo [WARN] docker compose failed to start. Continuing anyway...
        set "SKIP_INFRA=1"
    ) else (
        echo       Infra containers requested.
        echo       Waiting for MongoDB and Redis to become ready...
    )

    cd /d "%PROJECT_DIR%"
) else (
    echo [1/5] Skipping Docker infrastructure (Docker not available).
    echo       Ensure MongoDB and Redis are running externally if needed.
)

echo.

:: ------------------------------------------------------------------
:: 3. Wait for MongoDB + Redis readiness (best-effort)
:: ------------------------------------------------------------------
if not defined SKIP_INFRA (
    echo [2/5] Waiting for services to be ready...

    set "DB_MAX_RETRIES=30"
    set "DB_RETRY=0"
    set "DB_READY=0"

    :db_loop
    if %DB_RETRY% geq %DB_MAX_RETRIES% goto db_done

    :: Try mongosh ping if available; otherwise assume ready after a short sleep
    where mongosh >nul 2>nul
    if %errorlevel% equ 0 (
        docker exec leadgen-mongodb mongosh --quiet --eval "db.adminCommand('ping')" >nul 2>nul
        if %errorlevel% equ 0 (
            set "DB_READY=1"
            goto db_done
        )
    )

    :: Fallback: try a TCP check on the port using powershell
    powershell -NoProfile -Command "exit(![System.Net.Sockets.TcpClient]::new('localhost',%DB_PORT%).Connected)" >nul 2>nul
    if %errorlevel% equ 0 (
        set "DB_READY=1"
        goto db_done
    )

    set /a DB_RETRY+=1
    timeout /t 2 /nobreak >nul
    echo       . DB check attempt %DB_RETRY%% done
    goto db_loop

    :db_done
    if %DB_READY% equ 1 (
        echo       MongoDB appears reachable on port %DB_PORT%.
    ) else (
        echo [WARN] MongoDB did not respond within expected time. The backend may fail to start.
    )

    echo.
    echo       Waiting briefly for Redis...
    timeout /t 3 /nobreak >nul
    echo       Redis check skipped (assumed ready with MongoDB).
) else (
    echo [2/5] Skipping service readiness checks (infra skipped).
)

echo.

:: ------------------------------------------------------------------
:: 4. Install/verify dependencies (best-effort, non-destructive)
:: ------------------------------------------------------------------
echo [3/5] Checking dependencies...

if not exist "%BACKEND_DIR%node_modules" (
    echo       Backend node_modules missing. Installing backend dependencies...
    cd /d "%BACKEND_DIR%"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Backend npm install failed.
        pause
        exit /b 1
    )
    cd /d "%PROJECT_DIR%"
) else (
    echo       Backend node_modules found.
)

if not exist "%FRONTEND_DIR%node_modules" (
    echo       Frontend node_modules missing. Installing frontend dependencies...
    cd /d "%FRONTEND_DIR%"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend npm install failed.
        pause
        exit /b 1
    )
    cd /d "%PROJECT_DIR%"
) else (
    echo       Frontend node_modules found.
)

echo.

:: ------------------------------------------------------------------
:: 5. Build frontend (best-effort) - only if needed for production start
:: ------------------------------------------------------------------
echo [4/5] Preparing frontend...
cd /d "%FRONTEND_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo [WARN] Frontend build failed. Starting dev server instead may still work.
)
cd /d "%PROJECT_DIR%"
echo.

:: ------------------------------------------------------------------
:: 6. Launch backend
:: ------------------------------------------------------------------
echo [5/5] Starting backend on port %API_PORT%...
echo       Backend logs will appear below.
echo       ======================= BACKEND LOGS =======================
echo.

cd /d "%BACKEND_DIR%"
start "Backend" cmd /k "npm run dev"
start "Backend Worker" cmd /k "npm run dev:worker"
cd /d "%PROJECT_DIR%"

echo       Backend API and BullMQ worker started in separate windows.
echo.

:: ------------------------------------------------------------------
:: 7. Launch frontend
:: ------------------------------------------------------------------
echo       Starting frontend on port %WEB_PORT%...
echo       Frontend logs will appear below.
echo       ======================= FRONTEND LOGS =======================
echo.

cd /d "%FRONTEND_DIR%"
start "Frontend" cmd /k "npm run dev -- --port %WEB_PORT%"
cd /d "%PROJECT_DIR%"

echo       Frontend launcher started in a separate window.
echo.

:: ------------------------------------------------------------------
:: 8. Open browser
:: ------------------------------------------------------------------
echo.
echo ============================================================
echo   System launch complete.
echo   Frontend: %WEB_URL%
echo   Backend API: %API_URL%
echo   API health: %API_URL%/api/v1/health
echo   API detailed health: %API_URL%/api/v1/health/detailed
echo ============================================================
echo.

start "" "%WEB_URL%"

echo Opening frontend in default browser...
timeout /t 3 /nobreak >nul

echo.
echo Tips:
echo   - Backend logs: look for the "Backend" command window.
echo   - Frontend logs: look for the "Frontend" command window.
echo   - To stop: close both windows, or run stop.bat
echo   - Infra (if started): docker compose down -v to stop+remove volumes
echo.

pause
