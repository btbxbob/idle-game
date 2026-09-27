---
name: number-formatter-js
description: Zero-dependency number formatting for idle/incremental games (window.NumberFormatter.*) — threshold-based commas vs scientific notation, rate/percent/decimal helpers, and parsing formatted numbers back. Use when displaying or parsing large game numbers in this project; not a general i18n/formatter library.
---

# Number Formatter JS Skill

A zero-dependency number formatting module for idle/incremental games.
Drop `number-formatter.js` into any JS project and use `window.NumberFormatter.*`.

## Features

- **Threshold-based formatting**: Below 10M → locale-formatted with commas; above → scientific notation (`1.23e7`)
- **Pure functions**: No side effects, all math is deterministic
- **NaN/Infinity safe**: All inputs normalized to 0

## API

```js
// Floor to integer, then format
NumberFormatter.formatInteger(12345678)            // "1.234568e7"
NumberFormatter.formatInteger(1234567)             // "1,234,567"

// Compact display (1 significant digit)
NumberFormatter.formatCompactInteger(12345678)     // "1e7"

// Rates with configurable fraction digits and optional + sign
NumberFormatter.formatRate(12.3456)                // "12.3"
NumberFormatter.formatRate(12.3456, { fractionDigits: 2 }) // "12.35"
NumberFormatter.formatRate(5, { includeSign: true }) // "+5.0"

// General decimal formatting (trailing zeros trimmed)
NumberFormatter.formatDecimal(3.500)               // "3.5"

// Percentage
NumberFormatter.formatPercent(0.4567)              // "45.7%"

// Direct scientific
NumberFormatter.formatScientific(123456789)        // "1.234568e8"

// Reverse parse formatted number back to numeric
NumberFormatter.parseDisplayedNumber("1,234,567")  // 1234567
NumberFormatter.parseDisplayedNumber("1.23e7")     // 12300000
```

## Usage in game loop

```js
// Every tick:
const safeCoins = NumberFormatter.formatInteger(game.get_coins());
document.getElementById('coins-display').textContent = safeCoins;

// Format rates:
const cps = NumberFormatter.formatRate(game.get_coins_per_second());
document.getElementById('cps').textContent = `${cps}/秒`;
```

## Customization

```js
// Change threshold at which scientific notation kicks in
// (modify the PLAIN_THRESHOLD constant at top of file)
const PLAIN_THRESHOLD = 10_000_000;  // Default: 10 million
```
