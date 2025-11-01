# Testing Guide

This document describes how to run tests for the WriteAid plugin.

## Overview

The plugin uses [Vitest](https://vitest.dev/) for testing with two types of tests:

1. **Unit Tests**: Test individual functions and utilities in isolation
2. **Integration Tests**: Test service-level operations using a filesystem-backed vault

## Running Tests

### Prerequisites

```bash
pnpm install
```

### Run All Tests

```bash
pnpm test
```

### Run Unit Tests Only

```bash
pnpm test:unit
```

### Run Integration Tests Only

```bash
pnpm test:integration
```

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

### Run Full CI Pipeline Locally

```bash
pnpm lint && pnpm build && pnpm test && node ./scripts/verify-manifest-commands.js
```

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── utils.test.ts       # Tests for core utilities
│   ├── meta.test.ts        # Tests for metadata helpers
│   └── WordCountDonut.test.ts  # Component logic tests
├── integration/             # Integration tests  
│   ├── ProjectService.test.ts
│   ├── DraftFileService.test.ts
│   └── meta.test.ts
├── stubs/                   # Test doubles for Obsidian API
│   ├── TestAdapter.ts      # Filesystem adapter
│   ├── TestVault.ts        # Vault implementation
│   ├── TestApp.ts          # App wrapper
│   └── TestVaultManager.ts # Manages temp vault copies
├── mocks/                   # Mock implementations
│   └── obsidian.ts         # Mock Obsidian API classes
└── fixtures/
    └── test-vault-template/ # Immutable test vault copied per test
```

## Integration Test Strategy

Integration tests use a **filesystem-backed Vault stub** that:

- Copies `tests/fixtures/test-vault-template/` to a unique temp directory per test run
- Provides a TestApp/TestVault/TestAdapter that use real Node.js filesystem operations
- Allows services to perform actual file I/O against a realistic vault structure
- Cleans up temp directories after tests complete

This approach provides:
- Fast test execution (no Obsidian app launch)
- Deterministic results
- Real filesystem operations for confidence
- No GUI automation complexity

## Coverage

Current test coverage:

- **Unit Tests**: 35 tests covering utils, meta helpers, and component logic
- **Integration Tests**: 13 passing tests covering:
  - Project creation (single-file and multi-file)
  - Draft operations (create, delete)
  - Metadata updates (word counts, chapters, file listings)
  - Meta file read/write operations

## CI

Tests run automatically on:
- Pull requests to `main`
- Pushes to `main`

The CI workflow (`.github/workflows/ci.yml`) runs:
1. Lint check
2. Build
3. Unit tests
4. Integration tests
5. Manifest command verification

Target CI time: < 90 seconds on Linux runners

## Known Limitations

### Phase 1 (Current)
- No GUI/UI automation - tests focus on service-level operations
- Some edge cases in multi-file draft word counting are known issues
- Draft deletion with cleanup still has minor cache refresh issues

### Phase 2 (Future)
- End-to-end GUI automation using Playwright Electron
- Full command palette workflow testing
- UI interaction testing

## Debugging Tests

To debug a specific test:

```bash
# Run a single test file
pnpm exec vitest run tests/unit/utils.test.ts

# Run a specific test by name pattern
pnpm exec vitest run -t "should create a single-file project"

# Run with verbose output
pnpm exec vitest run --reporter=verbose
```

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { countWords } from "@/core/utils";

describe("countWords", () => {
  it("should count words correctly", () => {
    expect(countWords("hello world")).toBe(2);
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TestVaultManager } from "../stubs";
import { ProjectService } from "@/core/ProjectService";
import * as path from "path";

describe("ProjectService Integration", () => {
  let vaultManager: TestVaultManager;
  let projectService: ProjectService;

  beforeEach(async () => {
    const templatePath = path.resolve(__dirname, "../fixtures/test-vault-template");
    vaultManager = new TestVaultManager();
    const app = await vaultManager.createTempVault(templatePath);
    projectService = new ProjectService(app);
  });

  afterEach(async () => {
    await vaultManager.cleanup();
  });

  it("should create a project", async () => {
    const projectPath = await projectService.createProject("Test Project", true);
    expect(projectPath).toBe("Test Project");
  });
});
```

## Configuration

- **Vitest Config**: `vitest.config.ts`
- **TypeScript Config**: `tsconfig.json` (includes test files)
- **ESLint**: Test files follow same linting rules with test-specific exceptions
