IMPLEMENT APPROVED PLAN:
<paste the selected approach (A / B / C) verbatim>

MODE: IMPLEMENTATION  
Only implement what was approved. No scope expansion.

────────────────────────────────────────────
ARCHITECTURAL RULES (MANDATORY)
────────────────────────────────────────────
- Follow `docs/ARCHITECTURE_CONSTITUTION.md` and `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- Middleware = session refresh + allow / deny / redirect — not business rules
- No DB writes in Client Components
- Mutations via Server Actions (or server-only route handlers when justified)
- No `select('*')` — explicit columns
- RLS must remain enforced; schema/scripts are truth
- If the repo adds Supabase-generated types, never hand-edit generated output to “fix” drift — fix schema and regenerate

Honor during implementation:
- `docs/diagrams/airport-model.md`
- Any extra diagrams explicitly chosen in `/plan`

────────────────────────────────────────────
RED ZONE (IF APPLICABLE)
────────────────────────────────────────────
If RED ZONE INVOLVED: YES:

1. Show relevant existing code first  
2. Summarize current behavior  
3. Smallest possible diff  
4. Explain: redirect safety, bootstrap, RLS, webhook idempotency (if applicable)

────────────────────────────────────────────
DELIVERABLES
────────────────────────────────────────────
- Changed files  
- Code (minimal, typed, explicit selects)  
- Tests run (`npm run test`, etc.)  
- Doc updates (paths + summary)

End with: **RED ZONE INVOLVED: YES / NO**

If you deviate from the approved plan, STOP and explain why.
