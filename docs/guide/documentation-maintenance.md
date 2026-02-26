# Documentation Maintenance

## Objective

Keep guide docs and API reference continuously aligned with source behavior.

## Workflow

1. Update TSDoc comments for changed public APIs.
2. Run API generation:

```bash
npm run docs:api
```

3. Validate site build:

```bash
npm run docs:build
```

4. Review locally:

```bash
npm run docs:dev
```

## Best practices

- Treat code as source of truth for API behavior.
- Keep examples small, realistic, and type-checkable.
- Note performance semantics (streaming vs buffering) where behavior is non-obvious.
- Update comparison/differences page when major capabilities change.

## Release checklist

- Guide pages reflect current concepts and recommended usage.
- API generation succeeds with no broken links.
- Examples and outputs remain accurate.
- GitHub Pages deployment passes in CI.
