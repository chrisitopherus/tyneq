# Contributing

Thank you for your interest in contributing to Tyneq.

For the full contribution guide - including how to add built-in operators, write tests,
run the docs site locally, and open a PR - see:

**[docs/guide/contributing.md](https://chrisitopherus.github.io/tyneq/guide/contributing)**

## Quick start

```bash
git clone https://github.com/chrisitopherus/tyneq
cd tyneq
npm install
npm run build    # compile CJS + ESM + types
npm test         # run test suite
npm run lint     # check style
npm run docs:dev # local docs site
```

## Workflow rules

- All work happens on feature branches off `dev`. Never commit directly to `dev` or `main`.
- Branch naming: `feature/<slug>`, `fix/<slug>`, `docs/<slug>`, `refactor/<slug>`.
- All PRs must pass: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.

## Bug reports and feature requests

[github.com/chrisitopherus/tyneq/issues](https://github.com/chrisitopherus/tyneq/issues)
