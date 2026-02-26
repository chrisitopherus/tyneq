# API Documentation

Tyneq API reference is generated automatically from source code using TypeDoc.

## How it works

- Source of truth: exported symbols in `src/index.ts`
- Metadata source: TSDoc comments in the codebase
- Generation output: `docs/api/reference`

## Generate locally

```bash
npm run docs:api
```

Then open the generated reference pages under [/api/reference/](/api/reference/).

## Recommended workflow

- Update or add TSDoc on public APIs when you change behavior.
- Run `npm run docs:api` to regenerate the reference.
- Run `npm run docs:build` to validate all guide + API pages build correctly.
