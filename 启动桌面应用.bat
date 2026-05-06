@echo off
chcp 65001 >nul

:: Mind Map Project - Quick Start Electron Desktop App

echo ========================================
echo   Mind Map - Quick Start
echo   Electron Desktop Application Mode
echo ========================================
echo.

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
echo Starting Electron Desktop Application...
echo ========================================
echo Tip: Press Ctrl+C to stop the application
echo ========================================
echo.

call npm run electron
