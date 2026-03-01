# src/test_utils/ - Rust Test Harness

## OVERVIEW
Shared test scaffolding for Rust game-state behavior and balance validation.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add state transition test | `test_game_state.rs` | Prefer focused, deterministic tests |
| Add economy/balance simulation | `balance_test.rs` | Keep assertions on bounded ranges |
| Register helpers/modules | `mod.rs` | Export only reusable test helpers |

## CONVENTIONS
- Build tests around `TestGameState` helpers instead of duplicating setup in each test.
- Keep test names explicit (`test_<feature>_<condition>_<expected>` pattern).
- Prefer exact assertions on game values; avoid timing- or randomness-only assertions.
- For random-dependent behavior, inject deterministic inputs or assert invariant ranges.

## ANTI-PATTERNS
- Large monolithic tests that validate multiple unrelated mechanics.
- Repeating raw setup for workers/resources when helper constructors exist.
- Asserting only "no panic" without checking state/output deltas.

## COMMANDS
```bash
cargo test
cargo test test_worker_auto_assignment -- --exact
cargo test balance_test
```
