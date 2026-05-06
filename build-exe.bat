@echo off
chcp 65001 >nul
echo.
echo ========================================
echo    思维导图桌面应用 EXE 构建工具
echo ========================================
echo.

echo 选择构建方式:
echo [1] 快速构建 (使用electron-builder)
echo [2] 完整构建 (使用自定义脚本)
echo [3] 仅构建web应用
echo [4] 退出
echo.

set /p choice=请输入选择 (1-4): 

if "%choice%"=="1" (
    echo.
    echo 🚀 开始快速构建...
    node quick-build-exe.js
    goto end
)

if "%choice%"=="2" (
    echo.
    echo 🔧 开始完整构建...
    node build-standalone-exe.js
    goto end
)

if "%choice%"=="3" (
    echo.
    echo 🌐 构建web应用...
    cd web
    npm run build
    cd ..
    node copy.js
    echo ✅ web应用构建完成
    goto end
)

if "%choice%"=="4" (
    echo 👋 再见!
    goto end
)

echo ❌ 无效选择，请重新运行脚本
pause

:end
echo.
echo 按任意键退出...
pause >nul
