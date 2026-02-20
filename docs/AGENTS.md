# docs/ - Project Documentation

**Location**: `docs/` directory

## Overview
Project documentation: design docs, test cases, development guidelines.

## Document Structure
```
docs/
├── DESIGN.md              # Game design, mechanics, balance
├── TEST_CASES.md          # Test coverage, scenarios
├── DEVELOPMENT_GUIDELINES.md  # Dev workflow, best practices
└── unit_tests.md          # Rust unit test documentation
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add feature doc | `DESIGN.md` | Update mechanics section |
| Add test case | `TEST_CASES.md` | List test scenario |
| Update guidelines | `DEVELOPMENT_GUIDELINES.md` | Best practices |

## Document Types

### DESIGN.md
Game design documentation:
- Core mechanics
- Resource balance
- Achievement design
- Unlock progression
- Worker system

### TEST_CASES.md
Test coverage documentation:
- Feature coverage matrix
- Test scenario list
- Manual test cases
- Edge cases

### DEVELOPMENT_GUIDELINES.md
Development workflow:
- Git workflow
- Code review process
- Testing requirements
- Deployment steps

### unit_tests.md
Rust unit test documentation:
- Test structure
- TestGameState pattern
- Testing without WASM

## Commands
```bash
# View documentation
cat docs/DESIGN.md
cat docs/TEST_CASES.md

# Generate test coverage
npm run test -- --reporter=html
```
