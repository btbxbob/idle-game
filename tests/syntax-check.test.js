const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');

test('all JavaScript files should have valid syntax', () => {
  try {
    // 运行语法检查脚本
    execSync('node scripts/lint-syntax.js', { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    // 如果没有抛出错误，说明语法检查通过
    expect(true).toBe(true);
  } catch (error) {
    // 如果语法检查失败，抛出错误并显示详细信息
    throw new Error(`Syntax check failed:\n${error.stdout}\n${error.stderr}`);
  }
});

test('js/game.js should have valid syntax', () => {
  try {
    execSync('node --check js/game.js', { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    expect(true).toBe(true);
  } catch (error) {
    throw new Error(`js/game.js has syntax errors:\n${error.stderr}`);
  }
});

test('js/i18n.js should have valid syntax', () => {
  try {
    execSync('node --check js/i18n.js', { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    expect(true).toBe(true);
  } catch (error) {
    throw new Error(`js/i18n.js has syntax errors:\n${error.stderr}`);
  }
});

test('js/bootstrap.js should have valid syntax', () => {
  try {
    execSync('node --check js/bootstrap.js', { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    expect(true).toBe(true);
  } catch (error) {
    throw new Error(`js/bootstrap.js has syntax errors:\n${error.stderr}`);
  }
});
