# API Reference

The API reference is generated from TSDoc comments in the source using TypeDoc.

The reference is a standalone HTML site served at [/api/reference/](/api/reference/).

Use the **"@internal"** filter checkbox in the TypeDoc sidebar to toggle visibility of internal
symbols — useful for library contributors and anyone building custom operators.

## Generate locally

```bash
npm run docs:api
```

Then open [/api/reference/](/api/reference/) in the dev server.

## Workflow

- Update TSDoc on public APIs when you change behaviour.
- Run `npm run docs:api` to regenerate.
- Run `npm run docs:build` to validate the full site builds correctly.
