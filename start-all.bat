@echo off
chcp 65001 >nul

:: Mind Map Project - Complete Startup Script

echo ========================================
echo   Mind Map - Complete Startup
echo   Web + Electron Applications
echo ========================================
echo.

:: Get script directory
set "SCRIPT_DIR=%~dp0"
set "WEB_DIR=%SCRIPT_DIR%web"

:: Check web directory
echo [1/3] Checking web directory...
if not exist "%WEB_DIR%" (
    echo ERROR: Cannot find web directory
    echo Path: %WEB_DIR%
    pause
    exit /b 1
)
echo OK: Web directory found
echo.

:: Check root dependencies
echo [2/3] Checking dependencies...
if not exist "%SCRIPT_DIR%node_modules" (
    echo Installing root dependencies...
    cd /d "%SCRIPT_DIR%"
    call npm install
    if errorlevel 1 (
        echo ERROR: Root dependency installation failed
        pause
        exit /b 1
    )
    echo OK: Root dependencies installed
) else (
    echo OK: Root dependencies already exist
)

:: Check web dependencies
if not exist "%WEB_DIR%\node_modules" (
    echo Installing web dependencies...
    cd /d "%WEB_DIR%"
    call npm install
    if errorlevel 1 (
        echo ERROR: Web dependency installation failed
        pause
        exit /b 1
    )
    echo OK: Web dependencies installed
) else (
    echo OK: Web dependencies already exist
)
echo.

:: Return to root directory
cd /d "%SCRIPT_DIR%"

:: Start services
echo [3/3] Starting services...
echo ========================================
echo.

:: Start Web development server
echo Starting Web Development Server...
start "MindMap-WebServer" cmd /k "chcp 65001 >nul && cd /d "%WEB_DIR%" && npm run serve"
timeout /t 2 /nobreak >nul

:: Start Electron application
echo Starting Electron Desktop App...
start "MindMap-Electron" cmd /k "chcp 65001 >nul && cd /d "%SCRIPT_DIR%" && npm run electron"

echo.
echo ========================================
echo   Services Started Successfully!
echo ========================================
echo.
echo Web Server:    http://localhost:8080
echo Electron App:  Opening in new window
echo.
echo Tips:
echo   - Both services run in separate windows
echo   - Close windows to stop services
echo   - Web server supports hot reload
echo.
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
