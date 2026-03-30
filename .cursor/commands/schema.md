/schema

Intent: Safe database change workflow (new SQL only, RLS, docs).

MODE: DESIGN → EXECUTION

────────────────────────────────────────────
STEP 0 — CONTEXT
────────────────────────────────────────────
Review:

- `database_schema_audit.md`
- `scripts/*.sql` — **never edit scripts already applied** to shared environments; add a new numbered script (or use Supabase CLI migrations when adopted)
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/DOCUMENTATION_INDEX.md`
- `docs/VIBE_APP_SPECIFICATION.md` Sections 5–6

────────────────────────────────────────────
STEP 1 — CHANGE PLAN (NO SQL YET)
────────────────────────────────────────────
Tables/views/enums/functions, RLS impact, app files to update, risks.

────────────────────────────────────────────
STEP 2 — NEW MIGRATION / SCRIPT
────────────────────────────────────────────
- **Supabase CLI (preferred when project uses it):** `supabase migration new <short_description>` → edit the new file under `supabase/migrations/`.
- **Current repo pattern:** add the next `scripts/NNN_description.sql` and document it in `docs/MVP_STATUS_ROADMAP.md` + `database_schema_audit.md`.

Never rewrite history of applied migrations.

────────────────────────────────────────────
STEP 3 — APPLY + VERIFY (LOCAL)
────────────────────────────────────────────
When Supabase local is available: reset/push per team practice, then run:

- `npm run typecheck`
- `npm run test`
- `npm run build`

If codegen exists later, add “regenerate types” here and document in `ENGINEERING_COMMANDS.md`.

────────────────────────────────────────────
OUTPUT
────────────────────────────────────────────
Script/migration path, SQL summary, verification commands + outcomes.
