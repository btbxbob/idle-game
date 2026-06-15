# src/ui/ - Rust UI Callback Layer

## OVERVIEW
Thin Rust callback surface for UI-oriented updates and snapshot logic; keep it minimal and state-safe.

## STRUCTURE
```
src/ui/
├── callbacks.rs  # update_* and UI-facing helper callbacks (nearly empty, 1 line)
├── snapshot.rs   # UI snapshot logic (152 lines)
└── mod.rs        # module exports
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a new UI callback | `callbacks.rs` | Keep API JS-friendly; avoid complex return types |
| Add UI snapshot logic | `snapshot.rs` | Capture UI state for testing/debugging |
| Export UI callback module | `mod.rs` | Re-export only stable callback surface |
| Trace UI update flow | `callbacks.rs` + `src/core/idle_game/` | Core orchestrates call order; callbacks stay thin |

## CONVENTIONS
- Keep callbacks side-effect-light; core game logic belongs in `src/core/` and `src/systems/`.
- Use simple types at the boundary (`String`, numbers, booleans) for WASM/JS compatibility.
- Keep callback naming aligned with existing `update_*` style where applicable.
- Release `RefCell` borrows before calling into other methods from callback paths.

## ANTI-PATTERNS
- Embedding gameplay rules directly in `callbacks.rs`.
- Returning internal Rust-only structures that JS cannot consume reliably.
- Holding borrows across chained callback/core method calls.

## NOTES
- `callbacks.rs` is currently nearly empty (1 line); most UI logic is handled by JS managers.
- For cross-module borrow and WASM export rules, see root `AGENTS.md` and `src/core/AGENTS.md`.
