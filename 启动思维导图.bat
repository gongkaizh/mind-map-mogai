@echo off
chcp 65001 >nul
echo 启动思维导图桌面应用...
echo.

REM 查找最新的exe文件
for /f "delims=" %%i in ('dir /b /ad "mind-map-exe-output\mind-map-desktop-*-win32-x64" 2^>nul ^| sort /r') do (
    set "latest_folder=%%i"
    goto :found
)

:found
if not defined latest_folder (
    echo 错误：未找到构建的应用程序
    echo 请先运行 build-standalone-exe.js 构建应用程序
    pause
    exit /b 1
)

echo 找到最新版本：%latest_folder%
echo.

REM 启动应用程序
cd "mind-map-exe-output\%latest_folder%"
for %%f in (mind-map-desktop-*.exe) do (
    echo 启动：%%f
    start "" "%%f"
    goto :end
)

:end
echo 应用程序已启动！
timeout /t 3 >nul