/**
 * 语法检查脚本 - 验证所有 JavaScript 文件的语法
 * 使用方法：node scripts/lint-syntax.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    jsDirs: ['js', 'tests', 'scripts'],
    extensions: ['.js'],
    ignorePatterns: [/node_modules/, /playwright-report/, /target/, /pkg/]
};

let errorCount = 0;
let fileCount = 0;

function shouldIgnore(filePath) {
    return CONFIG.ignorePatterns.some(pattern => pattern.test(filePath));
}

function collectFiles(dirs) {
    const files = [];
    dirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(fullPath)) return;
        
        const walk = (currentDir) => {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            entries.forEach(entry => {
                const fullPath = path.join(currentDir, entry.name);
                if (shouldIgnore(fullPath)) return;
                if (entry.isDirectory()) {
                    walk(fullPath);
                } else if (entry.isFile() && CONFIG.extensions.includes(path.extname(entry.name))) {
                    files.push(fullPath);
                }
            });
        };
        walk(fullPath);
    });
    return files;
}

function checkFileSyntax(filePath) {
    try {
        execSync(`node --check "${filePath}"`, { stdio: 'pipe', timeout: 5000 });
        console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
        return true;
    } catch (error) {
        console.error(`❌ ${path.relative(process.cwd(), filePath)}`);
        if (error.stderr) console.error(`   ${error.stderr.toString().trim()}`);
        return false;
    }
}

function main() {
    console.log('🔍 开始语法检查...\n');
    const files = collectFiles(CONFIG.jsDirs);
    fileCount = files.length;
    
    if (fileCount === 0) {
        console.log('⚠️  没有找到需要检查的文件\n');
        process.exit(0);
    }
    
    console.log(`找到 ${fileCount} 个文件需要检查\n`);
    files.forEach(filePath => {
        if (!checkFileSyntax(filePath)) errorCount++;
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`检查结果：${fileCount} 个文件，${errorCount} 个错误`);
    console.log('='.repeat(50));
    
    if (errorCount > 0) {
        console.error('\n❌ 语法检查失败！请修复上述错误。');
        process.exit(1);
    } else {
        console.log('\n✅ 所有文件语法正确！');
        process.exit(0);
    }
}

main();
