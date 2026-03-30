/pr

Intent: Open or update a pull request with a consistent narrative.

**ViZb workflow (see `docs/development/BRANCHING.md`):**

1. **Feature integration:** **`<feature-branch>` → `develop`** (daily work).
2. **Release:** **`develop` → `main`** (when promoting to production).

Prompt text:

Create or update a PR as appropriate.

IMPORTANT:

- Check for an **open PR** with the same head/base before creating a duplicate.
- If `gh pr edit` fails (GraphQL / project metadata), fall back to `gh api` REST PATCH.
- Describe the **full** branch delta honestly — not “this session only” unless true.

Title format: `fix(<area>): <short outcome>` (or feat/docs/chore as fit)

PR body sections:

**What broke**  
…

**Why it broke**  
…

**What we changed**  
…

**How we proved it**  
Commands + outcomes (typecheck, test, lint, build, manual)

**Docs updated:** yes/no — list files if yes.

**Risk + rollback**  
Risk: Low / Med / High  
Rollback: 1–2 sentences

**gh CLI examples:**

Feature into integration:

```text
gh pr list --base develop --head <feature-branch> --state open
gh pr create --base develop --head <feature-branch> --title "..." --body "..."
```

Release to production:

```text
gh pr list --base main --head develop --state open
gh pr create --base main --head develop --title "..." --body "..."
```

```text
gh pr edit <NUMBER> --title "..." --body "..."
```

Return: PR URL, created vs updated, title used.
