# PR QA Checklist (merge gate)

Before merging any PR into `develop`:
- [ ] `npm run ci` green locally OR GitHub Actions `pr-ci` green
- [ ] No accidental secrets committed (.env, service keys)
- [ ] No horizontal overflow on mobile (smoke: iPhone width)
- [ ] Reduced motion respected where new animations added
- [ ] Links/buttons have accessible labels

Before merging `develop → main`:
- [ ] Release PR checks green
- [ ] If migrations exist: confirm target env migrations plan (do NOT push prod DB without approval)
- [ ] Smoke test:
  - [ ] `/`
  - [ ] `/events`
  - [ ] `/events/[slug]`
  - [ ] `/login`
  - [ ] `/dashboard` (core module works)
