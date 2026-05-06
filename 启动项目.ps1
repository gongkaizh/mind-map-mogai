# 思维导图项目一键启动脚本
# 同时启动 Web 开发服务器和 AI 服务

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  思维导图项目一键启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在正确的目录
$webDir = Join-Path $PSScriptRoot "web"
if (-not (Test-Path $webDir)) {
    Write-Host "错误: 找不到 web 目录" -ForegroundColor Red
    Write-Host "请确保在項目根目录运行此脚本" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "正在进入 web 目录..." -ForegroundColor Green
Set-Location $webDir

# 检查 node_modules 是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host "警告: 未检测到 node_modules，正在安装依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "错误: 依赖安装失败" -ForegroundColor Red
        pause
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  启动方式选择" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. 仅启动 Web 开发服务器 (端口 8080)" -ForegroundColor White
Write-Host "2. 启动 Web + AI 服务 (端口 8080 + 3456)" -ForegroundColor White
Write-Host "3. 启动 Electron 桌面应用" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请选择启动方式 (1/2/3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "正在启动 Web 开发服务器..." -ForegroundColor Green
        Write-Host "访问地址: http://localhost:8080" -ForegroundColor Yellow
        Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
        Write-Host ""
        npm run serve
    }
    "2" {
        Write-Host ""
        Write-Host "正在启动 Web 开发服务器和 AI 服务..." -ForegroundColor Green
        Write-Host "Web 访问地址: http://localhost:8080" -ForegroundColor Yellow
        Write-Host "AI 服务端口: 3456" -ForegroundColor Yellow
        Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
        Write-Host ""
        npm run dev
    }
    "3" {
        Write-Host ""
        Write-Host "正在返回项目根目录..." -ForegroundColor Green
        Set-Location $PSScriptRoot
        
        # 检查根目录的 node_modules
        if (-not (Test-Path "node_modules")) {
            Write-Host "警告: 未检测到根目录依赖，正在安装..." -ForegroundColor Yellow
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Host "错误: 依赖安装失败" -ForegroundColor Red
                pause
                exit 1
            }
        }
        
        Write-Host "正在启动 Electron 桌面应用..." -ForegroundColor Green
        Write-Host "按 Ctrl+C 停止应用" -ForegroundColor Yellow
        Write-Host ""
        npm run electron
    }
    default {
        Write-Host "无效的选择" -ForegroundColor Red
        pause
        exit 1
    }
}
