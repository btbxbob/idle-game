/**
 * 调试脚本 - 在浏览器控制台中运行，检查升级项 DOM 结构
 * 
 * 使用方法：
 * 1. 打开游戏页面
 * 2. 切换到升级标签页
 * 3. 在浏览器控制台中粘贴此脚本并回车
 */

(function() {
    console.log('=== 升级项 DOM 结构调试 ===\n');
    
    const upgradeItems = document.querySelectorAll('.upgrade-item');
    console.log(`找到 ${upgradeItems.length} 个升级项\n`);
    
    upgradeItems.forEach((item, index) => {
        console.log(`--- 升级项 #${index} ---`);
        console.log('ID:', item.id);
        
        const allDivs = item.querySelectorAll('div');
        console.log('div 数量:', allDivs.length);
        
        allDivs.forEach((div, i) => {
            console.log(`  div[${i}]:`, div.outerHTML.substring(0, 100));
        });
        
        // 尝试不同的选择器
        const lastChildDiv = item.querySelector('div:last-child');
        console.log('querySelector("div:last-child"):', lastChildDiv ? '找到' : '未找到');
        
        const secondDiv = allDivs.length > 1 ? allDivs[1] : null;
        console.log('allDivs[1]:', secondDiv ? '找到' : '未找到');
        
        const spanInSecondDiv = secondDiv ? secondDiv.querySelector('span') : null;
        console.log('第二个 div 中的 span:', spanInSecondDiv ? spanInSecondDiv.textContent : '未找到');
        
        // 测试当前的选择器逻辑
        const costSpan = spanInSecondDiv;
        console.log('costSpan.textContent:', costSpan ? costSpan.textContent : 'null');
        console.log('');
    });
    
    console.log('=== 调试完成 ===');
})();
