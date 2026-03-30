/release

Intent: Make merge-to-main a product moment: release notes + rollout + rollback + post-merge verification.

MODE: ANALYSIS

────────────────────────────────────────────
INPUTS
────────────────────────────────────────────
Collect:
- PR(s) being merged
- User-visible changes
- Risk areas (auth/middleware/Stripe/RLS)

────────────────────────────────────────────
OUTPUT (REQUIRED SECTIONS)
────────────────────────────────────────────
Release notes (user-facing)
- ...

Release notes (internal)
- ...

Risk assessment
- Risk level: Low/Med/High
- Top risks (3 bullets)

Rollout plan
- Steps (3–7 bullets)

Rollback plan
- 1–2 sentences

Post-merge verification checklist
- Explicit routes / actions to verify
- Any scripts/tests to rerun

────────────────────────────────────────────
ARCHIVE (REQUIRED)
────────────────────────────────────────────
After generating the release notes above, you MUST save them to the repo:

- Create a new markdown file under: `docs/releasenotes/`
- Filename convention:
  - `YYYY-MM-DD_pr-<number>_<short-slug>.md`
  - Example: `2025-12-19_pr-110_signout-redirect-convergence.md`
- Doc header must include:
  - `**Date:** <MMMM d, yyyy>`
  - `**Status:** ✅ COMPLETE`
  - `**Purpose:** Release notes archive for PR(s) merged`
- Paste the exact release output into that file.
- Include the PR link(s) at the top.
