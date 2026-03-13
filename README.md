# PawMap

PawMap is a web app for dog owners to search places on a map and quickly understand pet rules before they go.

## Product goal

Answer one question fast:

> Can I bring my dog there, and under what rules?

## MVP focus

- Search places by name or location
- View a place on the map
- Show dog policy status: allowed, restricted, not allowed, unknown
- Show structured rules: indoor/outdoor, leash, size limits, notes
- Display verification source and last checked time
- Let users submit updates
- Moderate updates before publishing

## Working agreements

- All work must be logged under `tasks/`
- All changes go through pull requests
- Merge only after review is completed
- Keep scope tight for MVP

## Initial repo structure

- `docs/` — PRD, architecture, ADRs
- `tasks/` — task logs, backlog, release checklist
- `.github/` — PR and issue templates

## Planned stack

- Frontend: Next.js + TypeScript + Tailwind
- Backend: FastAPI
- Database: PostgreSQL
- Maps/places: Mapbox or Google Places
- Hosting: Vercel + Railway/Render + managed Postgres

## Status

Project bootstrap in progress.
