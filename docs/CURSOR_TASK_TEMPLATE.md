# Cursor Task Template (copy/paste)

## Context
Repo: ViZb
Target branch: create a new feature branch and open PR into `develop`.

## Hard constraints
- Do NOT run production DB pushes (`supabase db push`) unless explicitly approved.
- Avoid touching auth/middleware/callback flows unless the task explicitly requires it.
- No new UI libraries.
- Must pass: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## Task
<PASTE TASK GOAL + DEFINITION OF DONE HERE>

## Files to touch (expected)
<LIST>

## Acceptance tests
- <LIST>

## PR requirements
- PR title: `<type(scope)>: <summary>`
- PR body must include:
  - what changed
  - how to QA
  - checks run
