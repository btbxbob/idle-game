# css/ - Theme and Layout Styles

**Location**: `css/` directory
**Role**: Global theming, responsive layout, and ASCII/terminal skinning.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Change main layout or responsive behavior | `style.css` | Owns tabs, banners, workers, technology tree, breakpoints |
| Change ASCII/terminal skin | `ascii-style.css` | Theme overrides and pseudo-element decorations |

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
