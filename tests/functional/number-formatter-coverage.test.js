const { test, expect } = require('../fixtures/coverage');

test.describe('NumberFormatter coverage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
        await page.waitForFunction(() => window.gameInitialized === true, null, { timeout: 60000 });
    });

    test('scientific, decimal, sign and parse branches execute', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (!window.NumberFormatter) {
                return { ok: false, reason: 'missing formatter' };
            }

            return {
                ok: true,
                scientificZero: window.NumberFormatter.formatScientific(0),
                scientificPositive: window.NumberFormatter.formatScientific(123456789),
                scientificNegative: window.NumberFormatter.formatScientific(-987654321, 3),
                integerFloorPositive: window.NumberFormatter.formatInteger(1234.9),
                integerFloorNegative: window.NumberFormatter.formatInteger(-1234.9),
                integerNoFloor: window.NumberFormatter.formatInteger(1234.9, { floor: false }),
                compactSmall: window.NumberFormatter.formatCompactInteger(9876),
                compactLarge: window.NumberFormatter.formatCompactInteger(10000000),
                ratePlainPositive: window.NumberFormatter.formatRate(12.34, { includeSign: true, fractionDigits: 2 }),
                ratePlainNegative: window.NumberFormatter.formatRate(-0.5, { includeSign: true, fractionDigits: 1 }),
                rateScientific: window.NumberFormatter.formatRate(12345678, { includeSign: true, significantDigits: 2 }),
                decimalTrimmed: window.NumberFormatter.formatDecimal(12.30, { fractionDigits: 2 }),
                decimalSigned: window.NumberFormatter.formatDecimal(4.2, { includeSign: true, fractionDigits: 2 }),
                decimalScientific: window.NumberFormatter.formatDecimal(12345678, { includeSign: true, significantDigits: 3 }),
                percentDefault: window.NumberFormatter.formatPercent(12.345),
                percentSigned: window.NumberFormatter.formatPercent(9.876, { includeSign: true, fractionDigits: 0 }),
                parseBlank: window.NumberFormatter.parseDisplayedNumber(''),
                parseDirect: window.NumberFormatter.parseDisplayedNumber('1,234.5'),
                parseEmbeddedScientific: window.NumberFormatter.parseDisplayedNumber('Value: -1.25e3 units'),
                parseNoMatch: window.NumberFormatter.parseDisplayedNumber('nothing here'),
                parseGarbage: window.NumberFormatter.parseDisplayedNumber('Infinity???'),
                parseInvalidValueFallback: window.NumberFormatter.formatDecimal('not-a-number', { includeSign: true, fractionDigits: 1 }),
            };
        });

        expect(result.ok).toBe(true);
        expect(result.scientificZero).toBe('0');
        expect(result.scientificPositive).toBe('1.234568e8');
        expect(result.scientificNegative).toBe('-9.88e8');
        expect(result.integerFloorPositive).toBe('1,234');
        expect(result.integerFloorNegative).toBe('-1,234');
        expect(result.integerNoFloor).toBe('1,235');
        expect(result.compactSmall).toBe('9,876');
        expect(result.compactLarge).toBe('1e7');
        expect(result.ratePlainPositive).toBe('+12.34');
        expect(result.ratePlainNegative).toBe('-0.5');
        expect(result.rateScientific).toBe('+1.2e7');
        expect(result.decimalTrimmed).toBe('12.3');
        expect(result.decimalSigned).toBe('+4.2');
        expect(result.decimalScientific).toBe('+1.23e7');
        expect(result.percentDefault).toBe('12.3%');
        expect(result.percentSigned).toBe('+10%');
        expect(result.parseBlank).toBe(0);
        expect(result.parseDirect).toBe(1234.5);
        expect(result.parseEmbeddedScientific).toBe(-1250);
        expect(result.parseNoMatch).toBe(0);
        expect(result.parseGarbage).toBe(0);
        expect(result.parseInvalidValueFallback).toBe('0');
    });
});
