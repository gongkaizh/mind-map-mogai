@echo off
chcp 65001 >nul

:: Mind Map Project - Startup Script with Options

echo ========================================
echo   Mind Map - Startup Options
echo ========================================
echo.

:: Check if in correct directory
if not exist "web" (
    echo ERROR: Cannot find web directory
    echo Please run this script from project root
    pause
    exit /b 1
)

echo Entering web directory...
cd web

:: Check if node_modules exists
if not exist "node_modules" (
    echo WARNING: node_modules not found, installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Dependency installation failed
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   Select Startup Mode
echo ========================================
echo 1. Web Development Server only (Port 8080)
echo 2. Web + AI Service (Port 8080 + 3456)
echo 3. Electron Desktop Application
echo.

set /p choice="Select mode (1/2/3): "

if "%choice%"=="1" (
    echo.
    echo Starting Web Development Server...
    echo URL: http://localhost:8080
    echo Press Ctrl+C to stop
    echo.
    call npm run serve
) else if "%choice%"=="2" (
    echo.
    echo Starting Web Server and AI Service...
    echo Web URL: http://localhost:8080
    echo AI Port: 3456
    echo Press Ctrl+C to stop
    echo.
    call npm run dev
) else if "%choice%"=="3" (
    echo.
    echo Returning to project root...
    cd ..
    
    :: Check root node_modules
    if not exist "node_modules" (
        echo WARNING: node_modules not found, installing...
        call npm install
        if errorlevel 1 (
            echo ERROR: Dependency installation failed
            pause
            exit /b 1
        )
    )
    
    echo Starting Electron Desktop Application...
    echo Press Ctrl+C to stop
    echo.
    call npm run electron
) else (
    echo Invalid selection
    pause
    exit /b 1
)
