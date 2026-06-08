# Tests

**Last updated:** June 7, 2026

See **[DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md)** § Testing for full detail.

| Layer | Tool | Location |
|-------|------|----------|
| Unit | Vitest | `**/__tests__/**/*.test.ts` |
| E2E | Playwright | `tests/e2e/` |
| CI | GitHub Actions | `.github/workflows/pr-ci.yml` runs `npm run ci && npm run test:e2e` |

```bash
npm run test        # unit
npm run test:e2e    # Playwright
npm run ci          # typecheck + test + lint + build
```
