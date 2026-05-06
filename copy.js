// 复制构建文件到根目录dist
const fs = require('fs');
const path = require('path');

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

// 复制dist目录到根目录
const webDistPath = path.join(__dirname, 'web', 'dist');
const rootDistPath = path.join(__dirname, 'dist');

if (fs.existsSync(webDistPath)) {
    console.log('复制构建文件到根目录...');
    copyDirectory(webDistPath, rootDistPath);
    console.log('构建文件复制完成');
} else {
    console.error('web/dist目录不存在');
}