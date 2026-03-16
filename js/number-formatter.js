(() => {
    const PLAIN_THRESHOLD = 10_000_000;
    const MAX_SIGNIFICANT_DIGITS = 7;

    function normalizeNumber(value) {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : 0;
    }

    function trimFraction(text) {
        if (!text.includes('.')) {
            return text;
        }

        return text.replace(/0+$/u, '').replace(/\.$/u, '');
    }

    function formatScientific(value, significantDigits = MAX_SIGNIFICANT_DIGITS) {
        const numeric = normalizeNumber(value);
        if (numeric === 0) {
            return '0';
        }

        const sign = numeric < 0 ? '-' : '';
        const absolute = Math.abs(numeric);
        const exponent = Math.floor(Math.log10(absolute));
        const mantissa = absolute / (10 ** exponent);
        const fractionDigits = Math.max(0, significantDigits - 1);
        const mantissaText = trimFraction(mantissa.toFixed(fractionDigits));

        return `${sign}${mantissaText}e${exponent}`;
    }

    function formatWholeNumber(value, options = {}) {
        const numeric = normalizeNumber(value);
        const floorMode = options.floor !== false;
        const whole = floorMode
            ? (numeric < 0 ? Math.ceil(numeric) : Math.floor(numeric))
            : numeric;
        const absolute = Math.abs(whole);

        if (absolute >= PLAIN_THRESHOLD) {
            return formatScientific(whole, options.significantDigits);
        }

        return whole.toLocaleString(options.locale || undefined, {
            maximumFractionDigits: 0,
        });
    }

    function formatCompactWholeNumber(value, options = {}) {
        return formatWholeNumber(value, {
            ...options,
            significantDigits: options.significantDigits ?? 1,
        });
    }

    function formatRate(value, options = {}) {
        const numeric = normalizeNumber(value);
        const absolute = Math.abs(numeric);
        const signPrefix = options.includeSign && numeric > 0 ? '+' : '';

        if (absolute >= PLAIN_THRESHOLD) {
            return `${signPrefix}${formatScientific(numeric, options.significantDigits)}`;
        }

        const digits = options.fractionDigits ?? 1;
        return `${signPrefix}${numeric.toFixed(digits)}`;
    }

    function formatDecimal(value, options = {}) {
        const numeric = normalizeNumber(value);
        const digits = options.fractionDigits ?? 1;
        const absolute = Math.abs(numeric);
        const signPrefix = options.includeSign && numeric > 0 ? '+' : '';

        if (absolute >= PLAIN_THRESHOLD) {
            return `${signPrefix}${formatScientific(numeric, options.significantDigits)}`;
        }

        return `${signPrefix}${trimFraction(numeric.toFixed(digits))}`;
    }

    function formatPercent(value, options = {}) {
        const digits = options.fractionDigits ?? 1;
        const numeric = normalizeNumber(value);
        return `${formatDecimal(numeric, { fractionDigits: digits, includeSign: options.includeSign })}%`;
    }

    function parseDisplayedNumber(text) {
        const raw = String(text || '').trim();
        if (!raw) {
            return 0;
        }

        const normalized = raw.replace(/,/gu, '');
        const direct = Number(normalized);
        if (Number.isFinite(direct)) {
            return direct;
        }

        const match = normalized.match(/-?[0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?/iu);
        if (!match) {
            return 0;
        }

        const parsed = Number(match[0]);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    window.NumberFormatter = {
        PLAIN_THRESHOLD,
        MAX_SIGNIFICANT_DIGITS,
        formatCompactInteger: formatCompactWholeNumber,
        formatInteger: formatWholeNumber,
        formatResource: formatWholeNumber,
        formatRate,
        formatDecimal,
        formatPercent,
        formatScientific,
        parseDisplayedNumber,
    };
})();
