# Branching — ViBE / ViZb

**Last updated:** March 23, 2026

## Current default (Git-flow)

| Branch | Role |
|--------|------|
| **`develop`** | **Integration branch** — day-to-day work merges here; **`/ship`** pushes this branch. |
| **`main`** | **Release / production** — updated via PR **`develop` → `main`** when cutting a release. |
| **Feature branches** | Branch off **`develop`**; open PRs with **base `develop`**. |

## Commands

- **`/ship`:** Be on **`develop`** (merge or cherry-pick your work first), then commit and `git push origin develop`.
- **`/pr` (feature):** `gh pr create --base develop --head <feature-branch>`.
- **`/pr` (release):** `gh pr create --base main --head develop` (or edit an existing release PR).

## Switching to `develop` locally

```powershell
git fetch origin
git checkout develop
git pull origin develop
```

## GitHub default branch

The repo default on GitHub may still be **`main`**. That is fine: **`develop`** is the working integration branch. Optionally set the **default branch** to `develop` in GitHub repo settings if you want new clones to land on `develop`.
