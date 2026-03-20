class EventManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
        this.pageSize = 20;
        this.loadedCount = 0;
        this.detailCache = new Map();
        this.observer = null;
        this.tickerRenderKey = '';
        this.logRenderKey = '';
    }

    t(key, fallback = key) {
        if (!window.i18n || typeof window.i18n.t !== 'function') {
            return fallback;
        }

        const translated = window.i18n.t(key);
        return translated === key ? fallback : translated;
    }

    isEnglish() {
        return window.i18n && typeof window.i18n.getCurrentLanguage === 'function'
            ? window.i18n.getCurrentLanguage() === 'en'
            : false;
    }

    getBreakingEvents(limit = 5) {
        if (!this.rustGame || typeof this.rustGame.get_breaking_event_titles !== 'function') {
            return [];
        }

        try {
            const result = this.rustGame.get_breaking_event_titles(limit);
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('Failed to get breaking events:', error);
            return [];
        }
    }

    getEventSummaries(offset, limit) {
        if (!this.rustGame || typeof this.rustGame.get_event_log_summaries !== 'function') {
            return [];
        }

        try {
            const result = this.rustGame.get_event_log_summaries(offset, limit);
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('Failed to get event summaries:', error);
            return [];
        }
    }

    getEventDetail(eventId) {
        if (this.detailCache.has(eventId)) {
            return this.detailCache.get(eventId);
        }

        if (!this.rustGame || typeof this.rustGame.get_event_log_detail !== 'function') {
            return null;
        }

        try {
            const result = this.rustGame.get_event_log_detail(eventId);
            if (result) {
                this.detailCache.set(eventId, result);
            }
            return result;
        } catch (error) {
            console.error('Failed to get event detail:', error);
            return null;
        }
    }

    getEventLogCount() {
        if (!this.rustGame || typeof this.rustGame.get_event_log_count !== 'function') {
            return 0;
        }

        try {
            return Number(this.rustGame.get_event_log_count()) || 0;
        } catch (error) {
            console.error('Failed to get event log count:', error);
            return 0;
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(Number(timestamp) || 0);
        return date.toLocaleString(this.isEnglish() ? 'en-US' : 'zh-CN', {
            hour12: false,
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getHeadline(event) {
        return this.isEnglish() ? (event.headline_en || event.headlineEn || event.headline_zh) : (event.headline_zh || event.headlineZh || event.headline_en);
    }

    getBody(event) {
        return this.isEnglish() ? (event.body_en || event.bodyEn || event.body_zh) : (event.body_zh || event.bodyZh || event.body_en);
    }

    getOpinion(event) {
        return this.isEnglish() ? (event.opinion_en || event.opinionEn || event.opinion_zh || '') : (event.opinion_zh || event.opinionZh || event.opinion_en || '');
    }

    getCategoryLabel(event) {
        const category = event.category || 'industrial_progress';
        return this.t(`eventCategory_${category}`, category);
    }

    getImpactLabel(event) {
        const impact = event.impact || 'flavor';
        return this.t(`eventImpact_${impact}`, impact);
    }

    escapeHtml(value) {
        return String(value || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    renderTicker() {
        const container = document.getElementById('emergency-ticker');
        if (!container) {
            return;
        }

        const events = this.getBreakingEvents(6);
        if (!events.length) {
            if (this.tickerRenderKey) {
                container.innerHTML = '';
                container.classList.remove('active');
                this.tickerRenderKey = '';
            }
            return;
        }

        const isEnglish = this.isEnglish();
        const label = this.t('eventTickerLabel', 'Breaking');
        const headlines = events.map((event) => isEnglish
            ? (event.headlineEn || event.headline_en || event.headlineZh || event.headline_zh || '')
            : (event.headlineZh || event.headline_zh || event.headlineEn || event.headline_en || '')
        );
        const renderKey = `${isEnglish ? 'en' : 'zh'}|${label}|${headlines.join('||')}`;

        if (this.tickerRenderKey === renderKey) {
            if (!container.classList.contains('active')) {
                container.classList.add('active');
            }
            return;
        }

        const items = [...headlines, ...headlines]
            .map((headline) => `<span class="event-ticker-item">${this.escapeHtml(headline)}</span>`)
            .join('');

        container.classList.add('active');
        container.innerHTML = `
            <div class="event-ticker-label">${this.escapeHtml(label)}</div>
            <div class="event-ticker-track-wrap">
                <div class="event-ticker-track">${items}</div>
            </div>
        `;
        this.tickerRenderKey = renderKey;
    }

    renderLogPanel(reset = false, append = false) {
        const panel = document.getElementById('event-log-list');
        const meta = document.getElementById('event-log-meta');
        const loadMore = document.getElementById('event-log-load-more');
        if (!panel) {
            return;
        }

        if (reset) {
            this.loadedCount = 0;
            this.logRenderKey = '';
        }

        const total = this.getEventLogCount();
        const targetCount = append ? this.loadedCount + this.pageSize : (this.loadedCount || this.pageSize);
        const languageKey = this.isEnglish() ? 'en' : 'zh';
        const renderKey = `${languageKey}|${total}|${targetCount}|${append ? 'append' : 'steady'}`;

        if (!reset && !append && this.logRenderKey === renderKey) {
            if (meta) {
                meta.textContent = `${this.loadedCount}/${total}`;
            }

            if (loadMore) {
                const hasMore = this.loadedCount < total;
                loadMore.disabled = !hasMore;
                loadMore.textContent = hasMore ? this.t('eventLoadMore', 'Load Older Reports') : this.t('eventNoMore', 'No older reports');
            }
            return;
        }

        const batch = this.getEventSummaries(0, Math.min(targetCount, total || this.pageSize));

        if (reset || !append) {
            panel.innerHTML = '';
        }

        if (!batch.length && targetCount === 0) {
            panel.innerHTML = `<div class="event-empty-state">${this.escapeHtml(this.t('eventEmpty', 'No event coverage yet'))}</div>`;
        } else if (batch.length) {
            const html = batch.map((event, index) => this.renderEventShell(event, index === 0)).join('');
            panel.innerHTML = html;
            this.loadedCount = batch.length;
            this.observeVisibleCards();
        }

        if (meta) {
            meta.textContent = `${this.loadedCount}/${total}`;
        }

        if (loadMore) {
            const hasMore = this.loadedCount < total;
            loadMore.disabled = !hasMore;
            loadMore.textContent = hasMore ? this.t('eventLoadMore', 'Load Older Reports') : this.t('eventNoMore', 'No older reports');
        }

        this.logRenderKey = `${languageKey}|${total}|${this.loadedCount}|steady`;
    }

    renderEventShell(event, featured = false) {
        const eventId = event.event_id || event.eventId;
        const workerName = event.worker_name || event.workerName || '';
        const workerTrait = event.worker_trait || event.workerTrait || '';
        return `
            <article class="event-news-card ${featured ? 'featured' : ''}" data-event-id="${eventId}">
                <div class="event-news-meta-row">
                    <span class="event-news-category">${this.escapeHtml(this.getCategoryLabel(event))}</span>
                    <span class="event-news-impact ${this.escapeHtml(event.impact || 'flavor')}">${this.escapeHtml(this.getImpactLabel(event))}</span>
                    <time class="event-news-time">${this.escapeHtml(this.formatTimestamp(event.timestamp))}</time>
                </div>
                <h3 class="event-news-headline skeleton-line skeleton-line-title"></h3>
                <div class="event-news-body skeleton-body">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
                ${workerName ? `
                    <div class="event-news-interview pending">
                        <div class="event-news-interview-label">${this.escapeHtml(this.t('eventInterviewLabel', 'Worker Interview'))}</div>
                        <div class="event-news-interview-name">${this.escapeHtml(workerName)}${workerTrait ? ` · ${this.escapeHtml(workerTrait)}` : ''}</div>
                        <blockquote class="event-news-interview-placeholder"></blockquote>
                    </div>
                ` : ''}
            </article>
        `;
    }

    hydrateEventCard(article) {
        const eventId = Number(article?.dataset?.eventId || 0);
        if (!eventId || article.dataset.loaded === 'true') {
            return;
        }

        const detail = this.getEventDetail(eventId);
        if (!detail) {
            return;
        }

        const headline = this.getHeadline(detail);
        const body = this.getBody(detail);
        const opinion = this.getOpinion(detail);
        const headlineElement = article.querySelector('.event-news-headline');
        const bodyElement = article.querySelector('.event-news-body');
        const quoteElement = article.querySelector('.event-news-interview blockquote');
        const interviewElement = article.querySelector('.event-news-interview');

        if (headlineElement) {
            headlineElement.className = 'event-news-headline';
            headlineElement.textContent = headline;
        }
        if (bodyElement) {
            bodyElement.className = 'event-news-body';
            bodyElement.textContent = body;
        }
        if (interviewElement) {
            interviewElement.classList.remove('pending');
        }
        if (quoteElement) {
            quoteElement.textContent = opinion || '';
            if (!opinion) {
                quoteElement.remove();
            }
        }

        article.dataset.loaded = 'true';
    }

    observeVisibleCards() {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.hydrateEventCard(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '240px 0px'
        });

        document.querySelectorAll('#event-log-list .event-news-card').forEach((card) => {
            if (card.dataset.loaded !== 'true') {
                this.observer.observe(card);
            }
        });
    }
}

window.EventManager = EventManager;

window.updateEventPanel = function(forceReset = false) {
    if (!window.eventManager) {
        return;
    }

    window.eventManager.renderTicker();
    const eventsTab = document.getElementById('tab-events');
    if (eventsTab && eventsTab.classList.contains('active')) {
                        window.eventManager.renderLogPanel(forceReset, false);
    }
};
