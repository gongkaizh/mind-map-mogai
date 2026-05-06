/**
 * 构建独立exe应用程序脚本
 * 作者：AI Assistant
 * 日期：2025-01-31
 * 功能：使用简化的方式构建独立的Windows exe应用程序
 * 版本：v2.0 - 优化版本
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 清理旧的构建目录
function cleanBuildDir() {
    // 使用时间戳创建唯一的构建目录
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const buildDir = path.join(__dirname, `build-temp-${timestamp}`);

    fs.mkdirSync(buildDir, { recursive: true });
    return buildDir;
}

// 递归删除目录
function removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        try {
            // 先尝试正常删除
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`已清理临时目录: ${path.basename(dirPath)}`);
        } catch (error) {
            // 如果删除失败，尝试延迟删除
            console.warn(`临时目录删除失败，将在后台重试: ${path.basename(dirPath)}`);
            setTimeout(() => {
                try {
                    if (fs.existsSync(dirPath)) {
                        fs.rmSync(dirPath, { recursive: true, force: true });
                        console.log(`延迟清理成功: ${path.basename(dirPath)}`);
                    }
                } catch (retryError) {
                    console.warn(`延迟清理也失败: ${path.basename(dirPath)} - ${retryError.message}`);
                }
            }, 2000); // 2秒后重试
        }
    }
}

// 清理所有旧的临时构建目录
function cleanOldTempDirs() {
    try {
        const files = fs.readdirSync(__dirname);
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000); // 1小时前

        const tempDirs = files.filter(file => {
            if (!file.startsWith('build-temp-')) return false;

            const fullPath = path.join(__dirname, file);
            try {
                const stats = fs.statSync(fullPath);
                return stats.isDirectory() && stats.mtime.getTime() < oneHourAgo;
            } catch (error) {
                return false;
            }
        });

        if (tempDirs.length > 0) {
            console.log(`发现 ${tempDirs.length} 个超过1小时的旧临时目录，正在清理...`);
            tempDirs.forEach(dir => {
                removeDirectory(path.join(__dirname, dir));
            });
        } else {
            console.log('没有发现需要清理的旧临时目录');
        }
    } catch (error) {
        console.warn(`清理旧临时目录时出错: ${error.message}`);
    }
}

// 递归复制目录
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// 复制必要文件
function copyFiles(buildDir) {
    console.log('复制应用文件...');

    // 复制主要文件
    const filesToCopy = [
        'electron-main.js',
        'electron-preload.js',
        'package.json',
        'index.html'
    ];

    filesToCopy.forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join(buildDir, file));
            console.log(`已复制: ${file}`);
        } else {
            console.warn(`警告: 文件不存在 ${file}`);
        }
    });

    // 复制构建后的dist目录（从根目录）
    if (fs.existsSync('dist')) {
        copyDirectory('dist', path.join(buildDir, 'dist'));
        console.log('已复制构建文件 (dist)');
    } else {
        console.warn('警告: dist目录不存在，可能构建失败');
    }

    // 复制web目录的必要文件
    if (fs.existsSync('web')) {
        const webBuildDir = path.join(buildDir, 'web');
        fs.mkdirSync(webBuildDir, { recursive: true });

        // 复制web目录的关键文件
        const webFilesToCopy = [
            'package.json',
            'vue.config.js',
            'simple-ai-service.js',
            'local-ai-service.js',
            'quick-ai-service.js',
            'start-ai-service.js'
        ];

        webFilesToCopy.forEach(file => {
            const srcPath = path.join('web', file);
            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, path.join(webBuildDir, file));
                console.log(`已复制web文件: ${file}`);
            }
        });

        // 复制src目录（包含所有源代码）
        const webSrcPath = path.join('web', 'src');
        if (fs.existsSync(webSrcPath)) {
            copyDirectory(webSrcPath, path.join(webBuildDir, 'src'));
            console.log('已复制web/src目录');
        }

        // 复制public目录
        const webPublicPath = path.join('web', 'public');
        if (fs.existsSync(webPublicPath)) {
            copyDirectory(webPublicPath, path.join(webBuildDir, 'public'));
            console.log('已复制web/public目录');
        }
    }

    // 复制simple-mind-map目录
    if (fs.existsSync('simple-mind-map')) {
        copyDirectory('simple-mind-map', path.join(buildDir, 'simple-mind-map'));
        console.log('已复制simple-mind-map目录');
    }
}

// 创建简化的package.json
function createSimplePackageJson(buildDir) {
    const packageJson = {
        "name": "mind-map-desktop",
        "version": "0.15.0",
        "description": "思绪思维导图桌面应用",
        "main": "electron-main.js",
        "scripts": {
            "start": "electron ."
        },
        "dependencies": {
            "electron": "^22.3.27",
            "express": "^4.21.2",
            "axios": "^1.10.0"
        }
    };
    
    fs.writeFileSync(
        path.join(buildDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );
}

// 检查并安装electron-packager
function checkAndInstallPackager() {
    try {
        execSync('npx electron-packager --version', { stdio: 'pipe' });
        console.log('electron-packager 可用');
    } catch (error) {
        console.log('安装 electron-packager...');
        execSync('npm install -g electron-packager', { stdio: 'inherit' });
    }
}

// 主构建函数
function buildStandaloneExe() {
    let buildDir = null;

    try {
        console.log('🚀 开始构建独立exe应用程序...');
        console.log('⏰ 构建时间:', new Date().toLocaleString());

        // 清理所有旧的临时目录
        cleanOldTempDirs();

        // 检查并安装必要工具
        checkAndInstallPackager();

        // 清理并创建构建目录
        buildDir = cleanBuildDir();
        console.log(`📁 构建目录: ${buildDir}`);

        // 复制文件
        copyFiles(buildDir);
        
        // 创建简化的package.json
        createSimplePackageJson(buildDir);
        
        // 在构建目录中安装依赖
        console.log('📦 安装依赖...');
        execSync('npm install', { stdio: 'inherit', cwd: buildDir });
        
        // 使用electron-packager打包
        console.log('🔨 打包应用程序...');
        const now = new Date();

        // 生成年月日时分格式的文件名后缀
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const dateTimeStr = `${year}${month}${day}${hour}${minute}`;

        // 固定输出目录
        const outputDir = path.join(__dirname, 'mind-map-exe-output');
        const appName = `mind-map-desktop-${dateTimeStr}`;

        // 确保输出目录存在
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log('已创建输出目录: mind-map-exe-output');
        }

        // 构建图标路径
        const iconPath = path.join(buildDir, 'dist', 'logo.ico');
        let iconArg = '';
        if (fs.existsSync(iconPath)) {
            iconArg = `--icon="${iconPath}"`;
        }

        // 执行打包命令
        const packagerCmd = `npx electron-packager "${buildDir}" "${appName}" --platform=win32 --arch=x64 --out="${outputDir}" --overwrite ${iconArg} --app-version=0.15.0 --build-version=0.15.0`;
        
        console.log('执行打包命令...');
        execSync(packagerCmd, { stdio: 'inherit' });
        
        console.log(`\n✅ 构建完成！`);
        console.log(`📁 输出目录: ${outputDir}`);
        console.log(`🚀 可执行文件: ${appName}.exe`);
        console.log(`\n构建的exe应用程序已保存到: ${path.join(outputDir, `${appName}-win32-x64`)}`);
        
        // 显示文件大小信息
        try {
            const exePath = path.join(outputDir, `${appName}-win32-x64`, `${appName}.exe`);
            if (fs.existsSync(exePath)) {
                const stats = fs.statSync(exePath);
                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                console.log(`📊 exe文件大小: ${fileSizeMB} MB`);
            }
        } catch (error) {
            console.warn('无法获取文件大小信息');
        }
        
    } catch (error) {
        console.error('❌ 构建失败:', error.message);
        process.exit(1);
    } finally {
        // 清理临时构建目录
        if (buildDir) {
            console.log('\n🧹 清理临时文件...');
            setTimeout(() => {
                removeDirectory(buildDir);
            }, 1000);
        }
    }
}

// 主函数
function main() {
    buildStandaloneExe();
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { buildStandaloneExe, main };