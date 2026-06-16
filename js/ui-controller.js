/**
 * UI Controller - Tab navigation, theme, language, reset, version display.
 * Extracted from index.html inline script.
 */
(function () {
    'use strict';

    var _versionTimer = null;

    function onDOMReady() {
        initTabNavigation();
        initEventLogLoadMore();
        initTheme();
        initLanguage();
        initResetButton();
        initVersionDisplay();
    }

    function initTabNavigation() {
        var tabButtons = document.querySelectorAll('.tab-button');
        var tabContents = document.querySelectorAll('.tab-content');

        var _activeTab = null;

        tabButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                var tabName = this.getAttribute('data-tab');
                var wasActive = (tabName === _activeTab);

                tabButtons.forEach(function (btn) { btn.classList.remove('active'); });
                tabContents.forEach(function (content) { content.classList.remove('active'); });

                this.classList.add('active');
                var target = document.getElementById('tab-' + tabName);
                if (target) target.classList.add('active');
                _activeTab = tabName;

                if (wasActive) return;

                if (tabName === 'achievements' && window.achievementsManager) {
                    window.achievementsManager.renderAchievements();
                } else if (tabName === 'statistics' && window.statisticsManager) {
                    window.statisticsManager.renderToPanel('tab-statistics');
                } else if (tabName === 'unlocks' && window.unlockManager) {
                    window.unlockManager.renderUnlocks();
                } else if (tabName === 'events' && window.eventManager) {
                    window.eventManager.renderLogPanel(true);
                } else if (tabName === 'workers' && window.workerManager) {
                    window.workerManager.renderWorkers();
                } else if (tabName === 'technology' && window.technologyManager) {
                    window.technologyManager.renderToPanel('technology-panel');
                } else if (tabName === 'work' && window.workOverviewManager) {
                    window.workOverviewManager.renderToPanel('work-overview-panel');
                } else if (tabName === 'housing' && window.housingManager) {
                    window.housingManager.renderToPanel('housing-panel');
                } else if (tabName === 'lifecycle' && window.lifecycleManager) {
                    window.lifecycleManager.renderToPanel('lifecycle-panel');
                } else if (tabName === 'resources' && window.lifecycleManager && typeof window.lifecycleManager.renderResourceWidget === 'function') {
                    window.lifecycleManager.renderResourceWidget('banner-top-monitor');
                }
            });
        });
    }

    function initEventLogLoadMore() {
        var loadMoreButton = document.getElementById('event-log-load-more');
        if (!loadMoreButton) return;
        loadMoreButton.addEventListener('click', function () {
            if (window.eventManager) {
                window.eventManager.renderLogPanel(false, true);
            }
        });
    }

    function initTheme() {
        var savedTheme = localStorage.getItem('gameTheme') || 'light';

        function applyTheme(theme) {
            document.body.classList.remove('dark-theme');
            if (theme === 'dark') {
                document.body.classList.add('dark-theme');
            }
            var themeSelectSetting = document.getElementById('theme-select-setting');
            if (themeSelectSetting) themeSelectSetting.value = theme;
        }

        function saveTheme(theme) {
            localStorage.setItem('gameTheme', theme);
        }

        applyTheme(savedTheme);

        var themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = savedTheme;
            themeSelect.addEventListener('change', function () {
                var selected = this.value;
                applyTheme(selected);
                saveTheme(selected);
            });
        }

        var themeSelectSetting = document.getElementById('theme-select-setting');
        if (themeSelectSetting) {
            themeSelectSetting.addEventListener('change', function () {
                var selected = this.value;
                applyTheme(selected);
                saveTheme(selected);
            });
        }
    }

    function initLanguage() {
        var initialLanguage = localStorage.getItem('gameLanguage') || 'zh-CN';
        applyLanguage(initialLanguage);

        var languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = initialLanguage;
            languageSelect.addEventListener('change', function () {
                applyLanguage(this.value);
            });
        }

        var languageSelectSetting = document.getElementById('language-select-setting');
        if (languageSelectSetting) {
            languageSelectSetting.value = initialLanguage;
            languageSelectSetting.addEventListener('change', function () {
                var selected = this.value;
                applyLanguage(selected);
                var headerLangSelect = document.getElementById('language-select');
                if (headerLangSelect) headerLangSelect.value = selected;
            });
        }
    }

    function applyLanguage(lang) {
        if (window.i18n) {
            window.i18n.setLanguage(lang);
            window.i18n.updateAllTranslations();
        }
        document.documentElement.lang = lang;
    }

    function initResetButton() {
        var resetButton = document.getElementById('reset-game');
        if (!resetButton) return;
        resetButton.addEventListener('click', function () {
            var msg = window.i18n ? window.i18n.t('resetGameConfirm') : '确定要重置游戏吗？所有进度将丢失！';
            if (confirm(msg)) {
                localStorage.removeItem('idle_game_save');
                localStorage.removeItem('gameTheme');
                localStorage.removeItem('gameLanguage');
                location.reload();
            }
        });
    }

    function initVersionDisplay() {
        function updateVersion() {
            if (window.rustGame && typeof window.rustGame.get_version === 'function') {
                try {
                    var version = window.rustGame.get_version();
                    var versionEl = document.getElementById('version-number');
                    if (versionEl) versionEl.textContent = 'v' + version;
                    if (window.i18n && typeof window.i18n.updateSettingsVersionLabel === 'function') {
                        window.i18n.updateSettingsVersionLabel();
                    }
                    return true;
                } catch (e) {
                    console.warn('Failed to get version:', e);
                }
            }
            return false;
        }

        if (!updateVersion()) {
            _versionTimer = setInterval(pollVersion, 200);
        }

        function pollVersion() {
            if (updateVersion()) {
                clearInterval(_versionTimer);
                _versionTimer = null;
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onDOMReady);
    } else {
        onDOMReady();
    }
})();
