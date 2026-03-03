# Tyneq Operator Architecture — Migration Notes

## Current State

Mid-migration from a **god-class** `TyneqEnumerableBase` (1703 lines, 40+ direct operator imports)
to a **self-registering operator architecture**. The infrastructure is complete. Only 8 operators
have been migrated so far; ~60+ still live in the base class.

**Core mechanism**: operators patch `TyneqEnumerableBase.prototype` at module evaluation time.
`declare` stubs at the bottom of the base class tell TypeScript "these exist at runtime."

---

## Issues to Fix

### 1. Dead code in `src/operators/streaming/scan.ts` — lines 92–101

The `@operator('scan')` decorator on line 61 **already** registers the method. The manual block
at the bottom is left-over from before the decorator existed:

```ts
// lines 92-101 in scan.ts — completely dead
const scanProto = TyneqEnumerableBase.prototype as any;
if (!Object.prototype.hasOwnProperty.call(scanProto, 'scan')) {
    scanProto.scan = function ...
}
```

The `@operator` decorator fires first (class body evaluation) and sets `scan` on the prototype.
By line 92, `hasOwnProperty` returns true so the `if` never executes. The import of
`TyneqEnumerableBase` in that file only exists for this dead block — remove both.

**Action**: Delete lines 92–101 and the `TyneqEnumerableBase` import.

---

### 2. `src/operators/streaming/select.ts` — class and registration are disconnected

`SelectOperatorEnumerable` is a full class (delegates to `SelectEnumerator`), but the
`createGeneratorOperator` call at the bottom **never uses the class** — it has its own inline
generator that duplicates the logic:

```ts
// The class exists but registration bypasses it entirely:
createGeneratorOperator({
    name: 'select',
    *generator(source, selector) {
        for (const item of source) yield selector(item); // duplicates SelectEnumerator
    }
});
```

Pick one approach:

- **Option A (preferred — consistent with `where`/`scan`)**: Add `@operator('select')` to the
  class, remove the `createGeneratorOperator` call at the bottom.
