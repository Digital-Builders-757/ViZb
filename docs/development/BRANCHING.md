# Branching — ViBE / ViZb

**Last updated:** April 10, 2026

## Goals

- **`develop`** stays **integratable**: it should usually match what you would deploy to staging (or what multiple people can pull without surprise conflicts).
- **Parallel work** (multiple humans, multiple agents, v0 sync) lands via **short-lived branches** and **PRs**, not by everyone pushing straight to **`develop`**.
- **`main`** moves only through a **deliberate release** PR from **`develop`**.
- **Default product flow:** **`feat/*` / `fix/*` → `develop` → `main`**. Do **not** open routine feature PRs directly into **`main`** (use the hotfix exception below).

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

**Base must be `develop`** for normal work.

```powershell
git push -u origin feat/short-description
gh pr create --base develop --head feat/short-description --title "..." --body "..."
```

(Or use GitHub’s UI: compare branch → base **`develop`** — not `main`.)

### 5. Merge the PR into `develop`

Use **Create a merge commit** (not squash) unless it is a trivial one-commit fix and the team agrees. Agents default to **merge commit** per the policy at the end of this doc.
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
| **`/pr`** | **`gh pr create --base develop --head <branch>`** for features, or **`--base main --head develop`** for release. If a feature PR was opened against **`main`** by mistake: **`gh pr edit <N> --base develop`** (requires **`origin/develop`**). |

---

## GitHub repository setup (`develop` on the remote)

- **`develop` must exist on GitHub** as the integration branch. If it was missing, create it from the latest agreed line (often **`main`**) once, then use **feature PRs → `develop`** from then on.
- **Branch protection (recommended):**
  - **`develop`:** require PR before merge; require **PR CI** (see `.github/workflows/pr-ci.yml`); avoid routine direct pushes.
  - **`main`:** require PR before merge; require CI; use **`develop` → `main`** for releases; allow **hotfix** PRs from a branch off **`main`** only when documented, then **backport to `develop`**.
- **CI:** `.github/workflows/pr-ci.yml` runs for PRs into **`develop`** and **`main`**, and on pushes to **`develop`**, so integration and release PRs both stay gated.

## GitHub default branch

The repo **default branch** on GitHub may be **`main`**. That is fine: **new work still merges into `develop` first**. Optionally set the **default branch** to **`develop`** in repo settings if you want clones and “base branch” UX to center on integration.

---

## Merge commits vs squash (enforced for agents)

- **Feature → `develop`:** use **Create a merge commit** (or enable auto-merge with **merge commit**). Preserves integration context and matches short-lived branch history.
- **`develop` → `main` (release):** use **Create a merge commit** only. This is the **release boundary**; do **not** squash-merge into `main` — squash drops the integration graph, makes backports and audits harder, and conflicts with the “develop is staging integration” model.
- **Never squash-merge bulk or multi-ticket work into `main`.** If GitHub’s default merge button is squash, change the repo setting or use `gh pr merge --merge` for release PRs.
- **Optional squash** is only for a **tiny** one-commit hotfix **into `develop`**, and never as the default for agents.

### Reconciling `develop` after work landed on `main` only

If commits reached **`main`** without going through **`develop`** (e.g. emergency merge or mistaken base), **`develop` must be updated** so the next feature PRs do not conflict with reality:

1. Open **one** PR: base **`develop`**, head **`main`**, merge with **merge commit** (or locally: `git checkout develop && git merge origin/main` then push).
2. Resolve conflicts once on that integration PR.
3. Confirm CI on **`develop`** after the merge.

