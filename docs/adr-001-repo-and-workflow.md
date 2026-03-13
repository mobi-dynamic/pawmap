# ADR-001: Repository and delivery workflow

- Status: Accepted
- Date: 2026-03-13

## Context

PawMap is a new project. We need predictable delivery, visible task tracking, and review gates from day one.

## Decision

- Use one repository: `mobi-dynamic/pawmap`
- Log all tasks in-repo under `tasks/`
- Require pull requests for all meaningful changes
- Merge only after code review is completed
- Start with docs-first bootstrap before implementation

## Consequences

### Positive
- Clear audit trail
- Better scope control
- Easier onboarding
- Lower risk of unreviewed changes

### Negative
- Slightly slower iteration at the beginning
- More process overhead for small changes

## Alternatives considered

- Ad hoc task tracking in chat only
- Direct-to-main development during bootstrap

Both were rejected because they reduce traceability and quality control.
