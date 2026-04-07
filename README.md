# ViBE / ViZb

Events discovery and ticketing platform (Next.js + Supabase). This repo may still receive updates from [v0.app](https://v0.app); **source-of-truth docs and Cursor commands** live in-tree for day-to-day development.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/digital-builders/v0-website-redesign-guidance)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/O15RXUTdE3J)

## Local setup

Use **npm only** for this repo (`package-lock.json`). Do not add `bun.lock` or `pnpm-lock.yaml` — mixed lockfiles confuse tooling (Next.js, CI, Cursor).

1. **Node:** LTS **20.x or 22.x** recommended (24.x often works). Install deps with **`npm install`**.
2. **Environment:** copy `.env.example` to **`.env.local`** (leading dot — `env.local` is not loaded) and fill Supabase URL + anon key.
3. **Dev server:** `npm run dev` → [http://localhost:3000](http://localhost:3000). **Docker is not required**; the app uses **hosted Supabase**.
4. **Auth on localhost:** configure Supabase **Authentication → URL Configuration** and test signup/login — see **`docs/guides/LOCAL_DEV_AND_AUTH.md`**.
5. **Checks:** `npm run typecheck`, `npm run test`, `npm run lint`, `npm run build` (or `npm run ci` for the full chain).

## Branching

- **`develop`** — integration branch; land work via **PRs** from short-lived branches (`feat/*`, `fix/*`, …). Avoid multiple people pushing large changes straight to **`develop`** at once.
- **`main`** — production/release; promote via PR **`develop` → `main`** (merge commit) when cutting a release.

Details, merge policy, and hotfixes: [`docs/development/BRANCHING.md`](docs/development/BRANCHING.md).

## Documentation spine

| Start here | Purpose |
|------------|---------|
| [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md) | Full map of docs and layers |
| [`AGENT_ONBOARDING.md`](AGENT_ONBOARDING.md) | AI / agent quick path |
| [`VIBE_PROJECT_CONTEXT_PROMPT.md`](VIBE_PROJECT_CONTEXT_PROMPT.md) | Pre-change checklist (ViBE Operating Doctrine) |
| [`database_schema_audit.md`](database_schema_audit.md) | SQL / schema audit pointers |
| [`docs/development/ENGINEERING_COMMANDS.md`](docs/development/ENGINEERING_COMMANDS.md) | Cursor `/commands` contract |

**Cursor:** commands and rules live under **`.cursor/commands/`** and **`.cursor/rules/`** (committed). Only **`.cursor/mcp.json`** is gitignored — do not put secrets in tracked files.

## Overview (v0 sync)

This repository may stay in sync with deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app can be pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/digital-builders/v0-website-redesign-guidance](https://vercel.com/digital-builders/v0-website-redesign-guidance)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/O15RXUTdE3J](https://v0.app/chat/O15RXUTdE3J)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository