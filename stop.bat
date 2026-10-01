@echo off
setlocal enabledelayedexpansion

set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%backend"

echo.
echo ============================================================
echo   Stopping Dubai Real Estate LeadGen System
echo ============================================================
echo.

echo [1/3] Stopping frontend dev server process...
taskkill /IM node.exe /F /T >nul 2>nul
echo       Node processes terminated (if any).

echo.
echo [2/3] Waiting for ports to release...
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Infra teardown (optional)...
echo   Docker containers were started outside this script.
echo   To stop + remove volumes, run from backend folder:
echo.
echo     docker compose down -v
echo.
echo   To stop without removing volumes:
echo.
echo     docker compose down
echo.

echo.
echo ============================================================
echo   Stop complete.
echo ============================================================
echo.

pause
