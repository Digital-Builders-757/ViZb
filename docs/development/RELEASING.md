# Releasing (develop → main)

> Repo note: this repo is **private + free**, so GitHub branch protection (required checks) can’t be enforced via settings.
> We enforce safety via **process + CI + local guardrails**.

## Golden rule

- **Never push to `main` directly.**
- Ship only via a **PR from `develop` → `main`**.

## Release steps

0) Confirm database migrations are applied to the target environment (staging/prod) **before** releasing code that depends on them.

See: `docs/operations/SUPABASE_PRODUCTION_MIGRATIONS.md`

1) Update local branches:

```bash
git fetch origin

git checkout develop
git pull origin develop
```

2) Open a release PR (GitHub UI or `gh`) from **`develop` → `main`**.

3) Wait for PR checks:

- GitHub Actions workflow `pr-ci` should run on the PR.
- Confirm it passes: **typecheck / test / lint / build** (`npm run ci`).

4) Merge the PR using **Merge commit**.

5) Deploy (per hosting). If Vercel/Netlify auto-deploys on `main`, verify the deployment and smoke test:

- `/` (homepage)
- `/events`
- `/events/[slug]` (public event detail)
- `/login`
- `/dashboard`
- `/admin`

## Hotfix flow

If production is broken:

1) Branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b fix/<topic>
```

2) PR `fix/<topic>` → `main`, merge (merge commit).
3) Backport: PR the same fix branch (or cherry-pick) into `develop`.

## Local guardrail

This repo includes an optional, installable pre-push hook that blocks `git push origin main`.

See: `scripts/git-hooks/README.md`
