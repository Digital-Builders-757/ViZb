# Git Hooks (optional)

Git does **not** automatically enable hooks from a repo for security reasons.

This folder contains an **optional** guardrail to prevent accidental pushes to `main`.

## Install

From the repo root:

```bash
git config core.hooksPath scripts/git-hooks
```

## What it does

- Blocks `git push origin main` (and any push to a `main` branch ref).
- Allows all other pushes (feature branches, develop, etc.).

## Uninstall

```bash
git config --unset core.hooksPath
```
