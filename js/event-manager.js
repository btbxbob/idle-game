class EventManager {
    constructor(rustGame) {
        this.rustGame = rustGame;
        this.pageSize = 20;
        this.loadedCount = 0;
        this.detailCache = new Map();
        this.observer = null;
        this.tickerRenderKey = '';
        this.logRenderKey = '';
        this.activeRenderKey = '';
        this.highlightTimer = null;
        this.boundHandleEventPanelClick = this.handleEventPanelClick.bind(this);
        this.interactionsBound = false;
    }

    t(key, paramsOrFallback = {}, fallback = key) {
        const params = typeof paramsOrFallback === 'object' && paramsOrFallback !== null && !Array.isArray(paramsOrFallback)
            ? paramsOrFallback
            : {};
        const finalFallback = typeof paramsOrFallback === 'string' ? paramsOrFallback : fallback;

        if (!window.i18n || typeof window.i18n.t !== 'function') {
            return finalFallback;
        }

        const translated = window.i18n.t(key, params);
        return translated === key ? finalFallback : translated;
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

    getActiveModifiers() {
        if (!this.rustGame || typeof this.rustGame.get_active_event_modifiers !== 'function') {
            return [];
        }

        try {
            const result = this.rustGame.get_active_event_modifiers();
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('Failed to get active event modifiers:', error);
            return [];
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

    getOutcome(event) {
        return event && typeof event.outcome === 'object' && event.outcome !== null ? event.outcome : {};
    }

    getOutcomeValue(outcome, snakeKey, camelKey = snakeKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())) {
        return Number(outcome?.[snakeKey] ?? outcome?.[camelKey] ?? 0) || 0;
    }

    formatOutcomeAmount(amount) {
        const numeric = Number(amount) || 0;
        return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1).replace(/\.0$/, '');
    }

    formatDurationMs(durationMs) {
        const totalSeconds = Math.max(0, Math.ceil((Number(durationMs) || 0) / 1000));
        if (totalSeconds >= 60) {
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
        }

        return `${totalSeconds}s`;
    }

    getRateLabel(resourceKey) {
        return this.t(resourceKey, resourceKey);
    }

    getStageLabel(stageId) {
        return this.t(`stage_${stageId}`, stageId || 'stage_genesis');
    }

    getOutcomeItems(event) {
        const outcome = this.getOutcome(event);
        const foodDelta = this.getOutcomeValue(outcome, 'food_delta');
        const corpseDelta = this.getOutcomeValue(outcome, 'corpse_delta');
        const maggotDelta = this.getOutcomeValue(outcome, 'maggot_delta');
        const workersKilled = this.getOutcomeValue(outcome, 'workers_killed');
        const workersInjured = this.getOutcomeValue(outcome, 'workers_injured');
        const happinessDelta = this.getOutcomeValue(outcome, 'happiness_delta');
        const coinsPerSecondDelta = this.getOutcomeValue(outcome, 'coins_per_second_delta');
        const woodPerSecondDelta = this.getOutcomeValue(outcome, 'wood_per_second_delta');
        const stonePerSecondDelta = this.getOutcomeValue(outcome, 'stone_per_second_delta');
        const foodPerSecondDelta = this.getOutcomeValue(outcome, 'food_per_second_delta');
        const maggotPerSecondDelta = this.getOutcomeValue(outcome, 'maggot_per_second_delta');
        const durationMs = this.getOutcomeValue(outcome, 'duration_ms');
        const durationSeconds = durationMs > 0 ? this.formatOutcomeAmount(durationMs / 1000) : '0';
        const items = [];

        if (foodDelta < 0) {
            items.push({
                text: this.t('eventOutcome_foodLoss', { amount: this.formatOutcomeAmount(Math.abs(foodDelta)) }),
                tone: 'negative'
            });
        }
        if (corpseDelta > 0) {
            items.push({
                text: this.t('eventOutcome_corpseGain', { amount: this.formatOutcomeAmount(corpseDelta) }),
                tone: 'negative'
            });
        }
        if (maggotDelta > 0) {
            items.push({
                text: this.t('eventOutcome_maggotGain', { amount: this.formatOutcomeAmount(maggotDelta) }),
                tone: 'warning'
            });
        }
        if (workersKilled > 0) {
            items.push({
                text: this.t('eventOutcome_workersKilled', { count: this.formatOutcomeAmount(workersKilled) }),
                tone: 'negative'
            });
        }
        if (workersInjured > 0) {
            items.push({
                text: this.t('eventOutcome_workersInjured', { count: this.formatOutcomeAmount(workersInjured) }),
                tone: 'warning'
            });
        }
        if (happinessDelta < 0) {
            items.push({
                text: this.t('eventOutcome_happinessLoss', { amount: this.formatOutcomeAmount(happinessDelta) }),
                tone: 'negative'
            });
        }

        [
            { amount: coinsPerSecondDelta, resourceKey: 'coins' },
            { amount: woodPerSecondDelta, resourceKey: 'wood' },
            { amount: stonePerSecondDelta, resourceKey: 'stone' },
            { amount: foodPerSecondDelta, resourceKey: 'food' },
            { amount: maggotPerSecondDelta, resourceKey: 'maggot' }
        ].forEach(({ amount, resourceKey }) => {
            if (!amount || durationMs <= 0) {
                return;
            }

            items.push({
                text: this.t('eventOutcome_rateChange', {
                    resource: this.getRateLabel(resourceKey),
                    amount: `${amount > 0 ? '+' : ''}${this.formatOutcomeAmount(amount)}`,
                    seconds: durationSeconds
                }),
                tone: amount > 0 ? 'positive' : 'negative'
            });
        });

        return items;
    }

    renderOutcomeStrip(event) {
        const items = this.getOutcomeItems(event);
        if (!items.length) {
            return '';
        }

        const chips = items
            .map((item) => `<span class="event-news-outcome-chip ${this.escapeHtml(item.tone)}">${this.escapeHtml(item.text)}</span>`)
            .join('');

        return `<div class="event-news-outcomes">${chips}</div>`;
    }

    renderActiveModifiers() {
        const panel = document.getElementById('event-active-list');
        if (!panel) {
            return;
        }

        const modifiers = this.getActiveModifiers();
        const languageKey = this.isEnglish() ? 'en' : 'zh';
        const renderKey = `${languageKey}|${modifiers.map((modifier) => `${modifier.event_id || modifier.eventId}:${Math.ceil(Number(modifier.remaining_ms || modifier.remainingMs || 0))}`).join('|')}`;
        if (this.activeRenderKey === renderKey) {
            return;
        }

        if (!modifiers.length) {
            panel.innerHTML = `<div class="event-active-empty">${this.escapeHtml(this.t('eventActiveEmpty', 'No temporary event effects are currently active'))}</div>`;
            this.activeRenderKey = renderKey;
            return;
        }

        const groups = new Map();
        modifiers.forEach((modifier) => {
            const stageId = modifier.stage_id || modifier.stageId || 'stage_genesis';
            if (!groups.has(stageId)) {
                groups.set(stageId, []);
            }
            groups.get(stageId).push(modifier);
        });

        panel.innerHTML = Array.from(groups.entries()).map(([stageId, stageModifiers]) => {
            const cards = stageModifiers.map((modifier) => {
                const headline = this.isEnglish()
                    ? (modifier.headline_en || modifier.headlineEn || modifier.headline_zh || modifier.headlineZh || modifier.scenario_id || '')
                    : (modifier.headline_zh || modifier.headlineZh || modifier.headline_en || modifier.headlineEn || modifier.scenario_id || '');
                const remainingMs = Number(modifier.remaining_ms || modifier.remainingMs || 0) || 0;
                const eventId = Number(modifier.event_id || modifier.eventId || 0) || 0;
                const items = this.getOutcomeItems(modifier)
                    .map((item) => `<span class="event-news-outcome-chip ${this.escapeHtml(item.tone)}">${this.escapeHtml(item.text)}</span>`)
                    .join('');

                return `
                    <article class="event-active-card">
                        <div class="event-active-card-header">
                            <div class="event-active-card-title-wrap">
                                <h4>${this.escapeHtml(headline)}</h4>
                                <button type="button" class="event-active-source" data-event-source-id="${eventId}">${this.escapeHtml(this.t('eventActiveSource', { id: eventId }))}</button>
                            </div>
                            <span class="event-active-remaining">${this.escapeHtml(this.t('eventActiveRemaining', { time: this.formatDurationMs(remainingMs) }))}</span>
                        </div>
                        <div class="event-news-outcomes">${items}</div>
                    </article>
                `;
            }).join('');

            return `
                <section class="event-active-group">
                    <div class="event-active-group-label">${this.escapeHtml(this.getStageLabel(stageId))}</div>
                    <div class="event-active-group-cards">${cards}</div>
                </section>
            `;
        }).join('');
        this.activeRenderKey = renderKey;
    }

    bindInteractions() {
        if (this.interactionsBound) {
            return;
        }

        const eventsTab = document.getElementById('tab-events');
        if (!eventsTab) {
            return;
        }

        eventsTab.addEventListener('click', this.boundHandleEventPanelClick);
        this.interactionsBound = true;
    }

    handleEventPanelClick(event) {
        const trigger = event.target instanceof Element
            ? event.target.closest('[data-event-source-id]')
            : null;
        if (!trigger) {
            return;
        }

        const eventId = Number(trigger.getAttribute('data-event-source-id') || 0);
        if (!eventId) {
            return;
        }

        this.jumpToEventCard(eventId);
    }

    jumpToEventCard(eventId) {
        const total = this.getEventLogCount();
        while (this.loadedCount < total && !document.querySelector(`#event-log-list .event-news-card[data-event-id="${eventId}"]`)) {
            this.renderLogPanel(false, true);
        }

        const card = document.querySelector(`#event-log-list .event-news-card[data-event-id="${eventId}"]`);
        if (!card) {
            return;
        }

        this.hydrateEventCard(card);
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('event-news-card-linked');

        if (this.highlightTimer) {
            window.clearTimeout(this.highlightTimer);
        }

        this.highlightTimer = window.setTimeout(() => {
            card.classList.remove('event-news-card-linked');
            this.highlightTimer = null;
        }, 1800);
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
                ${this.renderOutcomeStrip(event)}
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

    window.eventManager.bindInteractions();
    window.eventManager.renderTicker();
    window.eventManager.renderActiveModifiers();
    const eventsTab = document.getElementById('tab-events');
    if (eventsTab && eventsTab.classList.contains('active')) {
                        window.eventManager.renderLogPanel(forceReset, false);
    }
};
