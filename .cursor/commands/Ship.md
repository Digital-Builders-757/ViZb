/ship

Intent: Summarize the session, run checks, update docs, stage intended files only, commit, push **integration branch**.

Prompt text:

Summarize problems fixed / discovered this session (bullets).

IMPORTANT OPERATING RULES:

- Inspect the working tree; separate **intended** changes from unrelated edits. Do not commit unrelated files.
- **PowerShell:** do not use `&&` as a separator; use `;` or separate invocations.
- Before commit, ensure `git config user.name` and `user.email` are set. Do **not** change git config automatically.
- If a hook fails, fix and make a normal commit; do not amend unless asked.

**Integration branch for ViZb:** **`develop`** (see `docs/development/BRANCHING.md`). Checkout `develop` and merge your feature branch (or commit directly on `develop`) before shipping.

Run mandatory checks (stop on failure):

- `npm run typecheck`
- `npm run test`
- `npm run lint`
- `npm run build`

Documentation updates (in order):

1. **`docs/MVP_STATUS_ROADMAP.md`** — what moved forward / what’s next (P0/P1) if behavior or phase changed.
2. **`docs/DOCUMENTATION_INDEX.md`** or subtree READMEs if you added new doc areas.
3. **`docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`** — if you fixed a repeatable failure mode, add a row.

Then:

- `git status` — list files for this ship vs leave untouched.
- Stage **only** intended paths.
- `git log -5 --oneline` — match commit message style.
- Commit message format: `fix(<area>): <short outcome>` or `feat(<area>): …` / `docs: …` as appropriate. Pass the message safely for PowerShell (no bash heredoc).
- `git push origin develop`

Return:

- Bullets: fixed / discovered  
- Checks + outcomes  
- Docs touched  
- Files committed  
- Commit SHA  
- Unrelated files left unstaged  
