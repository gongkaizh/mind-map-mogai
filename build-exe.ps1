# 思维导图桌面应用 EXE 构建工具 (PowerShell版本)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   思维导图桌面应用 EXE 构建工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "选择构建方式:" -ForegroundColor Yellow
Write-Host "[1] 快速构建 (使用electron-builder)" -ForegroundColor Green
Write-Host "[2] 完整构建 (使用自定义脚本)" -ForegroundColor Green
Write-Host "[3] 仅构建web应用" -ForegroundColor Green
Write-Host "[4] 查看已生成的exe文件" -ForegroundColor Green
Write-Host "[5] 退出" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "请输入选择 (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 开始快速构建..." -ForegroundColor Green
        node quick-build-exe.js
    }
    "2" {
        Write-Host ""
        Write-Host "🔧 开始完整构建..." -ForegroundColor Green
        node build-standalone-exe.js
    }
    "3" {
        Write-Host ""
        Write-Host "🌐 构建web应用..." -ForegroundColor Green
        Set-Location web
        npm run build
        Set-Location ..
        node copy.js
        Write-Host "✅ web应用构建完成" -ForegroundColor Green
    }
    "4" {
        Write-Host ""
        Write-Host "📁 查找已生成的exe文件..." -ForegroundColor Yellow
        
        # 检查electron-dist目录
        if (Test-Path "electron-dist") {
            Write-Host "electron-dist目录中的文件:" -ForegroundColor Cyan
            Get-ChildItem "electron-dist" -Recurse -Filter "*.exe" | ForEach-Object {
                $size = [math]::Round($_.Length / 1MB, 2)
                Write-Host "  - $($_.FullName) ($size MB)" -ForegroundColor White
            }
        }
        
        # 检查mind-map-exe-output目录
        if (Test-Path "mind-map-exe-output") {
            Write-Host "mind-map-exe-output目录中的文件:" -ForegroundColor Cyan
            Get-ChildItem "mind-map-exe-output" -Recurse -Filter "*.exe" | ForEach-Object {
                $size = [math]::Round($_.Length / 1MB, 2)
                Write-Host "  - $($_.FullName) ($size MB)" -ForegroundColor White
            }
        }
        
        if (-not (Test-Path "electron-dist") -and -not (Test-Path "mind-map-exe-output")) {
            Write-Host "❌ 未找到任何exe文件，请先运行构建" -ForegroundColor Red
        }
    }
    "5" {
        Write-Host "👋 再见!" -ForegroundColor Yellow
        exit
    }
    default {
        Write-Host "❌ 无效选择，请重新运行脚本" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
