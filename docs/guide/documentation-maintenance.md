# Documentation Maintenance

This page defines the maintenance workflow used to keep guide content and API reference synchronized with the codebase.

## Goals

- Keep generated API docs aligned with public source behavior.
- Keep conceptual guide pages aligned with execution semantics.
- Keep examples accurate, runnable, and representative.

## Required Workflow

1. Update public TSDoc for any changed API surface.
2. Update related guide pages when behavior or usage guidance changes.
3. Regenerate API documentation.
4. Build documentation site.
5. Review key pages locally.

Commands:

```bash
npm run docs:api
npm run docs:build
npm run docs:dev
```

## Quality Checklist

- Execution model language is explicit (streaming, buffering, terminal).
- Guide examples match current signatures and behavior.
- Internal links are valid.
- Terminology is consistent with `DOCUMENTATION_GUIDELINES.md`.
- API pages and guide pages do not conflict.

## Review Checklist for PRs

- Public API changes include TSDoc updates.
- New operators are reflected in [Operators Overview](/guide/operators-overview) and [Core Concepts](/guide/concepts).
- Error behavior updates are reflected in [Error Handling](/guide/error-handling).
- Feature-level comparison implications are reflected in [Differences from Other Libraries](/guide/differences) when applicable.
- New extensibility mechanisms are reflected in [Extensibility and Query Plans](/guide/extensibility).
- Contributor-facing process changes are reflected in [Contributing](/guide/contributing).

## Common Drift Risks

- Operator behavior changed but guide examples still show old semantics.
- Newly added terminal operators missing from examples and concept pages.
- Renamed symbols that leave stale links in guide markdown.

## Related Pages

- [Guide Index](/guide/)
- [Core Concepts](/guide/concepts)
- [Operators Overview](/guide/operators-overview)
