# src/utils/ - Randomized Generators

**Location**: `src/utils/` directory
**Role**: Name and worker generation helpers used by the worker/population systems.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Extend name pools | `name_generator.rs` | Keep gender branches and `Other` fallback aligned |
| Change randomized worker traits/hobbies | `worker_generator.rs` | Mirrors `Trait`, `Hobby`, and `Worker::new_full` expectations |
| Update exports | `mod.rs` | Re-export generators only |

## CONVENTIONS
- `name_generator.rs` uses `rand::prelude::IndexedRandom`; `worker_generator.rs` uses `RngExt::random_range` from rand 0.10.
- Keep generator outputs compatible with `entities/worker.rs`; trait or hobby additions must be reflected here.
- `generate_random_worker()` is the high-level entrypoint; prefer changing its helpers rather than inlining new random logic elsewhere.

## ANTI-PATTERNS
- Leaving stray build artifacts like `.pdb` files in this source directory.
- Adding new trait/hobby/name pools in entities without updating the generators.
- Replacing bounded randomness with ad hoc magic numbers outside the helper methods.

## NOTES
- `worker_generator.rs` currently picks 1-2 hobbies and 0-2 secondary traits; tests assume those bounds.
- `name_generator.rs` is English-name only; if localization changes naming strategy, document the new source here.
