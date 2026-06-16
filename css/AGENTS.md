# css/ - Theme and Layout Styles

**Location**: `css/` directory
**Role**: Global theming, responsive layout, and ASCII/terminal decorations.

## STRUCTURE
```
css/
└── style.css         # Main stylesheet — layout, tabs, banners, workers, tech tree, breakpoints, ASCII decorations
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Change main layout or responsive behavior | `style.css` | Owns tabs, banners, workers, technology tree, breakpoints |
| Change ASCII/terminal decorations | `style.css` | ASCII / TUI DECORATIVE section at end of file |

## CONVENTIONS
- All styles belong in `style.css` — no separate skin/theme override files.
- Reuse existing CSS variables before adding new hardcoded colors or shadows.
- Treat the `@media (max-width: 375px)` and `@media (max-width: 430px)` sections as the authoritative narrow-phone layouts.
- **DO NOT use `!important`** — it causes cascading conflicts and makes debugging impossible. Use selector specificity instead.

## ANTI-PATTERNS
- Using `!important` to force style overrides — fix selector specificity instead.
- Creating separate theme/skin override stylesheets — merge into `style.css`.
- Changing tab/banner height behavior without checking responsive regressions.
- Adding component-specific rules with no regard for the existing variable and breakpoint structure.

## NOTES
- `style.css` is a major hotspot in this repo; search for an existing section before adding a new block.
- Worker cards, technology tree layout, and mobile banner/tab fixes all live here, so unrelated tweaks can have wide blast radius.
- The `ascii-style.css` and `styles-new.css` files have been deleted; decorative pseudo-elements are now in `style.css`.
