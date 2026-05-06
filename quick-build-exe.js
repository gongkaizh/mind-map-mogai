/**
 * 快速构建exe应用程序脚本
 * 简化版本，用于快速生成exe文件
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始快速构建思维导图exe应用程序...');

try {
    // 检查必要文件是否存在
    const requiredFiles = ['electron-main.js', 'package.json', 'dist'];
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
        console.log('❌ 缺少必要文件:', missingFiles.join(', '));
        console.log('正在运行完整构建脚本...');
        execSync('node build-standalone-exe.js', { stdio: 'inherit' });
        return;
    }

    // 使用electron-builder快速构建
    console.log('📦 使用electron-builder构建...');
    execSync('npm run pack-win', { stdio: 'inherit' });
    
    console.log('✅ 构建完成！');
    console.log('📁 输出目录: electron-dist');
    
    // 查找生成的exe文件
    const electronDistPath = path.join(__dirname, 'electron-dist');
    if (fs.existsSync(electronDistPath)) {
        const files = fs.readdirSync(electronDistPath);
        const exeFiles = files.filter(file => file.endsWith('.exe'));
        
        if (exeFiles.length > 0) {
            console.log('🎯 生成的exe文件:');
            exeFiles.forEach(file => {
                const filePath = path.join(electronDistPath, file);
                const stats = fs.statSync(filePath);
                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                console.log(`   - ${file} (${fileSizeMB} MB)`);
            });
        }
        
        // 查找win-unpacked目录中的exe
        const winUnpackedPath = path.join(electronDistPath, 'win-unpacked');
        if (fs.existsSync(winUnpackedPath)) {
            const unpackedFiles = fs.readdirSync(winUnpackedPath);
            const unpackedExe = unpackedFiles.filter(file => file.endsWith('.exe'));
            
            if (unpackedExe.length > 0) {
                console.log('📂 解压版本exe文件:');
                unpackedExe.forEach(file => {
                    const filePath = path.join(winUnpackedPath, file);
                    const stats = fs.statSync(filePath);
                    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                    console.log(`   - win-unpacked/${file} (${fileSizeMB} MB)`);
                });
            }
        }
    }

} catch (error) {
    console.error('❌ 快速构建失败:', error.message);
    console.log('🔄 尝试使用完整构建脚本...');
    
    try {
        execSync('node build-standalone-exe.js', { stdio: 'inherit' });
    } catch (fallbackError) {
        console.error('❌ 完整构建也失败:', fallbackError.message);
        process.exit(1);
    }
}

console.log('\n🎉 exe应用程序构建完成！');
console.log('💡 提示: 您可以直接运行生成的exe文件来启动思维导图应用');
