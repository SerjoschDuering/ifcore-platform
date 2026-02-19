# F<N>: <Feature Name>

**Team:** <team name>
**Captain:** <captain name>
**Branch:** `feature/<short-name>`

## Problem

What problem does this solve? Who benefits? (2-3 sentences)

## Solution

What are we building? How does it work at a high level? (2-3 sentences)

## Done When

- [ ] ...
- [ ] ...
- [ ] Tests pass / demo works
- [ ] PR reviewed and merged

## API Changes

<!-- What new endpoints, state, or database tables does this need? -->

| Layer | Change |
|-------|--------|
| HF Space endpoint | `POST /your-thing` — describe input/output |
| Worker route | `POST /api/your-thing` — proxy pattern |
| D1 table | New table or columns? |
| Zustand slice | New state fields? |
| React route | New route file? |

## Shared State

<!-- What does this feature read from or write to the Zustand store? -->

**Reads:** `store.projects`, `store.activeJobId`
**Writes:** `store.someNewField`

## Dependencies

<!-- Does this feature depend on another team's feature? Does another depend on yours? -->

## Open Questions

- ...
