/summarize

Intent: Produce a **handoff prompt** for the next agent: what we did, what’s left, how to continue.

MODE: ANALYSIS (no code unless needed to verify file paths)

────────────────────────────────────────────
STEP 0 — GATHER
────────────────────────────────────────────
Review:

- `git status` and recent commits (`git log -8 --oneline`)
- `docs/MVP_STATUS_ROADMAP.md` (current phase / priorities)
- Any open questions or blockers from the session

────────────────────────────────────────────
STEP 1 — OUTPUT (PASTE AS THE NEW AGENT’S FIRST MESSAGE)
────────────────────────────────────────────
Write a single message the user can copy with these sections:

1. **Project:** ViBE / ViZb — Next.js + Supabase events platform.  
2. **Read first:** `VIBE_PROJECT_CONTEXT_PROMPT.md`, `docs/DOCUMENTATION_INDEX.md`, `docs/ARCHITECTURE_CONSTITUTION.md`.  
3. **Done this session:** bullet list (features, fixes, docs).  
4. **Files touched:** high-signal paths only.  
5. **Verification:** which of `npm run typecheck` / `test` / `lint` / `build` ran and result.  
6. **Left to do:** ordered next steps (P0 first), each one concrete.  
7. **Constraints / risks:** env, RLS, auth, migrations, or unknowns.  
8. **Suggested command:** `/continue` or `/plan` + topic, or `/ship` if ready.

Tone: factual, no fluff. If something was assumed, label **UNVERIFIED**.
