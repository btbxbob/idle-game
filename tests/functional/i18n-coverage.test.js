const { test, expect } = require('../fixtures/coverage');

test.describe('I18n coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('language switching, translation fallback, and DOM update branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.i18n || typeof window.i18n.constructor !== 'function') {
                return { ok: false, reason: 'missing i18n' };
            }

            const i18n = new window.i18n.constructor();

            const createdNodes = [];
            const appendNode = (tag, id, parent = document.body) => {
                const node = document.createElement(tag);
                node.id = id;
                parent.appendChild(node);
                createdNodes.push(node);
                return node;
            };

            appendNode('span', 'coins');
            appendNode('span', 'wood');
            appendNode('span', 'stone');
            appendNode('span', 'cps');
            appendNode('span', 'wps');
            appendNode('span', 'sps');
            appendNode('span', 'cpc');
            appendNode('span', 'coin-display');

            const themeSelect = document.getElementById('theme-select-setting');
            const languageSelect = document.getElementById('language-select-setting');
            const themeLabel = themeSelect ? themeSelect.previousElementSibling : null;
            const languageLabel = languageSelect ? languageSelect.previousElementSibling : null;
            if (!themeSelect || !languageSelect || !themeLabel || !languageLabel) {
                return { ok: false, reason: 'missing settings DOM' };
            }

            const validLanguage = i18n.setLanguage('en');
            const invalidLanguage = i18n.setLanguage('fr');
            const currentLanguage = i18n.getCurrentLanguage();
            const languages = i18n.getAvailableLanguages();

            delete i18n.translations.en.onlyEnglishKey;
            i18n.translations.en.onlyEnglishKey = 'English Only Value';
            delete i18n.translations['zh-CN'].onlyEnglishKey;
            i18n.setLanguage('zh-CN');

            const englishFallback = i18n.t('onlyEnglishKey');
            const missingFallback = i18n.t('totallyMissingKey');
            const interpolated = i18n.t('minutesAgo', { count: 5 });

            i18n.updateAllTranslations();
            i18n.updateElement('footer-text', 'footerText');
            i18n.updateLabel('theme-select-setting', 'theme');
            i18n.updateLabel('language-select-setting', 'language');
            i18n.updateResourceDisplays(NaN, 3.9, Infinity, NaN, 2.34, Infinity, NaN);

            const gameTitle = document.getElementById('game-title')?.textContent || '';
            const workersPlaceholder = document.getElementById('workers-placeholder')?.textContent || '';
            const workersList = document.getElementById('workers-list')?.textContent || '';
            const coinsText = document.getElementById('coins')?.textContent || '';
            const woodText = document.getElementById('wood')?.textContent || '';
            const stoneText = document.getElementById('stone')?.textContent || '';
            const cpsText = document.getElementById('cps')?.textContent || '';
            const wpsText = document.getElementById('wps')?.textContent || '';
            const spsText = document.getElementById('sps')?.textContent || '';
            const cpcText = document.getElementById('cpc')?.textContent || '';
            const coinDisplay = document.getElementById('coin-display')?.textContent || '';
            const themeLabelText = themeLabel.textContent || '';
            const languageLabelText = languageLabel.textContent || '';
            const resetText = document.getElementById('reset-game')?.textContent || '';
            const saveLoadTitle = document.getElementById('save-load-title')?.textContent || '';

            createdNodes.forEach((node) => {
                node.remove();
            });

            return {
                ok: true,
                validLanguage,
                invalidLanguage,
                currentLanguage,
                languages,
                englishFallback,
                missingFallback,
                interpolated,
                gameTitle,
                workersPlaceholder,
                workersList,
                coinsText,
                woodText,
                stoneText,
                cpsText,
                wpsText,
                spsText,
                cpcText,
                coinDisplay,
                themeLabelText,
                languageLabelText,
                resetText,
                saveLoadTitle,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.validLanguage).toBe(true);
        expect(result.invalidLanguage).toBe(false);
        expect(result.currentLanguage).toBe('en');
        expect(result.languages).toEqual(expect.arrayContaining(['en', 'zh-CN']));
        expect(result.englishFallback).toBe('English Only Value');
        expect(result.missingFallback).toBe('totallyMissingKey');
        expect(result.interpolated).toBe('5分钟前');
        expect(result.gameTitle).toContain('Rust WASM');
        expect(result.workersList).toContain('没有工人');
        expect(result.coinsText).toBe('金币: 0');
        expect(result.woodText).toBe('木头: 3');
        expect(result.stoneText).toBe('石头: 0');
        expect(result.cpsText).toBe('金币/秒：0.0');
        expect(result.wpsText).toBe('木头/秒：2.3');
        expect(result.spsText).toBe('石头/秒：0.0');
        expect(result.cpcText).toBe('金币/点击：0.0');
        expect(result.coinDisplay).toBe('0');
        expect(result.themeLabelText).toBe('主题 / Theme');
        expect(result.languageLabelText).toBe('语言 / Language');
        expect(result.resetText).toBe('重置游戏');
        expect(result.saveLoadTitle).toBe('保存/加载游戏');
    });
});
