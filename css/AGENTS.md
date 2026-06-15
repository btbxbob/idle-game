# css/ - Theme and Layout Styles

**Location**: `css/` directory
**Role**: Global theming, responsive layout, and ASCII/terminal skinning.

## STRUCTURE
```
css/
├── style.css         # Main stylesheet (3751 lines) — layout, tabs, banners, workers, tech tree, breakpoints
├── ascii-style.css   # ASCII/terminal theme overrides and pseudo-element decorations
└── styles-new.css    # EXPERIMENTAL: alternative stylesheet for new panel-based UI (not wired in index.html)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Change main layout or responsive behavior | `style.css` | Owns tabs, banners, workers, technology tree, breakpoints |
| Change ASCII/terminal skin | `ascii-style.css` | Theme overrides and pseudo-element decorations |
| New panel UI styles | `styles-new.css` | EXPERIMENTAL — pairs with `js/panels/` and `js/bootstrap-new.js` |

## CONVENTIONS
- Put structural layout rules in `style.css`; keep theme/skin overrides in `ascii-style.css`.
- Reuse existing CSS variables before adding new hardcoded colors or shadows.
- Treat the `@media (max-width: 375px)` and `@media (max-width: 430px)` sections as the authoritative narrow-phone layouts.

## ANTI-PATTERNS
- Mixing theme overrides into `style.css` when they belong in `ascii-style.css`.
- Changing tab/banner height behavior without checking responsive regressions.
- Adding component-specific rules with no regard for the existing variable and breakpoint structure.

## NOTES
- `style.css` is a major hotspot in this repo; search for an existing section before adding a new block.
- Worker cards, technology tree layout, and mobile banner/tab fixes all live here, so unrelated tweaks can have wide blast radius.
- `styles-new.css` is part of the experimental ES module panel refactor and is not loaded by `index.html`.
