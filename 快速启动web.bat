@echo off
chcp 65001 >nul

:: Mind Map Project - Quick Start (Web + AI Service)

echo ========================================
echo   Mind Map - Quick Start
echo   Web + AI Service Mode
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
echo Starting Web Development Server and AI Service...
echo ========================================
echo Web URL: http://localhost:8080
echo AI Service Port: 3456
echo ========================================
echo.
echo Tip: Press Ctrl+C to stop the service
echo.

call npm run dev
