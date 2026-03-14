# OPS-001 — CI baseline

## Date
- 2026-03-14

## Summary
- Added a minimal GitHub Actions CI workflow for the current monorepo.
- Split validation into separate API and web jobs so failures stay easy to read.
- Kept the baseline focused on checks that already work in-repo today: API smoke tests plus web tests, typecheck, and production build.
- Deliberately did not make lint a CI gate because the repo is not consistently lint-configured yet.

## Files touched
- `.github/workflows/ci.yml`
- `README.md`
- `tasks/backlog.md`

## Verification
- `cd apps/api && python3 -m venv .venv-ci-tmp && source .venv-ci-tmp/bin/activate && pip install -e '.[dev]' && pytest -q` ✅
- `cd apps/web && npm ci && npm test && npm run typecheck && npm run build` ✅

## Notes
- The workflow runs on pull requests and pushes to `main`.
- Dependency caching uses `setup-python` pip cache and `setup-node` npm cache keyed from the app-level dependency manifests.
- Branch protection cannot be enforced from repository files alone; required checks/rulesets still need to be configured in GitHub as a follow-up.
- The current web build emits an upstream Next.js security deprecation warning for `14.2.30`; that should be handled in a separate dependency-maintenance task rather than folded into this CI baseline PR.
