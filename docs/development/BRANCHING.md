# Branching — ViBE / ViZb

**Last updated:** April 6, 2026

## Goals

- **`develop`** stays **integratable**: it should usually match what you would deploy to staging (or what multiple people can pull without surprise conflicts).
- **Parallel work** (multiple humans, multiple agents, v0 sync) lands via **short-lived branches** and **PRs**, not by everyone pushing straight to **`develop`**.
- **`main`** moves only through a **deliberate release** PR from **`develop`**.

---

## Branch roles

| Branch | Role |
|--------|------|
| **`develop`** | **Integration** — default target for feature PRs; should remain releasable. Direct pushes are for **small exceptions** (see below). |
| **`main`** | **Production / release** — updated only via PR **`develop` → `main`** when cutting a release. |
| **`feat/*`**, **`fix/*`**, **`chore/*`**, **`docs/*`** | **Short-lived work** — branch off latest **`develop`**, open PR back into **`develop`**. |

### Naming examples

- `feat/event-rsvp-email`
- `fix/admin-posts-null-guard`
- `chore/eslint-config-align`
- `docs/branching-workflow`

---

## Standard workflow (preferred)

### 1. Start from up-to-date `develop`

```powershell
git fetch origin
git checkout develop
git pull origin develop
```

### 2. Create a branch for your change

```powershell
git checkout -b feat/short-description
```

### 3. Work, commit locally

Run **`npm run ci`** (or your pre-push gate) before pushing.

### 4. Publish the branch and open a PR

```powershell
git push -u origin feat/short-description
gh pr create --base develop --head feat/short-description --title "..." --body "..."
```

(Or use GitHub’s UI: compare branch → base **`develop`**.)

### 5. Merge the PR into `develop`

**Team default:** use **Create a merge commit** on the PR (matches your existing habit and preserves branch context in history).

- **Squash and merge** is fine for tiny one-commit fixes if you want a linear story—optional, not required.
- After merge, delete the remote feature branch if GitHub offers it.

### 6. Update your local `develop`

```powershell
git checkout develop
git pull origin develop
```

---

## Release: `develop` → `main`

When you are ready for production:

1. Open a **release PR**: base **`main`**, head **`develop`**.
2. Use **Create a merge commit** on that PR so the release is one visible integration point (you can tag the merge commit if you version releases).
3. Deploy from **`main`** per your hosting workflow (e.g. Vercel production branch).

Emergency **hotfix on production**: branch from **`main`** (e.g. `fix/prod-xyz`), PR → **`main`**, then **backport** the same fix into **`develop`** (cherry-pick or small follow-up PR) so branches do not diverge.

---

## When direct push to `develop` is acceptable

Use sparingly; prefer PRs when anyone else might be on **`develop`**.

| OK on `develop` | Avoid on `develop` |
|-----------------|-------------------|
| Urgent **docs-only** typo with no open PRs | Multi-file **feature** work |
| Repo hygiene agreed in chat (e.g. one maintainer online) | Anything that should pass **CI review** before merge |
| Fast-forward after **you** merged the same work via GitHub PR and need to sync local only | Long-running work without a branch |

If two streams are active, **do not** both push to **`develop`**; use branches.

---

## Commands (Cursor)

| Command | Role |
|---------|------|
| **`/ship`** | Run checks, commit **intended** files, push **current branch** — on a feature branch this means **open or update a PR to `develop`**; see `.cursor/commands/Ship.md`. |
| **`/pr`** | **`gh pr create --base develop --head <branch>`** for features, or **`--base main --head develop`** for release. |

---

## GitHub default branch

The repo **default branch** on GitHub may be **`main`**. That is fine: new work still **starts from `develop`** for integration. Optionally set the **default branch** to **`develop`** in repo settings if you want clones to land on the integration branch first.

---

## Merge commits vs squash

- **Feature → `develop`:** default **merge commit** (your current style).
- **`develop` → `main`:** default **merge commit** for a clear release boundary.
- **Squash** only when the team explicitly wants a single commit for a tiny change—document that choice in the PR if relevant.
