# Deployment baseline — Netlify + Render + Neon

## Recommendation

For the PawMap MVP, use:

- **Netlify** for `apps/web` (Next.js)
- **Render** for `apps/api` (FastAPI)
- **Neon** for managed PostgreSQL

This replaces the earlier Vercel-first assumption. The main reason is practical, not ideological: PawMap is a small full-stack app, and the current repository needs a deployment path that works cleanly with private GitHub org workflows on free tiers.

## Why this baseline

- Keeps the stack simple: one web app, one API, one Postgres database
- Avoids Vercel Hobby limitations on private org deployment
- Preserves the existing repo structure and runtime assumptions
- Matches the current app boundaries already documented in `docs/architecture.md`

## Service mapping

### Web — Netlify

- Root/base directory: `apps/web`
- Build command: `npm run build`
- Publish/output: let Netlify detect Next.js automatically
- Required env:
  - `PAWMAP_API_BASE_URL=https://<your-render-api>.onrender.com`

### API — Render

- Root/base directory: `apps/api`
- Runtime: Python
- Build command:

```bash
pip install -e '.[dev]'
```

- Start command:

```bash
python -m app.db bootstrap && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- Required env:
  - `DATABASE_URL=<neon-postgres-url>`
  - any future provider keys / admin secrets when those integrations land

Notes:
- `python -m app.db bootstrap` is intentionally safe for repeat starts because migrations are tracked.
- If startup time becomes an issue later, split bootstrap/migrate into a release command and keep app start narrower.

### Database — Neon

- Provision a PostgreSQL database in Neon
- Copy the pooled or direct `DATABASE_URL` into the Render API service
- Keep schema changes driven by the existing SQL migration flow in `apps/api/migrations`

## Minimum deployment flow

1. Create the Neon database
2. Create the Render API service and set `DATABASE_URL`
3. Verify:
   - `/health`
   - `/docs`
   - one search/detail endpoint
4. Create the Netlify web site for `apps/web`
5. Set `PAWMAP_API_BASE_URL` in Netlify
6. Verify key flows:
   - homepage/search shell loads
   - place detail page loads
   - provider cache-miss state renders correctly
   - report submission works once the corresponding PR is merged
   - admin moderation page works against the deployed API

## CI / PR notes

- GitHub Actions remains the required validation baseline for code health
- Vercel preview checks should not be treated as part of the deployment baseline anymore
- The current failing PR status named `Vercel` is not produced by anything in this repo. It is an external status context created by the GitHub ↔ Vercel integration for the linked project.
- In this repo's current setup, that integration points to `https://vercel.com/mobi-dynamic?upgradeToPro=github-private-org-to-hobby`, which indicates a Vercel plan/org-level limitation rather than a build or workflow problem in repository code.
- Repo-side changes such as editing GitHub Actions, `package.json`, or adding/removing app code will not clear that status by themselves.
- To remove the stale failing check, update the integration outside the repo: either disconnect the repo/project from Vercel, disable Vercel GitHub deployment/status reporting for this project, or move the project to a Vercel plan that supports the current private org setup.
- If external preview deploys are needed later, add Netlify and/or Render preview setup explicitly rather than relying on Vercel defaults

## Trade-offs

### Pros
- Free-tier friendly for MVP work
- Clear ownership split between web and API
- Minimal repo changes required

### Cons
- Free tiers may cold start
- Web/API are deployed on separate platforms
- Preview workflows are less automatic than a tightly integrated Vercel-only setup

## Not covered yet

This document does not automate deployment or provision infrastructure from CI. It defines the baseline target platforms and runtime settings only.
