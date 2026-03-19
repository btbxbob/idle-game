const { test, expect } = require('../fixtures/coverage');

async function openSettings(page) {
  await page.click('button[data-tab="settings"]');
  await expect(page.locator('#tab-settings')).toHaveClass(/active/);
}

async function getCoins(page) {
  return page.evaluate(() => window.rustGame.get_coins());
}

test.describe('Settings save flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true, { timeout: 30000 });
  });

  test('theme, language, and manual save state survive the expected user flow', async ({ page }) => {
    await openSettings(page);

    const themeSelect = page.locator('#theme-select-setting');
    await themeSelect.selectOption('dark');
    await expect(themeSelect).toHaveValue('dark');
    await expect(page.locator('body')).toHaveClass(/dark-theme/);

    const savedTheme = await page.evaluate(() => localStorage.getItem('gameTheme'));
    expect(savedTheme).toBe('dark');

    const languageSelect = page.locator('#language-select-setting');
    await languageSelect.selectOption('en');
    await expect(languageSelect).toHaveValue('en');
    await expect(page.locator('#click-to-earn')).toContainText('Click to earn');
    await expect(page.locator('label[for="theme-select-setting"]')).toHaveText('Theme / 主题');
    await expect(page.locator('label[for="language-select-setting"]')).toHaveText('Language / 语言');
    await expect(page.locator('#save-load-title')).toHaveText('Save/Load Game');
    await expect(page.locator('#reset-game')).toHaveText('Reset Game');
    await expect(page.locator('#manual-save')).toHaveText('Manual Save');
    await expect(page.locator('#export-base64')).toHaveText('Export to BASE64');
    await expect(page.locator('#import-base64')).toHaveText('Import from BASE64');
    await expect(page.locator('#import-export-text')).toHaveAttribute('placeholder', 'Paste BASE64 string here...');
    const optionLabels = await page.evaluate(() => ({
      theme: Array.from(document.querySelectorAll('#theme-select-setting option')).map((option) => option.textContent),
      language: Array.from(document.querySelectorAll('#language-select-setting option')).map((option) => option.textContent),
    }));
    expect(optionLabels.theme).toEqual(['Light Theme', 'Dark Theme']);
    expect(optionLabels.language).toEqual(['Simplified Chinese', 'English / English']);

    for (let i = 0; i < 8; i += 1) {
      await page.click('#coin-button');
    }

    const savedCoins = await getCoins(page);
    expect(savedCoins).toBeGreaterThan(0);

    await page.click('#manual-save');
    await expect(page.locator('#save-status')).toContainText('Saved');

    const hasLocalSave = await page.evaluate(() => Boolean(localStorage.getItem('idle_game_save')));
    expect(hasLocalSave).toBe(true);

    await page.reload();
    await page.waitForFunction(() => window.gameInitialized === true, { timeout: 30000 });

    await expect(page.locator('body')).toHaveClass(/dark-theme/);
    await expect(page.locator('#theme-select-setting')).toHaveValue('dark');
    await expect(page.locator('#language-select-setting')).toHaveValue('en');
    await expect.poll(() => page.evaluate(() => window.i18n.getCurrentLanguage())).toBe('en');
    await expect(page.locator('#click-to-earn')).toContainText('Click to earn');
    await expect.poll(async () => getCoins(page)).toBe(savedCoins);
  });

  test('language switching updates settings copy without console errors when header selector is absent', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => {
      pageErrors.push(String(error));
    });

    await openSettings(page);
    await page.locator('#language-select-setting').selectOption('en');

    await expect(page.locator('label[for="theme-select-setting"]')).toHaveText('Theme / 主题');
    await expect(page.locator('label[for="language-select-setting"]')).toHaveText('Language / 语言');
    await expect(page.locator('#game-version-label')).toContainText('Game Version: v');
    await expect(page.locator('#save-load-title')).toHaveText('Save/Load Game');
    await expect(page.locator('#reset-game')).toHaveText('Reset Game');

    expect(pageErrors).toEqual([]);
  });

  test('exported BASE64 saves can be imported back to restore game state', async ({ page }) => {
    await openSettings(page);

    await page.evaluate(() => {
      window.__testAlerts = [];
      window.alert = (message) => {
        window.__testAlerts.push(String(message));
      };
      window.confirm = (message) => {
        window.__testAlerts.push(`CONFIRM:${message}`);
        return true;
      };
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: () => true,
      });
    });

    for (let i = 0; i < 6; i += 1) {
      await page.click('#coin-button');
    }

    const exportedCoins = await getCoins(page);
    expect(exportedCoins).toBeGreaterThan(0);

    await page.click('#export-base64');

    const exportTextArea = page.locator('#import-export-text');
    await expect(exportTextArea).not.toHaveValue('');
    const exportedSave = await exportTextArea.inputValue();
    expect(exportedSave.length).toBeGreaterThan(10);

    const exportAlert = await page.evaluate(() => window.__testAlerts.at(-1));
    expect(exportAlert).toContain('导出成功');

    for (let i = 0; i < 9; i += 1) {
      await page.click('#coin-button');
    }

    const changedCoins = await getCoins(page);
    expect(changedCoins).toBeGreaterThan(exportedCoins);

    await exportTextArea.fill(exportedSave);
    await page.click('#import-base64');

    await expect.poll(async () => getCoins(page)).toBe(exportedCoins);

    const alerts = await page.evaluate(() => window.__testAlerts.slice());
    expect(alerts.some((message) => message.startsWith('CONFIRM:'))).toBe(true);
    expect(alerts.some((message) => message.includes('导入成功'))).toBe(true);
  });

  test('reset game confirmation preserves progress on cancel and clears saved state on confirm', async ({ page }) => {
    await openSettings(page);

    await page.locator('#theme-select-setting').selectOption('dark');
    for (let i = 0; i < 7; i += 1) {
      await page.click('#coin-button');
    }
    await page.click('#manual-save');

    const coinsBeforeReset = await getCoins(page);
    expect(coinsBeforeReset).toBeGreaterThan(0);

    await page.evaluate(() => {
      window.__resetPrompts = [];
      window.confirm = (message) => {
        window.__resetPrompts.push(String(message));
        return false;
      };
    });

    await page.click('#reset-game');

    const cancelState = await page.evaluate(() => ({
      prompts: window.__resetPrompts.slice(),
      save: Boolean(localStorage.getItem('idle_game_save')),
      theme: localStorage.getItem('gameTheme'),
      coins: window.rustGame.get_coins(),
    }));

    expect(cancelState.prompts).toContain('确定要重置游戏吗？所有进度将丢失！');
    expect(cancelState.save).toBe(true);
    expect(cancelState.theme).toBe('dark');
    expect(cancelState.coins).toBe(coinsBeforeReset);

    await page.evaluate(() => {
      window.confirm = () => true;
    });

    await page.click('#reset-game');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.gameInitialized === true, { timeout: 30000 });

    const confirmState = await page.evaluate(() => ({
      save: localStorage.getItem('idle_game_save'),
      theme: localStorage.getItem('gameTheme'),
      coins: window.rustGame.get_coins(),
    }));

    expect(confirmState.save).toBe(null);
    expect(confirmState.theme).toBe(null);
    expect(confirmState.coins).toBe(0);
    await expect(page.locator('body')).not.toHaveClass(/dark-theme/);
    await expect(page.locator('#theme-select-setting')).toHaveValue('light');
  });

  test('import requires pasted BASE64 content before continuing', async ({ page }) => {
    await openSettings(page);

    await page.evaluate(() => {
      window.__testAlerts = [];
      window.__testConfirms = [];
      window.alert = (message) => {
        window.__testAlerts.push(String(message));
      };
      window.confirm = (message) => {
        window.__testConfirms.push(String(message));
        return true;
      };
    });

    await page.locator('#import-export-text').fill('   ');
    await page.click('#import-base64');

    const result = await page.evaluate(() => ({
      alerts: window.__testAlerts.slice(),
      confirms: window.__testConfirms.slice(),
      coins: window.rustGame.get_coins(),
    }));

    expect(result.alerts).toContain('请先粘贴 BASE64 字符串。');
    expect(result.confirms).toHaveLength(0);
    expect(result.coins).toBe(0);
  });

  test('invalid BASE64 import shows failure alert without overwriting progress', async ({ page }) => {
    await openSettings(page);

    for (let i = 0; i < 5; i += 1) {
      await page.click('#coin-button');
    }

    const coinsBeforeImport = await getCoins(page);
    expect(coinsBeforeImport).toBeGreaterThan(0);

    await page.evaluate(() => {
      window.__testAlerts = [];
      window.__testConfirms = [];
      window.alert = (message) => {
        window.__testAlerts.push(String(message));
      };
      window.confirm = (message) => {
        window.__testConfirms.push(String(message));
        return true;
      };
    });

    await page.locator('#import-export-text').fill('not-valid-base64');
    await page.click('#import-base64');

    const result = await page.evaluate(() => ({
      alerts: window.__testAlerts.slice(),
      confirms: window.__testConfirms.slice(),
      coins: window.rustGame.get_coins(),
    }));

    expect(result.confirms).toContain('导入将覆盖当前游戏进度。确定继续吗？');
    expect(result.alerts.some((message) => message.startsWith('导入失败：'))).toBe(true);
    expect(result.coins).toBe(coinsBeforeImport);
  });
});