- **Option B**: Drop `SelectOperatorEnumerable` entirely, keep only `createGeneratorOperator`
  (if the class isn't referenced anywhere else).

---

### 3. `src/operators/buffer/distinct.ts` — minor inconsistency (low priority)

`DistinctOperatorEnumerable` is a class, but registration uses `createOperator` to wrap it.
Using `@operator('distinct')` directly on the class would be simpler and consistent.
Works fine as-is; fix during the full migration pass.

---

### 4. Main work: migrate the ~60 remaining operators out of `TyneqEnumerableBase`

Every operator still in `TyneqEnumerableBase.ts` needs four steps:

1. Create/update the operator file with `@operator` / `@terminal` / `createOperator` /
   `createGeneratorOperator` registration.
2. Add a `declare` stub at the bottom of `TyneqEnumerableBase.ts` (see existing stubs at line 1696).
3. Add an `import` line to `src/operators/extensions/index.ts`.
4. Remove the method body + import from `TyneqEnumerableBase.ts`.

#### Registration method guide

| Scenario | Use |
|---|---|
| Class-based operator (most operators) | `@operator('name')` or `@terminal('name')` decorator |
| Simple stateless transform | `createGeneratorOperator()` — no class needed |
| Terminal with class | `@terminal('name')` decorator |
| External consumer adding a custom op | `createTerminalOperator()` / `createOperator()` + `declare module` |

#### `declare` stub pattern (from `TyneqEnumerableBase.ts` lines 1686–1703)

```ts
// ── Extension operator stubs ────────────────────────────────────────────────
// These members are NOT implemented here. They are injected onto the
// prototype at module-load time when the extensions barrel is imported.
// The `declare` keyword tells TypeScript the members will exist at runtime.
// ───────────────────────────────────────────────────────────────────────────
declare where: (predicate: (item: TSource) => boolean) => ITyneqEnumerable<TSource>;
declare toArray: () => TSource[];
// ... add one line per migrated operator
```

---

## On `dev.ts` — Dual Augmentation Pattern

**The pattern is correct and necessary for external consumers.** Here's why:

TypeScript checks that classes implementing an interface satisfy all members. When an external
consumer adds a method to `ITyneqEnumerable` via `declare module`, TypeScript sees
`TyneqEnumerableBase` (which `implements ITyneqEnumerable`) as now missing that method. So
consumers must augment both:

```ts
declare module "tyneq" {
    interface ITyneqEnumerable<TSource> {
        joinString(separator: string): string; // for ITyneqEnumerable<T>-typed refs
    }
    interface TyneqEnumerableBase<TSource> {
        joinString(separator: string): string; // satisfies class-implements-interface check
    }
}
```

The library handles this internally with the `declare` stubs in `TyneqEnumerableBase.ts`.
External consumers replicate the same effect via module augmentation. No change needed.

**Note**: `dev.ts` mixes two concerns — a consumer API demo and integration tests. The
`console.assert` checks are valuable but should live in `tests/unit/` using the proper test
framework. `dev.ts` is fine as a scratchpad/example file.

---

## Migration Checklist

### Infrastructure (done)
- [x] `@operator` / `@terminal` TC39 decorators (`src/extensibility/operatorDecorators.ts`)
- [x] `createOperator` / `createGeneratorOperator` / `createTerminalOperator` functional APIs
- [x] `src/operators/extensions/index.ts` barrel (side-effect imports trigger all registrations)
- [x] `src/index.ts` exports `operators/extensions` (users just `import { Tyneq } from 'tyneq'`)
- [x] `declare` stubs pattern in `TyneqEnumerableBase.ts`

### Migrated operators (done)
- [x] `where` — `@operator` decorator
- [x] `select` — `createGeneratorOperator` (class/registration disconnected — see issue #2)
- [x] `scan` — `@operator` decorator (dead manual block at bottom — see issue #1)
- [x] `window` — `createOperator`
- [x] `intersperse` — `createGeneratorOperator`
- [x] `distinct` — `createOperator` wrapping class (see issue #3)
- [x] `toArray` — `@terminal` decorator
- [x] `minMax` — `@terminal` decorator

### Still in `TyneqEnumerableBase` (todo)
- [ ] `any`, `all`, `contains`, `count`, `countBy`
- [ ] `first`, `firstOrDefault`, `last`, `lastOrDefault`, `single`, `singleOrDefault`
- [ ] `elementAt`, `elementAtOrDefault`, `indexOf`
- [ ] `sum`, `average`, `min`, `max`, `minBy`, `maxBy`
- [ ] `aggregate`
- [ ] `sequenceEqual`, `startsWith`, `isNullOrEmpty`
- [ ] `consume`, `defaultIfEmpty`
- [ ] `toMap`, `toRecord`, `toSet`
- [ ] `orderBy`, `orderByDescending`, `thenBy`, `thenByDescending`
- [ ] `groupBy`, `groupJoin`, `join`
- [ ] `except`, `exceptBy`, `intersect`, `intersectBy`, `union`, `unionBy`
- [ ] `distinct`, `distinctBy`
- [ ] `reverse`, `shuffle`
- [ ] `skip`, `skipLast`, `skipWhile`, `take`, `takeWhile`
- [ ] `chunk`, `split`, `pairwise`
- [ ] `append`, `prepend`, `concat`
- [ ] `zip`, `selectMany`
- [ ] `tap`, `tapIf`
- [ ] `throttle`, `populate`
- [ ] `backsert`
- [ ] `pipe`

### Immediate fixes (before continuing migration)
- [ ] Remove dead manual registration block from `scan.ts` (lines 92–101) + unused import
- [ ] Fix `select.ts` class/registration disconnect (Option A: use `@operator` on the class)
