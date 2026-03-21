const { test, expect } = require('../fixtures/coverage');

test.describe('EventManager coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('ticker caches repeated headlines and clears when breaking feed empties', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.eventManager) {
                return { ok: false, reason: 'missing manager' };
            }

            const sequences = [
                [{ headline_zh: '头条一', headline_en: 'Headline One' }],
                [{ headline_zh: '头条一', headline_en: 'Headline One' }],
                [],
            ];
            let sequenceIndex = 0;

            window.eventManager.rustGame = {
                get_breaking_event_titles: () => {
                    const next = sequences[Math.min(sequenceIndex, sequences.length - 1)];
                    sequenceIndex += 1;
                    return next;
                },
            };

            const ticker = document.getElementById('emergency-ticker');
            window.eventManager.tickerRenderKey = '';

            window.eventManager.renderTicker();
            const firstHtml = ticker.innerHTML;
            const firstText = ticker.textContent || '';
            const firstActive = ticker.classList.contains('active');

            window.eventManager.renderTicker();
            const secondHtml = ticker.innerHTML;
            const secondActive = ticker.classList.contains('active');

            window.eventManager.renderTicker();

            return {
                ok: true,
                firstHtmlLength: firstHtml.length,
                firstText,
                firstActive,
                secondMatchesFirst: secondHtml === firstHtml,
                secondActive,
                clearedHtml: ticker.innerHTML,
                clearedActive: ticker.classList.contains('active'),
                tickerRenderKey: window.eventManager.tickerRenderKey,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.firstHtmlLength).toBeGreaterThan(0);
        expect(result.firstText).toContain('头条一');
        expect(result.firstActive).toBe(true);
        expect(result.secondMatchesFirst).toBe(true);
        expect(result.secondActive).toBe(true);
        expect(result.clearedHtml).toBe('');
        expect(result.clearedActive).toBe(false);
        expect(result.tickerRenderKey).toBe('');
    });

    test('log panel paginates summaries and updates load-more state', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.eventManager) {
                return { ok: false, reason: 'missing manager' };
            }

            const summaries = Array.from({ length: 25 }, (_, index) => ({
                event_id: index + 1,
                eventId: index + 1,
                timestamp: Date.now() - index * 60000,
                category: index % 2 === 0 ? 'industrial_progress' : 'accident',
                impact: index % 3 === 0 ? 'critical' : 'major',
                worker_name: index === 0 ? 'Lan' : '',
                worker_trait: index === 0 ? 'Calm' : '',
                headline_zh: `事件 ${index + 1}`,
                headline_en: `Event ${index + 1}`,
            }));

            const requested = [];
            window.eventManager.rustGame = {
                get_event_log_count: () => summaries.length,
                get_event_log_summaries: (offset, limit) => {
                    requested.push({ offset, limit });
                    return summaries.slice(offset, offset + limit);
                },
                get_event_log_detail: () => null,
            };

            window.eventManager.detailCache.clear();
            window.eventManager.renderLogPanel(true, false);

            const meta = document.getElementById('event-log-meta');
            const loadMore = document.getElementById('event-log-load-more');
            const panel = document.getElementById('event-log-list');

            const firstPass = {
                meta: meta.textContent,
                buttonText: loadMore.textContent,
                disabled: loadMore.disabled,
                count: panel.querySelectorAll('.event-news-card').length,
                firstId: panel.querySelector('.event-news-card')?.dataset?.eventId || null,
            };

            window.eventManager.renderLogPanel(false, true);

            const secondPass = {
                meta: meta.textContent,
                buttonText: loadMore.textContent,
                disabled: loadMore.disabled,
                count: panel.querySelectorAll('.event-news-card').length,
                lastId: panel.querySelector('.event-news-card:last-child')?.dataset?.eventId || null,
            };

            return {
                ok: true,
                requested,
                firstPass,
                secondPass,
                loadedCount: window.eventManager.loadedCount,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.requested).toEqual([
            { offset: 0, limit: 20 },
            { offset: 0, limit: 25 },
        ]);
        expect(result.firstPass.meta).toBe('20/25');
        expect(result.firstPass.disabled).toBe(false);
        expect(result.firstPass.buttonText).toContain('加载更早报道');
        expect(result.firstPass.count).toBe(20);
        expect(result.firstPass.firstId).toBe('1');
        expect(result.secondPass.meta).toBe('25/25');
        expect(result.secondPass.disabled).toBe(true);
        expect(result.secondPass.buttonText).toContain('没有更早的报道了');
        expect(result.secondPass.count).toBe(25);
        expect(result.secondPass.lastId).toBe('25');
        expect(result.loadedCount).toBe(25);
    });

    test('visible cards hydrate once through the observer and use language fallback fields', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.eventManager || !window.i18n) {
                return { ok: false, reason: 'missing manager or i18n' };
            }

            const originalLanguage = window.i18n.getCurrentLanguage();
            window.i18n.setLanguage('en');

            const observerState = {
                observed: [],
                unobserved: [],
                disconnected: 0,
                rootMargin: null,
                callback: null,
            };
            const OriginalIntersectionObserver = window.IntersectionObserver;
            window.IntersectionObserver = class FakeIntersectionObserver {
                constructor(callback, options = {}) {
                    observerState.callback = callback;
                    observerState.rootMargin = options.rootMargin || null;
                }

                observe(element) {
                    observerState.observed.push(element.dataset.eventId);
                }

                unobserve(element) {
                    observerState.unobserved.push(element.dataset.eventId);
                }

                disconnect() {
                    observerState.disconnected += 1;
                }
            };

            let detailCalls = 0;
            window.eventManager.rustGame = {
                get_event_log_count: () => 1,
                get_event_log_summaries: () => [{
                    event_id: 42,
                    eventId: 42,
                    timestamp: Date.now(),
                    category: 'rumor',
                    impact: 'flavor',
                    worker_name: 'Qin',
                    worker_trait: 'Curious',
                    headline_zh: '传闻标题',
                }],
                get_event_log_detail: () => {
                    detailCalls += 1;
                    return {
                        event_id: 42,
                        headline_zh: '传闻标题',
                        body_zh: '只有中文正文，用于测试英文回退。',
                        opinion_zh: '工人坚持这不是巧合。',
                        category: 'rumor',
                        impact: 'flavor',
                    };
                },
            };

            window.eventManager.detailCache.clear();
            window.eventManager.renderLogPanel(true, false);
            const article = document.querySelector('#event-log-list .event-news-card');
            const headlineBefore = article.querySelector('.event-news-headline')?.textContent || '';
            const bodyClassBefore = article.querySelector('.event-news-body')?.className || '';
            const pendingBefore = article.querySelector('.event-news-interview')?.classList.contains('pending') || false;

            observerState.callback([{ isIntersecting: true, target: article }]);
            window.eventManager.hydrateEventCard(article);

            const headlineAfter = article.querySelector('.event-news-headline')?.textContent || '';
            const bodyAfter = article.querySelector('.event-news-body')?.textContent || '';
            const quoteAfter = article.querySelector('.event-news-interview blockquote')?.textContent || '';
            const pendingAfter = article.querySelector('.event-news-interview')?.classList.contains('pending') || false;
            const loadedAfter = article.dataset.loaded;

            window.IntersectionObserver = OriginalIntersectionObserver;
            window.i18n.setLanguage(originalLanguage);

            return {
                ok: true,
                headlineBefore,
                bodyClassBefore,
                pendingBefore,
                headlineAfter,
                bodyAfter,
                quoteAfter,
                pendingAfter,
                loadedAfter,
                detailCalls,
                observed: observerState.observed,
                unobserved: observerState.unobserved,
                disconnected: observerState.disconnected,
                rootMargin: observerState.rootMargin,
            };
        });

        expect(result.ok).toBe(true);
        expect(result.headlineBefore).toBe('');
        expect(result.bodyClassBefore).toContain('skeleton-body');
        expect(result.pendingBefore).toBe(true);
        expect(result.headlineAfter).toBe('传闻标题');
        expect(result.bodyAfter).toContain('只有中文正文');
        expect(result.quoteAfter).toContain('不是巧合');
        expect(result.pendingAfter).toBe(false);
        expect(result.loadedAfter).toBe('true');
        expect(result.detailCalls).toBe(1);
        expect(result.observed).toEqual(['42']);
        expect(result.unobserved).toEqual(['42']);
        expect(result.disconnected).toBe(0);
        expect(result.rootMargin).toBe('240px 0px');
    });
});
